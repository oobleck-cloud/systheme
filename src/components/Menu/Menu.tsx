'use client'

import { AnimatePresence } from 'motion/react'
import { cloneElement, isValidElement, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Divider } from '@/components/layout/Divider'
import { spring } from '@/foundations/motionTokens'
import { useDismissOnEscape } from '@/primitives/anchorPopover'
import { useInteractionContext } from '@/primitives/interaction'
import { MotionPanel } from '@/primitives/panelMotion'
import { usePortalRoot } from '@/primitives/portalRoot'
import { useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'
import { dropdownListShellVariants, dropdownOptionDensityVariants } from '@/utils/dropdownDensity'

export type MenuItem = {
  id: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  /**
   * 되돌릴 수 없는 동작을 색으로 갈라 놓는다.
   *
   * 이름은 Alert/Toast 의 `severity: 'danger'` 를 따랐다 — `ToastRecord` 처럼 "배열로 넘기는
   * 데이터 레코드"가 위험도를 말하는 방식이 DS 안에서 이미 severity 다(`tone: 'destructive'` 는
   * Toolbar 처럼 자식 엘리먼트의 렌더 축을 지정하는 자리에 쓴다).
   *
   * 색은 `destructive`(red-500 고정) 가 아니라 `error-text`. destructive 는 채워진 버튼 배경용이라
   * 흰 배경 위 작은 글자로 쓰면 대비가 모자라고, 다크에서도 red-500 그대로다.
   */
  severity?: 'danger'
  /**
   * 라벨 아래 한 줄 보조 설명. 라벨만으로 결과를 담을 수 없는 항목에 쓴다
   * (예: "탭에서 제거"=내 화면만 vs "뷰 삭제"=남의 화면에서도 사라짐).
   *
   * 이름에 섞여 읽히면 항목 이름이 길어져 오히려 고르기 어려우므로, 이름은
   * 라벨로 고정(`aria-labelledby`)하고 설명은 `aria-describedby` 로 떼어 붙인다.
   */
  description?: React.ReactNode
}

/** 그룹 경계 — 파괴적 항목을 나머지에서 떼어 놓는 줄. 고를 수 없으니 방향키도 건너뛴다. */
export type MenuSeparator = { type: 'separator' }

/** `items` 한 칸 — 고를 수 있는 항목이거나, 그룹 경계이거나. */
export type MenuEntry = MenuItem | MenuSeparator

/** `type` 필드는 구분선에만 있다 — 항목에는 없으므로 이 한 줄로 갈린다. */
const isSeparator = (entry: MenuEntry): entry is MenuSeparator => 'type' in entry

export type MenuTriggerProps = {
  onClick: (e: React.MouseEvent) => void
  'aria-controls': string | undefined
  'aria-expanded': boolean
  'aria-haspopup': 'menu'
}

export type MenuProps = {
  /** 항목과 구분선이 섞인 배열. 구분선을 안 쓰면 종전 `MenuItem[]` 그대로다. */
  items: MenuEntry[]
  onSelect: (id: string) => void
  /**
   * 트리거 엘리먼트.
   * - `ReactNode`: 단일 React 엘리먼트. `onClick` + ARIA 속성이 `cloneElement`로 주입됩니다.
   * - `(props: MenuTriggerProps) => ReactNode`: 명시적 render function. props를 직접 내려받습니다.
   */
  trigger: React.ReactNode | ((props: MenuTriggerProps) => React.ReactNode)
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  density?: 'compact' | 'default' | 'loose'
  className?: string
}

/**
 * 항목 한 줄. 새 필드(severity/description)를 안 쓰면 렌더 결과가 종전과 동일해야 하므로,
 * id·aria 연결·컬럼 레이아웃은 전부 "설명줄이 있을 때만" 덧붙인다.
 */
function MenuItemRow({
  item,
  density,
  menuId,
  itemProps,
  onSelect,
}: {
  item: MenuItem
  density: NonNullable<MenuProps['density']>
  menuId: string
  itemProps: React.HTMLAttributes<HTMLElement>
  onSelect: (id: string) => void
}) {
  const danger = item.severity === 'danger'
  const labelId = item.description ? `${menuId}-${item.id}-label` : undefined
  const descriptionId = item.description ? `${menuId}-${item.id}-description` : undefined

  return (
    <li role="none">
      <button
        type="button"
        role="menuitem"
        data-slot="menu-menu-item"
        data-severity={danger ? 'danger' : undefined}
        disabled={item.disabled}
        tabIndex={item.disabled ? -1 : itemProps.tabIndex}
        onClick={() => !item.disabled && onSelect(item.id)}
        onFocus={itemProps.onFocus}
        // 설명이 이름에 섞이면 항목 이름이 길어져 오히려 고르기 어렵다 — 이름은 라벨로 고정한다.
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        className={cn(
          'flex w-full cursor-pointer gap-2 text-left transition-colors outline-none select-none',
          // 설명줄이 있으면 아이콘·라벨이 첫 줄에 맞춰 붙어야 한다.
          item.description ? 'items-start' : 'items-center',
          dropdownOptionDensityVariants({ density }),
          'hover:bg-surface focus-visible:bg-surface',
          danger && 'text-error-text hover:bg-error-subtle focus-visible:bg-error-subtle',
          item.disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <MenuItemContent
          item={item}
          danger={danger}
          labelId={labelId}
          descriptionId={descriptionId}
        />
      </button>
    </li>
  )
}

function MenuItemContent({
  item,
  danger,
  labelId,
  descriptionId,
}: {
  item: MenuItem
  danger: boolean
  labelId: string | undefined
  descriptionId: string | undefined
}) {
  return (
    <>
      {item.icon ? (
        <span
          className={cn(
            'inline-flex shrink-0',
            // 위험 항목은 아이콘도 같은 색으로 — 회색 아이콘에 빨간 라벨이면 따로 논다.
            danger ? 'text-current' : 'text-fg-muted',
            item.description && 'mt-0.5',
          )}
        >
          {item.icon}
        </span>
      ) : null}
      {item.description ? (
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span id={labelId} data-slot="menu-label" className="truncate">
            {item.label}
          </span>
          <span
            id={descriptionId}
            data-slot="menu-description"
            className={cn('text-xs', danger ? 'text-current opacity-80' : 'text-fg-muted')}
          >
            {item.description}
          </span>
        </span>
      ) : (
        <span data-slot="menu-label" className="min-w-0 flex-1 truncate">
          {item.label}
        </span>
      )}
    </>
  )
}

function Menu({
  items,
  onSelect,
  trigger,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  density = 'default',
  className,
}: MenuProps) {
  const portalRoot = usePortalRoot()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : uncontrolledOpen

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // roving focus 가 인덱스 기반(`useInteractionContext({ itemCount })`)이라, 구분선이 섞인
  // `items` 를 그대로 세면 방향키가 구분선 자리에서 한 번 멈춘다(그 칸에는 포커스 받을 게 없다).
  // 그래서 "고를 수 있는 항목"만 따로 세어 그 배열의 인덱스를 getItemProps 에 넘긴다.
  const actionItems: MenuItem[] = []
  const rows = items.map((entry, i) => {
    if (isSeparator(entry)) return { kind: 'separator' as const, key: `separator-${i}` }
    const row = { kind: 'item' as const, key: entry.id, item: entry, index: actionItems.length }
    actionItems.push(entry)
    return row
  })

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open,
    anchorRef: rootRef,
    panelRef,
    placement: 'below',
    onPointerDownOutside: () => setOpen(false),
  })
  // The listbox onKeyDown only fires when focus is inside the menu. Pressing Escape while
  // focus is still on the trigger would otherwise do nothing, so also dismiss at document level.
  useDismissOnEscape(open, () => setOpen(false))

  // Refs for stable access inside onIntent callback
  // 구분선을 뺀 배열이어야 nav.next/prev/last 가 구분선을 세지 않는다.
  const itemsRef = useRef(actionItems)
  itemsRef.current = actionItems
  // Declare focusedIndexRef before useInteractionContext so it's available in onIntent
  const focusedIndexRef = useRef(0)

  const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
    kind: 'list',
    itemCount: actionItems.length,
    onIntent: (intent) => {
      const currentItems = itemsRef.current
      const currentIdx = focusedIndexRef.current
      switch (intent.type) {
        case 'nav.next':
          setFocusedIndex(Math.min(currentIdx + 1, currentItems.length - 1))
          return true
        case 'nav.prev':
          setFocusedIndex(Math.max(currentIdx - 1, 0))
          return true
        case 'nav.first':
          setFocusedIndex(0)
          return true
        case 'nav.last':
          setFocusedIndex(currentItems.length - 1)
          return true
        case 'cancel':
          setOpen(false)
          return true
        case 'activate': {
          const item = currentItems[currentIdx]
          if (item && !item.disabled) handleSelect(item.id)
          return true
        }
        default:
          return false
      }
    },
  })

  // Keep focusedIndexRef in sync with the hook's state
  focusedIndexRef.current = focusedIndex

  function handleSelect(id: string) {
    onSelect(id)
    setOpen(false)
  }

  const triggerProps: MenuTriggerProps = {
    'aria-controls': open ? menuId : undefined,
    'aria-expanded': open,
    'aria-haspopup': 'menu' as const,
    onClick: (e: React.MouseEvent) => {
      if (typeof trigger !== 'function' && isValidElement(trigger)) {
        const ch = trigger as React.ReactElement<{
          onClick?: (ev: React.MouseEvent) => void
        }>
        ch.props.onClick?.(e)
      }
      if (!e.defaultPrevented) setOpen(!open)
    },
  }

  const triggerNode =
    typeof trigger === 'function' ? (
      trigger(triggerProps)
    ) : isValidElement(trigger) ? (
      cloneElement(
        trigger as React.ReactElement<Record<string, unknown>>,
        triggerProps as Record<string, unknown>,
      )
    ) : (
      <button
        type="button"
        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-fg shadow-sm hover:bg-surface"
        {...triggerProps}
      >
        {trigger}
      </button>
    )

  return (
    <div
      ref={rootRef}
      data-slot="menu-root"
      // 트리거 폭에 맞춰 shrink-to-fit. w-full 이면 flex-wrap 툴바에서 한 줄을 독차지한다.
      className={cn('relative inline-flex max-w-full min-w-0 flex-col', className)}
    >
      {triggerNode}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <MotionPanel
                ref={panelRef}
                id={menuId}
                role="menu"
                aria-label="메뉴"
                data-slot="menu-panel"
                position="fixed"
                offset="none"
                className={cn('max-w-xs min-w-[10rem] origin-top py-1', positionClassName)}
                style={panelStyle}
                initial={{ opacity: 0, scaleY: 0.9, y: -4 }}
                animate={{ opacity: 1, scaleY: 1, y: 0, transition: spring.standard }}
                exit={{ opacity: 0, scaleY: 0.9, y: -4, transition: spring.standard }}
              >
                {/* Use onKeyDown from contextProps; role="presentation" since parent has role="menu" */}
                <ul
                  data-slot="panel-scroll-region"
                  className={dropdownListShellVariants({ density })}
                  role="presentation"
                  onKeyDown={contextProps.onKeyDown}
                >
                  {rows.map((row) =>
                    row.kind === 'separator' ? (
                      // li 는 role="none" 으로 지우고 안의 hr 만 menu 의 separator 로 노출한다.
                      // tabIndex 를 주지 않으므로 포커스도, 방향키 정차도 없다.
                      <li key={row.key} role="none" data-slot="menu-separator" className="my-1">
                        <Divider />
                      </li>
                    ) : (
                      <MenuItemRow
                        key={row.key}
                        item={row.item}
                        density={density}
                        menuId={menuId}
                        itemProps={getItemProps(row.index)}
                        onSelect={handleSelect}
                      />
                    ),
                  )}
                </ul>
              </MotionPanel>
            )}
          </AnimatePresence>,
          portalRoot,
        )}
    </div>
  )
}

export { Menu }
