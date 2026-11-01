'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from '@/components/IconButton'
import { spring } from '@/foundations/motionTokens'
import { ChevronLeft, createIconElement } from '@/icons'
import { AnchorContextSurface } from '@/primitives/anchorContextSurface'
import {
  ANCHOR_PANEL_FALLBACK_SIZE_PX,
  computeAnchorPanelPosition,
  type AnchorPanelPosition,
} from '@/primitives/anchorPanelPosition'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
import { cn } from '@/utils/cn'
import { isMousePointer } from '@/utils/pointer'

const SIDEBAR_FLYOUT_ZONE = 'data-sidebar-flyout-zone'
const SIDEBAR_FLYOUT_ZONE_SELECTOR = `[${SIDEBAR_FLYOUT_ZONE}]`

function isWithinSidebarFlyoutZone(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(`[${SIDEBAR_FLYOUT_ZONE}]`))
}

export type SidebarItem = {
  id: string
  label: string
  href: string
  icon?: React.ReactNode
  children?: SidebarItem[]
}

const sidebarRootVariants = cva(
  'relative z-20 flex h-full min-h-0 shrink-0 flex-col bg-surface transition-[width] duration-spatial-default ease-standard',
  {
    variants: {
      collapsed: {
        true: 'w-14',
        false: 'w-56',
      },
      bordered: {
        true: 'border-r border-border',
        false: '',
      },
    },
    defaultVariants: { collapsed: false, bordered: true },
  },
)

const navLinkClass = (active: boolean) =>
  cn(
    'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium no-underline transition-colors duration-effects-fast ease-standard hover:no-underline',
    active ? 'bg-secondary text-fg' : 'text-fg-subtle hover:bg-secondary/60 hover:text-fg',
  )

const groupButtonClass = (active: boolean) =>
  cn(
    'flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors duration-effects-fast ease-standard',
    active ? 'bg-secondary text-fg' : 'text-fg-subtle hover:bg-secondary/60 hover:text-fg',
  )

function depthPadStyle(depth: number, stepRem = 0.5): CSSProperties {
  return { '--ds-sidebar-depth-pad': `${depth * stepRem}rem` } as CSSProperties
}

export type SidebarNavigateOptions = {
  /** Cmd/Ctrl + click: 새 탭에서 열기 */
  openInNewTab: boolean
  /** Cmd/Ctrl + Shift + click: 백그라운드 탭에서 열기 */
  openInBackground: boolean
}

export type SidebarProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  items: SidebarItem[]
  activeItemId: string
  /**
   * 항목 클릭 콜백.
   * `options.openInNewTab` / `options.openInBackground`으로 modifier 키 의도를 전달합니다.
   * 내부적으로 link 기본 동작은 `preventDefault`로 막아 SPA 라우팅을 보장합니다.
   */
  onNavigate: (id: string, href: string, options: SidebarNavigateOptions) => void
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapseChange?: (collapsed: boolean) => void
  /** 서비스 로고·브랜드 영역 슬롯 (사이드바 상단) */
  brandBlock?: React.ReactNode
  /**
   * 사용자 프로필·계정 영역 슬롯 (사이드바 하단, collapse-toggle 위).
   * ReactNode 또는 `(collapsed: boolean) => ReactNode` render function 모두 허용합니다.
   * render function을 사용하면 collapsed 상태에 따라 내부 레이아웃을 직접 제어할 수 있습니다.
   */
  profileBlock?: React.ReactNode | ((collapsed: boolean) => React.ReactNode)
  /**
   * `true`(기본): 우측 경계선 및 내부 구분선을 표시합니다.
   * `false`: 모든 분리선을 제거합니다. 배경이 같은 캔버스 레이아웃에서 사용합니다.
   */
  bordered?: boolean
} & Omit<Partial<VariantProps<typeof sidebarRootVariants>>, 'bordered'>

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex transition-transform duration-effects-default ease-snappy',
        collapsed && 'rotate-180',
      )}
    >
      {createIconElement(ChevronLeft, 'md')}
    </span>
  )
}

function GroupChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      data-slot="sidebar-group-chevron"
      className={cn(
        'inline-flex shrink-0 transition-transform duration-effects-fast ease-snappy',
        expanded && '-rotate-90',
      )}
      aria-hidden
    >
      {createIconElement(ChevronLeft, 'sm')}
    </span>
  )
}

function collectGroupIdsWithActiveDescendant(
  items: readonly SidebarItem[],
  activeItemId: string,
): Set<string> {
  const result = new Set<string>()
  for (const item of items) {
    if (!item.children?.length) continue
    const nested = collectGroupIdsWithActiveDescendant(item.children, activeItemId)
    const hasActive = item.children.some((c) => c.id === activeItemId) || nested.size > 0
    if (hasActive) result.add(item.id)
    for (const id of nested) result.add(id)
  }
  return result
}

function isGroupActive(item: SidebarItem, activeItemId: string): boolean {
  if (!item.children?.length) return false
  return item.children.some(
    (child) =>
      child.id === activeItemId ||
      (child.children?.length ? isGroupActive(child, activeItemId) : false),
  )
}

type SidebarNavLinkProps = {
  item: SidebarItem
  active: boolean
  collapsed: boolean
  onNavigate: SidebarProps['onNavigate']
}

function SidebarNavLink({ item, active, collapsed, onNavigate }: SidebarNavLinkProps) {
  return (
    <a
      data-slot="sidebar-nav-item"
      href={item.href}
      className={navLinkClass(active)}
      aria-current={active ? 'page' : undefined}
      title={collapsed ? item.label : undefined}
      onClick={(e) => {
        e.preventDefault()
        const isModifier = e.metaKey || e.ctrlKey
        onNavigate(item.id, item.href, {
          openInNewTab: isModifier && !e.shiftKey,
          openInBackground: isModifier && e.shiftKey,
        })
      }}
    >
      {item.icon ? (
        <span
          data-slot="sidebar-icon"
          className={cn('inline-flex shrink-0 justify-center', collapsed ? 'w-full' : '')}
        >
          {item.icon}
        </span>
      ) : null}
      <span data-slot="sidebar-label" className={cn('min-w-0 truncate', collapsed && 'sr-only')}>
        {item.label}
      </span>
    </a>
  )
}

const flyoutPanelClassName =
  'max-h-[min(24rem,calc(100dvh-1rem))] min-w-44 max-w-xs overflow-hidden p-0'

function FlyoutSubmenuChevron() {
  return (
    <span
      data-slot="sidebar-flyout-submenu-chevron"
      className="inline-flex shrink-0 rotate-180"
      aria-hidden
    >
      {createIconElement(ChevronLeft, 'sm')}
    </span>
  )
}

type SidebarCollapsedFlyoutRowProps = {
  item: SidebarItem
  activeItemId: string
  submenuOpen: boolean
  submenuId: string
  onNavigate: SidebarProps['onNavigate']
  onCloseAll: () => void
  onSubmenuOpen: (item: SidebarItem, rowEl: HTMLElement) => void
  onSubmenuClose: () => void
}

function SidebarCollapsedFlyoutRow({
  item,
  activeItemId,
  submenuOpen,
  submenuId,
  onNavigate,
  onCloseAll,
  onSubmenuOpen,
  onSubmenuClose,
}: SidebarCollapsedFlyoutRowProps) {
  const hasChildren = Boolean(item.children?.length)
  const active =
    item.id === activeItemId || (hasChildren ? isGroupActive(item, activeItemId) : false)
  const rowRef = useRef<HTMLLIElement>(null)

  const openSubmenu = useCallback(() => {
    if (!hasChildren || !rowRef.current) return
    onSubmenuOpen(item, rowRef.current)
  }, [hasChildren, item, onSubmenuOpen])

  if (hasChildren) {
    return (
      <li
        ref={rowRef}
        role="none"
        onPointerEnter={(e) => {
          if (isMousePointer(e)) openSubmenu()
        }}
        onFocus={openSubmenu}
        onPointerLeave={(e) => {
          if (!isMousePointer(e)) return
          if (isWithinSidebarFlyoutZone(e.relatedTarget)) return
          onSubmenuClose()
        }}
      >
        <button
          type="button"
          data-slot="sidebar-flyout-submenu-trigger"
          role="menuitem"
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors duration-effects-fast ease-standard',
            active || submenuOpen
              ? 'bg-secondary text-fg'
              : 'text-fg-subtle hover:bg-secondary/60 hover:text-fg',
          )}
          aria-haspopup="menu"
          aria-expanded={submenuOpen}
          aria-controls={submenuOpen ? submenuId : undefined}
          onClick={(e) => {
            e.stopPropagation()
            if (submenuOpen) {
              onSubmenuClose()
            } else {
              openSubmenu()
            }
          }}
        >
          {item.icon ? (
            <span data-slot="sidebar-icon" className="inline-flex shrink-0">
              {item.icon}
            </span>
          ) : null}
          <span data-slot="sidebar-label" className="min-w-0 flex-1 truncate">
            {item.label}
          </span>
          <FlyoutSubmenuChevron />
        </button>
      </li>
    )
  }

  return (
    <li
      ref={rowRef}
      role="none"
      onPointerEnter={(e) => {
        if (isMousePointer(e)) onSubmenuClose()
      }}
      onFocus={onSubmenuClose}
    >
      <a
        data-slot="sidebar-flyout-item"
        href={item.href}
        role="menuitem"
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm no-underline transition-colors duration-effects-fast ease-standard hover:no-underline',
          active ? 'bg-secondary text-fg' : 'text-fg-subtle hover:bg-secondary/60 hover:text-fg',
        )}
        aria-current={active ? 'page' : undefined}
        onClick={(e) => {
          e.preventDefault()
          const isModifier = e.metaKey || e.ctrlKey
          onNavigate(item.id, item.href, {
            openInNewTab: isModifier && !e.shiftKey,
            openInBackground: isModifier && e.shiftKey,
          })
          onCloseAll()
        }}
      >
        {item.icon ? (
          <span data-slot="sidebar-icon" className="inline-flex shrink-0">
            {item.icon}
          </span>
        ) : null}
        <span data-slot="sidebar-label" className="min-w-0 truncate">
          {item.label}
        </span>
      </a>
    </li>
  )
}

type SidebarCollapsedFlyoutMenuProps = {
  title: string
  items: SidebarItem[]
  activeItemId: string
  onNavigate: SidebarProps['onNavigate']
  onCloseAll: () => void
}

function SidebarCollapsedFlyoutMenu({
  title,
  items,
  activeItemId,
  onNavigate,
  onCloseAll,
}: SidebarCollapsedFlyoutMenuProps) {
  const submenuPanelId = useId()
  const [submenuItem, setSubmenuItem] = useState<SidebarItem | null>(null)
  const [submenuAnchorEl, setSubmenuAnchorEl] = useState<HTMLElement | null>(null)

  const handleSubmenuOpen = useCallback((item: SidebarItem, rowEl: HTMLElement) => {
    if (!item.children?.length) return
    setSubmenuItem(item)
    setSubmenuAnchorEl(rowEl)
  }, [])

  const handleSubmenuClose = useCallback(() => {
    setSubmenuItem(null)
    setSubmenuAnchorEl(null)
  }, [])

  return (
    <div
      {...{ [SIDEBAR_FLYOUT_ZONE]: '' }}
      data-slot="sidebar-collapsed-flyout"
      className="relative max-h-[min(24rem,calc(100dvh-1rem))] overflow-y-auto py-1"
      onPointerLeave={(e) => {
        if (!isMousePointer(e)) return
        if (isWithinSidebarFlyoutZone(e.relatedTarget)) return
        handleSubmenuClose()
      }}
    >
      <p
        data-slot="sidebar-flyout-heading"
        className="px-3 py-1.5 text-xs font-semibold tracking-wide text-fg-muted uppercase"
      >
        {title}
      </p>
      <ul
        data-slot="sidebar-flyout-list"
        role="menu"
        className="flex flex-col gap-0.5 px-1 pb-1"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onCloseAll()
            return
          }
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End')
            return
          const menuItems = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
          )
          const idx = menuItems.indexOf(document.activeElement as HTMLElement)
          if (idx < 0) return
          e.preventDefault()
          let next = idx
          if (e.key === 'ArrowDown') next = Math.min(idx + 1, menuItems.length - 1)
          else if (e.key === 'ArrowUp') next = Math.max(idx - 1, 0)
          else if (e.key === 'Home') next = 0
          else if (e.key === 'End') next = menuItems.length - 1
          menuItems[next]?.focus()
        }}
      >
        {items.map((child) => (
          <SidebarCollapsedFlyoutRow
            key={child.id}
            item={child}
            activeItemId={activeItemId}
            submenuOpen={submenuItem?.id === child.id}
            submenuId={submenuPanelId}
            onNavigate={onNavigate}
            onCloseAll={onCloseAll}
            onSubmenuOpen={handleSubmenuOpen}
            onSubmenuClose={handleSubmenuClose}
          />
        ))}
      </ul>
      {submenuItem?.children?.length && submenuAnchorEl ? (
        <SidebarCollapsedFlyoutCascadePanel
          id={submenuPanelId}
          title={submenuItem.label}
          items={submenuItem.children}
          anchorEl={submenuAnchorEl}
          activeItemId={activeItemId}
          onNavigate={onNavigate}
          onCloseAll={onCloseAll}
        />
      ) : null}
    </div>
  )
}

type SidebarCollapsedFlyoutCascadePanelProps = {
  id: string
  title: string
  items: SidebarItem[]
  anchorEl: HTMLElement
  activeItemId: string
  onNavigate: SidebarProps['onNavigate']
  onCloseAll: () => void
}

function computeCascadePanelPosition(
  anchorEl: HTMLElement,
  panelEl: HTMLDivElement | null,
): AnchorPanelPosition {
  const panelWidth = panelEl?.offsetWidth || ANCHOR_PANEL_FALLBACK_SIZE_PX.width
  const panelHeight = panelEl?.offsetHeight || ANCHOR_PANEL_FALLBACK_SIZE_PX.height
  return computeAnchorPanelPosition({
    anchorRect: anchorEl.getBoundingClientRect(),
    panelWidth,
    panelHeight,
    placement: 'right',
  })
}

function SidebarCollapsedFlyoutCascadePanel({
  id,
  title,
  items,
  anchorEl,
  activeItemId,
  onNavigate,
  onCloseAll,
}: SidebarCollapsedFlyoutCascadePanelProps) {
  const portalRoot = usePortalRoot()
  const nestedPanelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<AnchorPanelPosition>(() =>
    computeCascadePanelPosition(anchorEl, null),
  )
  const [mounted, setMounted] = useState(false)
  const [nestedSubmenu, setNestedSubmenu] = useState<{
    item: SidebarItem
    anchorEl: HTMLElement
  } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const updatePosition = useCallback(() => {
    setPosition(computeCascadePanelPosition(anchorEl, panelRef.current))
  }, [anchorEl])

  useLayoutEffect(() => {
    updatePosition()
    const onReflow = () => updatePosition()
    window.addEventListener('resize', onReflow)
    window.addEventListener('scroll', onReflow, true)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onReflow) : null
    ro?.observe(anchorEl)
    if (panelRef.current) ro?.observe(panelRef.current)
    return () => {
      window.removeEventListener('resize', onReflow)
      window.removeEventListener('scroll', onReflow, true)
      ro?.disconnect()
    }
  }, [anchorEl, updatePosition, nestedSubmenu, items])

  const handleNestedSubmenuOpen = useCallback((item: SidebarItem, rowEl: HTMLElement) => {
    if (!item.children?.length) return
    setNestedSubmenu({ item, anchorEl: rowEl })
  }, [])

  const handleNestedSubmenuClose = useCallback(() => {
    setNestedSubmenu(null)
  }, [])

  const panelNode = (
    <Panel
      ref={panelRef}
      id={id}
      role="menu"
      variant="list"
      appearance="glass"
      shape="list"
      scrollHint={false}
      position="fixed"
      offset="none"
      data-slot="sidebar-collapsed-flyout-cascade"
      {...{ [SIDEBAR_FLYOUT_ZONE]: '' }}
      className={cn(
        flyoutPanelClassName,
        'top-[var(--ds-sidebar-flyout-top)] left-[var(--ds-sidebar-flyout-left)] z-[1001]',
      )}
      style={
        {
          '--ds-sidebar-flyout-top': `${position.top}px`,
          '--ds-sidebar-flyout-left': `${position.left}px`,
        } as CSSProperties
      }
      onPointerLeave={(e) => {
        if (!isMousePointer(e)) return
        if (isWithinSidebarFlyoutZone(e.relatedTarget)) return
        handleNestedSubmenuClose()
      }}
    >
      <p
        data-slot="sidebar-flyout-heading"
        className="px-3 py-1.5 text-xs font-semibold tracking-wide text-fg-muted uppercase"
      >
        {title}
      </p>
      <ul
        data-slot="sidebar-flyout-list"
        role="menu"
        className="flex flex-col gap-0.5 px-1 pb-1"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault()
            onCloseAll()
            return
          }
          if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End')
            return
          const menuItems = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
          )
          const idx = menuItems.indexOf(document.activeElement as HTMLElement)
          if (idx < 0) return
          e.preventDefault()
          let next = idx
          if (e.key === 'ArrowDown') next = Math.min(idx + 1, menuItems.length - 1)
          else if (e.key === 'ArrowUp') next = Math.max(idx - 1, 0)
          else if (e.key === 'Home') next = 0
          else if (e.key === 'End') next = menuItems.length - 1
          menuItems[next]?.focus()
        }}
      >
        {items.map((child) => (
          <SidebarCollapsedFlyoutRow
            key={child.id}
            item={child}
            activeItemId={activeItemId}
            submenuOpen={nestedSubmenu?.item.id === child.id}
            submenuId={nestedPanelId}
            onNavigate={onNavigate}
            onCloseAll={onCloseAll}
            onSubmenuOpen={handleNestedSubmenuOpen}
            onSubmenuClose={handleNestedSubmenuClose}
          />
        ))}
      </ul>
      {nestedSubmenu?.item.children?.length ? (
        <SidebarCollapsedFlyoutCascadePanel
          id={nestedPanelId}
          title={nestedSubmenu.item.label}
          items={nestedSubmenu.item.children}
          anchorEl={nestedSubmenu.anchorEl}
          activeItemId={activeItemId}
          onNavigate={onNavigate}
          onCloseAll={onCloseAll}
        />
      ) : null}
    </Panel>
  )

  if (!mounted) return null
  return createPortal(panelNode, portalRoot)
}

type SidebarCollapsedFlyoutProps = {
  item: SidebarItem
  activeItemId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate: SidebarProps['onNavigate']
}

function SidebarCollapsedFlyout({
  item,
  activeItemId,
  open,
  onOpenChange,
  onNavigate,
}: SidebarCollapsedFlyoutProps) {
  const groupActive = isGroupActive(item, activeItemId)
  const closeAll = useCallback(() => onOpenChange(false), [onOpenChange])

  return (
    <AnchorContextSurface
      data-slot="sidebar-collapsed-flyout-anchor"
      className="w-full"
      open={open}
      onOpenChange={onOpenChange}
      portaled
      panelPlacement="right"
      panelVariant="list"
      panelScrollHint={false}
      panelRole="menu"
      panelDismissIgnoreSelector={SIDEBAR_FLYOUT_ZONE_SELECTOR}
      panelClassName={flyoutPanelClassName}
      panel={
        item.children?.length ? (
          <SidebarCollapsedFlyoutMenu
            title={item.label}
            items={item.children}
            activeItemId={activeItemId}
            onNavigate={onNavigate}
            onCloseAll={closeAll}
          />
        ) : null
      }
      surface={
        <button
          type="button"
          data-slot="sidebar-nav-group-trigger"
          className={groupButtonClass(groupActive)}
          aria-expanded={open}
          aria-haspopup="menu"
          title={item.label}
          onClick={() => onOpenChange(!open)}
        >
          {item.icon ? (
            <span data-slot="sidebar-icon" className="inline-flex w-full shrink-0 justify-center">
              {item.icon}
            </span>
          ) : (
            <span className="w-full text-center text-xs font-semibold">
              {item.label.slice(0, 1)}
            </span>
          )}
          <span className="sr-only">{item.label}</span>
        </button>
      }
    />
  )
}

type SidebarNavGroupProps = {
  item: SidebarItem
  activeItemId: string
  collapsed: boolean
  depth: number
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onNavigate: SidebarProps['onNavigate']
  flyoutOpen: boolean
  onFlyoutOpenChange: (open: boolean) => void
  expandedGroupIds: Set<string>
  onExpandedGroupChange: (groupId: string, expanded: boolean) => void
  openFlyoutGroupId: string | null
  onFlyoutOpenChangeId: (groupId: string | null) => void
}

function SidebarNavGroup({
  item,
  activeItemId,
  collapsed,
  depth,
  expanded,
  onExpandedChange,
  onNavigate,
  flyoutOpen,
  onFlyoutOpenChange,
  expandedGroupIds,
  onExpandedGroupChange,
  openFlyoutGroupId,
  onFlyoutOpenChangeId,
}: SidebarNavGroupProps) {
  if (collapsed) {
    return (
      <SidebarCollapsedFlyout
        item={item}
        activeItemId={activeItemId}
        open={flyoutOpen}
        onOpenChange={onFlyoutOpenChange}
        onNavigate={onNavigate}
      />
    )
  }

  const groupActive = isGroupActive(item, activeItemId)

  return (
    <div data-slot="sidebar-nav-group" className="flex flex-col gap-0.5">
      <button
        type="button"
        data-slot="sidebar-nav-group-trigger"
        className={groupButtonClass(groupActive)}
        aria-expanded={expanded}
        onClick={() => onExpandedChange(!expanded)}
      >
        {item.icon ? (
          <span data-slot="sidebar-icon" className="inline-flex shrink-0">
            {item.icon}
          </span>
        ) : null}
        <span data-slot="sidebar-label" className="min-w-0 flex-1 truncate text-left">
          {item.label}
        </span>
        <GroupChevron expanded={expanded} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && item.children?.length ? (
          <motion.ul
            key="sub-list"
            data-slot="sidebar-nav-sub-list"
            className="flex flex-col gap-0.5 overflow-hidden border-l border-border pl-2"
            style={depthPadStyle(depth + 1)}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.standard}
          >
            {item.children.map((child) => (
              <li key={child.id}>
                <SidebarNavNode
                  item={child}
                  activeItemId={activeItemId}
                  collapsed={collapsed}
                  depth={depth + 1}
                  expandedGroupIds={expandedGroupIds}
                  onExpandedGroupChange={onExpandedGroupChange}
                  onNavigate={onNavigate}
                  openFlyoutGroupId={openFlyoutGroupId}
                  onFlyoutOpenChange={onFlyoutOpenChangeId}
                />
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

type SidebarNavNodeProps = {
  item: SidebarItem
  activeItemId: string
  collapsed: boolean
  depth: number
  expandedGroupIds: Set<string>
  onExpandedGroupChange: (groupId: string, expanded: boolean) => void
  onNavigate: SidebarProps['onNavigate']
  openFlyoutGroupId: string | null
  onFlyoutOpenChange: (groupId: string | null) => void
}

function SidebarNavNode({
  item,
  activeItemId,
  collapsed,
  depth,
  expandedGroupIds,
  onExpandedGroupChange,
  onNavigate,
  openFlyoutGroupId,
  onFlyoutOpenChange,
}: SidebarNavNodeProps) {
  const hasChildren = Boolean(item.children?.length)

  if (hasChildren) {
    return (
      <SidebarNavGroup
        item={item}
        activeItemId={activeItemId}
        collapsed={collapsed}
        depth={depth}
        expanded={expandedGroupIds.has(item.id)}
        onExpandedChange={(next) => onExpandedGroupChange(item.id, next)}
        onNavigate={onNavigate}
        flyoutOpen={openFlyoutGroupId === item.id}
        onFlyoutOpenChange={(open) => onFlyoutOpenChange(open ? item.id : null)}
        expandedGroupIds={expandedGroupIds}
        onExpandedGroupChange={onExpandedGroupChange}
        openFlyoutGroupId={openFlyoutGroupId}
        onFlyoutOpenChangeId={onFlyoutOpenChange}
      />
    )
  }

  return (
    <SidebarNavLink
      item={item}
      active={item.id === activeItemId}
      collapsed={collapsed}
      onNavigate={onNavigate}
    />
  )
}

function Sidebar({
  className,
  items,
  activeItemId,
  onNavigate,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapseChange,
  brandBlock,
  profileBlock,
  bordered = true,
  ...props
}: SidebarProps) {
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed)
  const isControlled = collapsedProp !== undefined
  const collapsed = isControlled ? collapsedProp! : innerCollapsed

  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(() => new Set())
  const [openFlyoutGroupId, setOpenFlyoutGroupId] = useState<string | null>(null)

  const activeBranchGroupIds = useMemo(
    () => collectGroupIdsWithActiveDescendant(items, activeItemId),
    [items, activeItemId],
  )

  useEffect(() => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      for (const id of activeBranchGroupIds) next.add(id)
      return next
    })
  }, [activeBranchGroupIds])

  useEffect(() => {
    if (!collapsed) setOpenFlyoutGroupId(null)
  }, [collapsed])

  function setCollapsed(next: boolean) {
    if (!isControlled) setInnerCollapsed(next)
    onCollapseChange?.(next)
  }

  const handleExpandedGroupChange = useCallback((groupId: string, expanded: boolean) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev)
      if (expanded) next.add(groupId)
      else next.delete(groupId)
      return next
    })
  }, [])

  function handleNavKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const focusable = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        'a[data-slot="sidebar-nav-item"], button[data-slot="sidebar-nav-group-trigger"]',
      ),
    )
    const current = document.activeElement as HTMLElement
    const idx = focusable.indexOf(current)
    if (idx < 0) return
    e.preventDefault()
    const next =
      e.key === 'ArrowDown' ? Math.min(idx + 1, focusable.length - 1) : Math.max(idx - 1, 0)
    focusable[next]?.focus()
  }

  return (
    <aside
      data-slot="sidebar-root"
      className={cn(sidebarRootVariants({ collapsed, bordered }), className)}
      {...props}
    >
      {brandBlock ? (
        <div
          data-slot="sidebar-brand-block"
          className={cn('shrink-0 p-2', collapsed && 'px-1', bordered && 'border-b border-border')}
        >
          {brandBlock}
        </div>
      ) : null}

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown delegated to inner nav item buttons */}
      <nav
        data-slot="sidebar-nav-list"
        className={cn(
          'min-h-0 flex-1 space-y-0.5 p-2',
          collapsed ? 'overflow-visible' : 'overflow-y-auto',
        )}
        aria-label="사이드바 탐색"
        onKeyDown={handleNavKeyDown}
      >
        {items.map((item) => (
          <SidebarNavNode
            key={item.id}
            item={item}
            activeItemId={activeItemId}
            collapsed={collapsed}
            depth={0}
            expandedGroupIds={expandedGroupIds}
            onExpandedGroupChange={handleExpandedGroupChange}
            onNavigate={onNavigate}
            openFlyoutGroupId={openFlyoutGroupId}
            onFlyoutOpenChange={setOpenFlyoutGroupId}
          />
        ))}
      </nav>

      {profileBlock ? (
        <div
          data-slot="sidebar-profile-block"
          className={cn('shrink-0 p-2', collapsed && 'px-1', bordered && 'border-t border-border')}
        >
          {typeof profileBlock === 'function' ? profileBlock(collapsed) : profileBlock}
        </div>
      ) : null}

      <div
        data-slot="sidebar-collapse-toggle"
        className={cn('shrink-0 p-2', bordered && 'border-t border-border')}
      >
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          shape="rounded"
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-pressed={collapsed}
          className={cn(!collapsed && 'w-full')}
          onClick={() => setCollapsed(!collapsed)}
        >
          <CollapseIcon collapsed={collapsed} />
        </IconButton>
      </div>
    </aside>
  )
}

export { Sidebar, sidebarRootVariants }
