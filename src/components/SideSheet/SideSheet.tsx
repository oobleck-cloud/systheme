'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from '@/components/IconButton'
import { spring } from '@/foundations/motionTokens'
import { createIconElement, X } from '@/icons'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

import { useSideSheetHost, type SideSheetSide } from './SideSheetHost'

/** 폭 기본값 — 주문 요약·이력 카드 한 장이 줄바꿈 없이 들어가는 최소치 */
const DEFAULT_WIDTH = 420
const DEFAULT_MIN_WIDTH = 320
const DEFAULT_MAX_WIDTH = 720
/** 키보드로 폭을 조절할 때의 한 스텝 */
const RESIZE_STEP = 16
/**
 * 시트가 자리를 **나눠 갖으려면** 본문에도 최소한 이만큼은 남아야 한다.
 * 이보다 좁아지면 나눠 갖는다는 말이 성립하지 않으므로, 시트는 덮는 패널로 바뀐다.
 */
const MIN_BODY_WIDTH = 320

/**
 * 화면에 들어가는 폭으로 맞춘다.
 *
 * 예전에는 `max-width: 100vw` 로만 막았다. 창 폭까지는 막았지만 시트가 사는 **행**에는
 * 사이드바 레일 같은 것들이 이미 자리를 차지하고 있어서, 행 전체가 창을 넘고 시트 왼쪽이
 * 레일 밑으로 들어가 글자가 잘렸다(고객 이력 시트 실측).
 *
 * 기준을 **창 폭**으로 잡는 이유: 호스트 실폭을 재면 순환이 생긴다 — 호스트 폭이 자식(시트)에
 * 좌우되는 배치에서는 시트가 줄면 호스트가 줄고 그래서 시트가 또 줄어, 폭이 0으로 무너진다
 * (실측). 창 폭은 시트와 무관하므로 그 고리가 없다. 남겨 두는 `MIN_BODY_WIDTH` 가 본문 자리이자
 * 크롬이 먹는 자리를 함께 흡수한다.
 */
export function fitSheetWidth(
  width: number,
  viewportWidth: number | null,
  minWidth: number,
): { width: number; covering: boolean } {
  // 측정 전(SSR·첫 페인트)에는 요청한 폭 그대로 — 한 프레임 뒤 실측값으로 맞춰진다
  if (viewportWidth == null || viewportWidth <= 0) return { width, covering: false }
  // 본문 자리를 남길 수 없을 만큼 좁다 → 덮는다. 잘린 시트보다 덮는 시트가 낫다.
  if (viewportWidth - MIN_BODY_WIDTH < minWidth) return { width: viewportWidth, covering: true }
  return { width: Math.min(width, viewportWidth - MIN_BODY_WIDTH), covering: false }
}

/** 창 폭 — 시트 폭의 기준. 서버 렌더에서는 알 수 없으므로 null 로 시작한다. */
function useViewportWidth(): number | null {
  const [viewportWidth, setViewportWidth] = useState<number | null>(null)
  useEffect(() => {
    const measure = () => setViewportWidth(window.innerWidth)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  return viewportWidth
}

const sideBorderClass: Record<SideSheetSide, string> = {
  left: 'border-r border-border',
  right: 'border-l border-border',
}

const handleSideClass: Record<SideSheetSide, string> = {
  left: 'right-0',
  right: 'left-0',
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export type SideSheetProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  titleId?: string
  /** 시트가 붙는 가장자리. 위/아래는 지원하지 않는다 — 본문을 세로로 자르는 건 다른 문제다. */
  side?: SideSheetSide
  /** 제어형 폭(px). 주면 `onWidthChange` 로 직접 저장·복원한다. */
  width?: number
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
  onWidthChange?: (width: number) => void
  /** 포커스가 시트 안에 있을 때만 Escape로 닫는다. 본문에서 누른 Escape는 가져가지 않는다. */
  dismissOnEscape?: boolean
  /** 열릴 때 시트로 포커스를 옮기고, 닫힐 때 직전 위치로 되돌린다. */
  focusOnOpen?: boolean
  /**
   * 폭 변화를 애니메이션한다. 본문이 매 프레임 리레이아웃되는 그리드(Dockview 등)라
   * 프레임이 튀면 `false` 로 즉시 확정한다.
   */
  animated?: boolean
}

/**
 * 본문 옆에 **자리를 차지하고** 서는 패널. 열리면 본문이 그만큼 좁아진다.
 *
 * 언제 이걸 쓰나 — 열어둔 채로 본문과 **대조**하는 정보(고객 이력, 추천 점수 근거)에 쓴다.
 * 지금 이것부터 처리해야 하는 흐름(폼 작성, 파괴적 확인)은 `Drawer`(모달) 쪽이다.
 * 둘의 차이는 폭이 아니라 모달 여부다: 여기엔 scrim·focus trap·스크롤 잠금이 없고,
 * 열려 있는 동안에도 본문을 그대로 조작할 수 있다.
 *
 * 앱 셸이 [`SideSheetHost`](./SideSheetHost.tsx) 로 감싸져 있어야 한다(없으면 던진다).
 *
 * ```tsx
 * <SideSheet open={open} onOpenChange={setOpen} title="고객 이력">
 *   <CustomerHistoryBody history={history} />
 * </SideSheet>
 * ```
 */
function SideSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  footer,
  className,
  titleId: titleIdProp,
  side = 'right',
  width: widthProp,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = DEFAULT_MIN_WIDTH,
  maxWidth = DEFAULT_MAX_WIDTH,
  resizable = true,
  onWidthChange,
  dismissOnEscape = true,
  focusOnOpen = true,
  animated = true,
}: SideSheetProps) {
  const autoTitleId = useId()
  const titleId = titleIdProp ?? autoTitleId
  const sheetRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const dragOriginRef = useRef<{ pointerX: number; width: number } | null>(null)

  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [internalWidth, setInternalWidth] = useState(() => clamp(defaultWidth, minWidth, maxWidth))
  const [dragging, setDragging] = useState(false)

  const host = useSideSheetHost()
  const slot = host.slotFor(side)
  const viewportWidth = useViewportWidth()
  const prefersReducedMotion = useReducedMotion()

  const isOpenControlled = openProp !== undefined
  const open = isOpenControlled ? openProp! : internalOpen

  const isWidthControlled = widthProp !== undefined
  const requestedWidth = clamp(isWidthControlled ? widthProp! : internalWidth, minWidth, maxWidth)
  // 요청한 폭은 사용자의 뜻이고, 실제 폭은 호스트가 내줄 수 있는 만큼이다 — 저장값은 건드리지 않는다
  const { width, covering } = fitSheetWidth(requestedWidth, viewportWidth, minWidth)

  function handleOpenChange(next: boolean) {
    if (!isOpenControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  function handleWidthChange(next: number) {
    const clamped = clamp(Math.round(next), minWidth, maxWidth)
    if (!isWidthControlled) setInternalWidth(clamped)
    onWidthChange?.(clamped)
  }

  // Escape — 시트 안에 포커스가 있을 때만. 본문 필터·표에서 누른 Escape는 본문 것이다.
  useEffect(() => {
    if (!open || !dismissOnEscape) return
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const sheet = sheetRef.current
      if (sheet == null || !sheet.contains(document.activeElement)) return
      handleOpenChange(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dismissOnEscape])

  // 모달이 아니므로 포커스를 가두지 않는다. 다만 열 때 한 번 옮겨주지 않으면
  // 키보드 사용자는 본문 전체를 Tab으로 지나야 시트에 닿는다.
  useEffect(() => {
    if (!open || !focusOnOpen) return
    restoreFocusRef.current = document.activeElement as HTMLElement | null
    const id = requestAnimationFrame(() => sheetRef.current?.focus())
    return () => {
      cancelAnimationFrame(id)
      const previous = restoreFocusRef.current
      restoreFocusRef.current = null
      if (previous?.isConnected === true) previous.focus()
    }
  }, [open, focusOnOpen])

  function handleResizePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragOriginRef.current = { pointerX: event.clientX, width }
    setDragging(true)
  }

  function handleResizePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const origin = dragOriginRef.current
    if (origin == null) return
    const delta = event.clientX - origin.pointerX
    handleWidthChange(side === 'right' ? origin.width - delta : origin.width + delta)
  }

  function handleResizePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragOriginRef.current == null) return
    dragOriginRef.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function handleResizeKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const grow = side === 'right' ? 'ArrowLeft' : 'ArrowRight'
    const shrink = side === 'right' ? 'ArrowRight' : 'ArrowLeft'
    if (event.key === grow) handleWidthChange(width + RESIZE_STEP)
    else if (event.key === shrink) handleWidthChange(width - RESIZE_STEP)
    else if (event.key === 'Home') handleWidthChange(minWidth)
    else if (event.key === 'End') handleWidthChange(maxWidth)
    else return
    event.preventDefault()
  }

  if (slot == null) return null

  const hasHeader = title != null
  const still = prefersReducedMotion === true || animated === false || dragging
  /** 덮는 시트가 들어오고 나가는 방향 — 자기가 붙은 가장자리 바깥 */
  const offscreen = side === 'right' ? '100%' : '-100%'

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          ref={sheetRef}
          data-slot="side-sheet-root"
          data-side={side}
          role="complementary"
          aria-labelledby={hasHeader ? titleId : undefined}
          aria-label={hasHeader ? undefined : '사이드 시트'}
          tabIndex={-1}
          /**
           * 자리를 나눠 가질 때는 **폭**이 자란다 — 본문이 그만큼 밀려야 하니까.
           * 덮을 때는 본문을 밀지 않으므로 폭이 아니라 **가장자리에서 밀려 들어온다**.
           * (덮는데도 폭을 애니메이션하면 목표가 도중에 바뀌어 중간 값에서 멈춘다 — 실측)
           */
          initial={covering ? { x: offscreen } : { width: 0 }}
          animate={covering ? { x: 0 } : { width }}
          exit={covering ? { x: offscreen } : { width: 0 }}
          transition={still ? { duration: 0 } : spring.standard}
          // 폭은 화면을 넘지 못한다 — 폰에서 420px 시트는 뷰포트 밖으로 밀려 오른쪽이 잘린다
          // (실측: 고객 이력 시트가 잘린 채 열렸고, 안쪽 컨테이너 쿼리도 넓은 폭으로 오판했다).
          style={
            {
              /**
               * 덮을 때의 폭은 **호스트의 100%** 다 — px 이 아니다.
               *
               * 덮는 시트는 호스트를 기준으로 놓이므로(`right-0`), 폭만 창 기준 px 로 주면
               * 호스트가 창보다 좁을 때(패딩·중첩 패널) 그 차이만큼 왼쪽으로 삐져나간다.
               * 잘림은 늘 이렇게 **폭과 위치의 기준이 어긋난 자리**에서 난다.
               */
              '--ds-side-sheet-width': covering ? '100%' : `${width}px`,
              maxWidth: '100vw',
            } as CSSProperties
          }
          className={cn(
            'flex h-full shrink-0 overflow-hidden bg-surface outline-none',
            sideBorderClass[side],
            // 덮는 폭에서는 흐름에서 빠진다 — 행에 남아 있으면 본문(사이드바)과 폭을 다투고,
            // 그 다툼이 곧 잘림이다. 나가면 슬롯은 0이 되고 시트만 화면을 채운다.
            // 덮으면 경계선이 필요 없다 — 옆에 나란히 설 본문이 없다(1px 이 행을 넘기기도 한다)
            covering ? 'absolute inset-y-0 z-30 w-full border-0 shadow-float' : 'relative',
            covering && (side === 'right' ? 'right-0' : 'left-0'),
          )}
        >
          {resizable && !covering && (
            <div
              data-slot="side-sheet-resize-handle"
              role="slider"
              tabIndex={0}
              aria-orientation="vertical"
              aria-label="시트 폭 조절"
              aria-valuenow={width}
              aria-valuemin={minWidth}
              aria-valuemax={maxWidth}
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
              onKeyDown={handleResizeKeyDown}
              className={cn(
                'absolute inset-y-0 z-10 w-1.5 cursor-col-resize bg-transparent',
                'transition-colors duration-effects-fast ease-standard',
                'hover:bg-primary/40 focus-visible:bg-primary/60 focus-visible:outline-none',
                handleSideClass[side],
                dragging && 'bg-primary/60',
              )}
            />
          )}

          <Surface
            kind="section"
            density="default"
            data-slot="side-sheet-panel"
            className={cn(
              'h-full max-h-none w-[min(var(--ds-side-sheet-width),100vw)] min-w-0 shrink-0 border-0 bg-transparent shadow-none',
              className,
            )}
            header={
              hasHeader ? (
                <div
                  data-slot="side-sheet-header"
                  className="flex items-start justify-between gap-3"
                >
                  <h2
                    id={titleId}
                    data-slot="side-sheet-title"
                    className="text-base font-semibold text-fg"
                  >
                    {title}
                  </h2>
                  <IconButton
                    type="button"
                    data-slot="side-sheet-close"
                    variant="ghost"
                    size="sm"
                    shape="rounded"
                    aria-label="시트 닫기"
                    onClick={() => handleOpenChange(false)}
                  >
                    {createIconElement(X, 'md')}
                  </IconButton>
                </div>
              ) : (
                <div data-slot="side-sheet-header" className="flex shrink-0 justify-end">
                  <IconButton
                    type="button"
                    data-slot="side-sheet-close"
                    variant="ghost"
                    size="sm"
                    shape="rounded"
                    aria-label="시트 닫기"
                    onClick={() => handleOpenChange(false)}
                  >
                    {createIconElement(X, 'md')}
                  </IconButton>
                </div>
              )
            }
            footer={footer != null ? <div data-slot="side-sheet-footer">{footer}</div> : undefined}
          >
            <div
              data-slot="side-sheet-body"
              /* 마지막 스크롤 컨테이너이므로 하단 크롬(AI Dock) 여백을 여기서 소비한다.
                 시트는 모달이 아니라 크롬이 계속 떠 있고, 목록 끝이 그 아래 깔린다. */
              className="h-full overflow-y-auto overflow-x-hidden pb-[var(--ds-bottom-chrome-clearance)] text-sm text-fg"
            >
              {children}
            </div>
          </Surface>
        </motion.aside>
      )}
    </AnimatePresence>,
    slot,
  )
}

export { SideSheet }
