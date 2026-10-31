'use client'

import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  ANCHOR_PANEL_FALLBACK_SIZE_PX,
  ANCHOR_PANEL_VIEWPORT_PAD_PX,
  computeAnchorPanelPosition,
  computePointerAnchorPanelPosition,
} from './anchorPanelPosition'
import { useFocusTrap } from './anchorPopover'
import { DropdownPopover } from './dropdownPopover'
import { MotionPanel } from './panelMotion'

import type { PanelProps } from './panel'

import { spring } from '@/foundations/motionTokens'
import { cn } from '@/utils/cn'

function getOverflowScrollAncestors(start: HTMLElement | null): HTMLElement[] {
  const list: HTMLElement[] = []
  let cur = start?.parentElement ?? null
  while (cur) {
    const s = getComputedStyle(cur)
    const ox = s.overflowX
    const oy = s.overflowY
    if (/(auto|scroll|overlay)/.test(`${ox}${oy}`)) {
      list.push(cur)
    }
    cur = cur.parentElement
  }
  return list
}

export type AnchorContextSurfaceProps = Omit<
  React.ComponentProps<typeof DropdownPopover>,
  'children' | 'open' | 'onOpenChange'
> & {
  /**
   * `full` — `Dropdown`/`Select`처럼 가로 폭을 채울 때 (기본).
   * `inline` — 탭 스트립 등 **가로 나열**; 루트가 `w-full`을 쓰지 않게 합니다.
   */
  layout?: 'full' | 'inline'
  /** Primary hit surface (e.g. tab label); pair with `onContextMenu` on a child for context menus */
  surface: React.ReactNode
  /** Shown while `open`; typically `Menu` content or action list */
  panel: React.ReactNode
  panelRole?: 'menu' | 'dialog' | 'region'
  panelClassName?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /**
   * Render the panel in `document.body` with `position: fixed` so it is not clipped by
   * tab strips / scroll containers (`overflow-x-auto`, etc.). Default `true`.
   */
  portaled?: boolean
  /**
   * `surface` — 트리거/서피스 rect 기준 앵커 (`panelAnchor` 기본).
   * `pointer` — 우클릭 등 커서 좌표 아래에 패널 (`pointerAnchor` 필요).
   */
  panelAnchor?: 'surface' | 'pointer'
  /**
   * `panelAnchor="surface"` 일 때 패널 위치.
   * `below` — 서피스 하단 (SearchFieldAutocomplete 등). `above` — 서피스 상단 (테이블 footer 집계 등).
   * `right` — 서피스 오른쪽 (접힌 사이드바 flyout).
   * `overlay` — 서피스(셀) 위에 겹쳐 그 자리에서 확대 (노션식 셀 편집).
   */
  panelPlacement?: 'below' | 'above' | 'right' | 'overlay'
  /** `panelAnchor="pointer"` 일 때 viewport 좌표 (보통 `contextmenu` 의 clientX/Y) */
  pointerAnchor?: { x: number; y: number } | null
  /** {@link Panel} `variant` — 검색·RichList 는 `list` 권장 */
  panelVariant?: NonNullable<PanelProps['variant']>
  /** Panel appearance override. 기본 `glass` (검색·RichList 제안 포함). */
  panelAppearance?: NonNullable<PanelProps['appearance']>
  /** 포털 패널 가로 폭을 surface rect 에 맞춤 */
  panelMatchSurfaceWidth?: boolean
  /** 패널 루트 scroll hint (기본 true) */
  panelScrollHint?: boolean
  /**
   * 포털 패널 바깥 pointerdown 으로 닫을 때 무시할 추가 영역.
   * 접힌 사이드바 캐스케이드 flyout 등 `document.body`에 포털된 형제 패널용.
   */
  panelDismissIgnoreSelector?: string
  /**
   * `panelRole="dialog"` 처럼 모달 시맨틱이 필요할 때만 `true`. 패널 안으로 포커스를 가두고
   * `aria-modal` 과 함께 사용하세요. 메뉴/오토컴플리트 등 비모달 용도에서는 기본값(false) 유지.
   */
  trapFocus?: boolean
  /** 패널에 `aria-modal` 부여 (모달 dialog 전용) */
  panelAriaModal?: boolean
  /** 패널 접근성 이름 */
  panelAriaLabel?: string
}

/**
 * Slotted trigger + anchored floating panel — same shell as {@link DropdownPopover} + {@link Menu},
 * without prescribing trigger chrome (chevron, etc.). Use for context menus or custom disclosure UIs.
 */
function AnchorContextSurface({
  layout = 'full',
  surface,
  panel,
  panelRole = 'menu',
  panelClassName,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  dismissOnPointerDownOutside = true,
  dismissOnEscape = true,
  portaled = true,
  panelAnchor = 'surface',
  panelPlacement = 'below',
  pointerAnchor = null,
  panelVariant = 'overlay',
  panelAppearance,
  panelMatchSurfaceWidth = false,
  panelScrollHint = true,
  panelDismissIgnoreSelector,
  trapFocus = false,
  panelAriaModal,
  panelAriaLabel,
  ...props
}: AnchorContextSurfaceProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : uncontrolledOpen
  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const surfaceWrapRef = useRef<HTMLDivElement>(null)
  const panelWrapRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width?: number }>({
    top: 0,
    left: 0,
  })
  // 포털은 클라이언트에서만 렌더 — SSR 렌더 중 `document.body` 접근으로 인한 크래시 방지.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  useFocusTrap(panelWrapRef, open && trapFocus)

  const rootLayout = layout === 'inline' ? 'inline-flex w-auto max-w-full shrink-0' : 'min-w-0'

  const surfaceWrap = layout === 'inline' ? 'min-w-0' : 'min-w-0 flex-1'

  const updatePanelPosition = useCallback(() => {
    const panelEl = panelWrapRef.current
    const panelWidth = panelEl?.offsetWidth ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.width
    const panelHeight = panelEl?.offsetHeight ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.height

    if (panelAnchor === 'pointer' && pointerAnchor) {
      setPanelPos(
        computePointerAnchorPanelPosition({
          pointerX: pointerAnchor.x,
          pointerY: pointerAnchor.y,
          panelWidth,
          panelHeight,
        }),
      )
      return
    }

    const el = surfaceWrapRef.current
    if (!el) return

    setPanelPos(
      computeAnchorPanelPosition({
        anchorRect: el.getBoundingClientRect(),
        panelWidth,
        panelHeight,
        placement: panelPlacement,
        matchSurfaceWidth: panelMatchSurfaceWidth,
      }),
    )
  }, [panelAnchor, panelMatchSurfaceWidth, panelPlacement, pointerAnchor])

  useLayoutEffect(() => {
    if (!open || !portaled) return
    updatePanelPosition()
  }, [open, portaled, updatePanelPosition])

  useEffect(() => {
    if (!open || !portaled) return

    const onScrollOrResize = () => {
      updatePanelPosition()
    }

    const ancestors = getOverflowScrollAncestors(surfaceWrapRef.current)
    for (const el of ancestors) {
      el.addEventListener('scroll', onScrollOrResize, { passive: true })
    }
    window.addEventListener('resize', onScrollOrResize)

    const ro =
      typeof ResizeObserver !== 'undefined' && surfaceWrapRef.current
        ? new ResizeObserver(onScrollOrResize)
        : null
    if (ro && surfaceWrapRef.current) {
      ro.observe(surfaceWrapRef.current)
    }

    return () => {
      for (const el of ancestors) {
        el.removeEventListener('scroll', onScrollOrResize)
      }
      window.removeEventListener('resize', onScrollOrResize)
      ro?.disconnect()
    }
  }, [open, portaled, updatePanelPosition])

  useEffect(() => {
    if (!open || !portaled || !dismissOnPointerDownOutside) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || panelWrapRef.current?.contains(target)) return
      if (
        panelDismissIgnoreSelector &&
        target instanceof Element &&
        target.closest(panelDismissIgnoreSelector)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [open, portaled, dismissOnPointerDownOutside, panelDismissIgnoreSelector, setOpen])

  // overlay(셀 위 인라인 편집)는 "떠오르는" 팝/스케일 없이 제자리 페이드만 — 셀이 조용히 확대되는 느낌.
  const panelInitial =
    panelPlacement === 'right'
      ? { opacity: 0, scaleX: 0.92, x: -4 }
      : panelPlacement === 'overlay'
        ? { opacity: 0 }
        : panelPlacement === 'above'
          ? { opacity: 0, scaleY: 0.92, y: 4 }
          : { opacity: 0, scaleY: 0.92, y: -4 }
  const panelAnimate =
    panelPlacement === 'right'
      ? { opacity: 1, scaleX: 1, x: 0, transition: spring.standard }
      : panelPlacement === 'overlay'
        ? { opacity: 1, transition: { duration: 0.08 } }
        : { opacity: 1, scaleY: 1, y: 0, transition: spring.standard }
  const panelExit =
    panelPlacement === 'right'
      ? { opacity: 0, scaleX: 0.92, x: -4, transition: spring.standard }
      : panelPlacement === 'overlay'
        ? { opacity: 0, transition: { duration: 0.06 } }
        : panelPlacement === 'above'
          ? { opacity: 0, scaleY: 0.92, y: 4, transition: spring.standard }
          : { opacity: 0, scaleY: 0.92, y: -4, transition: spring.standard }

  const panelNode = (
    <AnimatePresence>
      {open && (
        <MotionPanel
          ref={panelWrapRef}
          id={panelId}
          role={panelRole}
          aria-modal={panelAriaModal ? true : undefined}
          aria-label={panelAriaLabel}
          variant={panelVariant}
          appearance={panelAppearance}
          shape={panelVariant === 'list' ? 'list' : 'overlay'}
          scrollHint={panelScrollHint}
          position={portaled ? 'fixed' : 'absolute'}
          offset={portaled ? 'none' : 'anchored'}
          data-part="anchor-context-surface-panel"
          className={cn(
            panelVariant === 'overlay' && 'max-w-xs min-w-[10rem] py-1',
            panelVariant === 'list' && 'min-w-0 p-0',
            portaled &&
              'top-[var(--ds-anchor-panel-top)] left-[var(--ds-anchor-panel-left)] z-[1000] max-w-[min(100%,calc(100vw-2*var(--ds-anchor-panel-viewport-pad)))]',
            panelMatchSurfaceWidth &&
              panelPos.width != null &&
              'w-[var(--ds-anchor-panel-width)] max-w-none',
            panelClassName,
          )}
          style={{
            '--ds-anchor-panel-top': `${panelPos.top}px`,
            '--ds-anchor-panel-left': `${panelPos.left}px`,
            '--ds-anchor-panel-viewport-pad': `${ANCHOR_PANEL_VIEWPORT_PAD_PX}px`,
            transformOrigin:
              panelPlacement === 'right'
                ? 'left'
                : panelPlacement === 'overlay'
                  ? 'top left'
                  : panelPlacement === 'above'
                    ? 'bottom'
                    : 'top',
            ...(panelPos.width != null ? { '--ds-anchor-panel-width': `${panelPos.width}px` } : {}),
          }}
          initial={panelInitial}
          animate={panelAnimate}
          exit={panelExit}
        >
          {panel}
        </MotionPanel>
      )}
    </AnimatePresence>
  )

  return (
    <DropdownPopover
      ref={rootRef}
      open={open}
      onOpenChange={setOpen}
      className={cn(rootLayout, className)}
      dismissOnPointerDownOutside={portaled ? false : dismissOnPointerDownOutside}
      dismissOnEscape={dismissOnEscape}
      {...props}
    >
      <div ref={surfaceWrapRef} data-part="anchor-context-surface-surface" className={surfaceWrap}>
        {surface}
      </div>
      {portaled ? mounted && createPortal(panelNode, document.body) : panelNode}
    </DropdownPopover>
  )
}

AnchorContextSurface.displayName = 'AnchorContextSurface'

export { AnchorContextSurface }
