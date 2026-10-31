'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'

import {
  ANCHOR_PANEL_FALLBACK_SIZE_PX,
  computeAnchorPanelPosition,
  computeSideAlignedPanelPosition,
  type AnchorPanelAlign,
  type AnchorPanelSide,
} from './anchorPanelPosition'

import { cn } from '@/utils/cn'

/**
 * `below`/`right` 는 단순 드롭다운(아래로 펼침)용 — {@link computeAnchorPanelPosition}.
 * `top`/`bottom`/`left`/`right` 는 Tooltip/Popover 처럼 4방향+정렬이 필요할 때 — {@link computeSideAlignedPanelPosition}.
 */
export type AnchoredPanelPlacement = 'below' | AnchorPanelSide

type UseAnchoredPanelParams<
  A extends HTMLElement = HTMLElement,
  P extends HTMLElement = HTMLElement,
> = {
  /** 패널이 열려 있는지 */
  open: boolean
  /** 위치 기준이 되는 트리거/루트 엘리먼트 ref */
  anchorRef: RefObject<A | null>
  /** 떠 있는 패널 엘리먼트 ref (크기 측정 + 바깥 클릭 판정에 사용) */
  panelRef: RefObject<P | null>
  placement?: AnchoredPanelPlacement
  /** side 배치(top/bottom/left/right)에서의 교차축 정렬 */
  align?: AnchorPanelAlign
  /** 패널 가로 폭을 트리거 폭에 맞춤 (Select/MultiSelect) */
  matchWidth?: boolean
  /** side 배치에서 트리거-패널 간격(px) */
  gap?: number
  /**
   * 트리거·패널 **바깥** pointerdown 시 호출. 패널이 `document.body` 로 포털되므로
   * 단일 컨테이너 기준 dismiss(`usePointerDownOutside`)로는 패널 클릭을 바깥으로 오판합니다.
   */
  onPointerDownOutside?: () => void
}

type UseAnchoredPanelResult = {
  /** `createPortal` 을 클라이언트에서만 호출하기 위한 가드 (SSR-safe) */
  mounted: boolean
  /** 패널에 부여할 CSS 변수 스타일 (`--ds-anchor-panel-*`) */
  style: CSSProperties
  /** 패널 위치/z-index 유틸 클래스 — CSS 변수 기반 top·left 좌표 + z-index, matchWidth 시 폭 포함 */
  positionClassName: string
}

/**
 * 트리거에 앵커된 떠 있는 패널을 `document.body` 로 포털하기 위한 위치 계산 훅.
 *
 * 상위 박스의 `overflow: hidden/auto`(Modal body·카드·스크롤영역·테이블)에 패널이
 * 잘리지 않도록, fixed 좌표를 뷰포트 기준으로 계산하고 스크롤/리사이즈에 따라 갱신합니다.
 * 패널은 호출부에서 `position="fixed"` + `offset="none"` + 반환된 `style`/`positionClassName`
 * 으로 렌더하고 `mounted` 가드 뒤에서 `createPortal(node, document.body)` 하세요.
 */
// ─── 중첩 포털 패널 레지스트리 ───────────────────────────────────────────────
//
// 앵커 패널은 전부 `document.body` 로 포털되므로 DOM 포함 관계만으로는 "팝오버 안의
// Select 드롭다운" 같은 중첩을 알 수 없다. 대신 **앵커(트리거)가 어느 패널 DOM 안에
// 있는가**로 소유 사슬이 복원된다: 중첩 패널의 앵커는 반드시 부모 패널 DOM 안에 있다.
// 열려 있는 모든 앵커 패널을 여기 등록해 두고, dismiss 판정 시 사슬을 걷는다.

type AnchoredPanelRegistration = {
  anchor: () => HTMLElement | null
  panel: () => HTMLElement | null
}

const openAnchoredPanels = new Set<AnchoredPanelRegistration>()

/**
 * `target` 이 (앵커·패널 자신, 또는 그 패널에서 파생된 중첩 포털 패널 어딘가에) 속하는가.
 * 중첩은 "타깃을 담은 패널의 앵커"로 한 단계씩 거슬러 올라가며 판정한다(깊이 무제한, 순환 방지).
 */
export function anchoredPanelTreeContains(
  anchorEl: HTMLElement | null,
  panelEl: HTMLElement | null,
  target: Node,
): boolean {
  if (anchorEl?.contains(target) || panelEl?.contains(target)) return true
  const visited = new Set<AnchoredPanelRegistration>()
  let node: Node | null = target
  while (node) {
    let containing: AnchoredPanelRegistration | null = null
    for (const reg of openAnchoredPanels) {
      if (visited.has(reg)) continue
      const p = reg.panel()
      if (p && p !== panelEl && p.contains(node)) {
        containing = reg
        break
      }
    }
    if (!containing) return false
    visited.add(containing)
    const ownerAnchor = containing.anchor()
    if (!ownerAnchor) return false
    if (anchorEl?.contains(ownerAnchor) || panelEl?.contains(ownerAnchor)) return true
    node = ownerAnchor
  }
  return false
}

/**
 * `panelEl` 안에서 연(앵커가 그 안에 있는) 포털 패널이 지금 열려 있는가.
 * Escape 중복 dismiss 방지용 — 중첩 드롭다운이 열려 있으면 바깥 팝오버는 이번 Escape 를 넘긴다.
 * (직계만 봐도 충분하다: 더 깊은 중첩이 열려 있으려면 직계도 열려 있어야 한다.)
 */
export function anchoredPanelHasOpenNested(panelEl: HTMLElement | null): boolean {
  if (!panelEl) return false
  for (const reg of openAnchoredPanels) {
    const a = reg.anchor()
    if (a && panelEl.contains(a)) return true
  }
  return false
}

export function useAnchoredPanel<
  A extends HTMLElement = HTMLElement,
  P extends HTMLElement = HTMLElement,
>({
  open,
  anchorRef,
  panelRef,
  placement = 'below',
  align = 'center',
  matchWidth = false,
  gap,
  onPointerDownOutside,
}: UseAnchoredPanelParams<A, P>): UseAnchoredPanelResult {
  const [pos, setPos] = useState<{ top: number; left: number; width?: number }>({
    top: 0,
    left: 0,
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const update = useCallback(() => {
    const anchor = anchorRef.current
    if (!anchor) return
    const panelEl = panelRef.current
    const panelWidth = panelEl?.offsetWidth ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.width
    const panelHeight = panelEl?.offsetHeight ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.height
    const anchorRect = anchor.getBoundingClientRect()

    if (placement === 'below') {
      setPos(
        computeAnchorPanelPosition({
          anchorRect,
          panelWidth,
          panelHeight,
          placement: 'below',
          matchSurfaceWidth: matchWidth,
        }),
      )
      return
    }

    setPos(
      computeSideAlignedPanelPosition({
        anchorRect,
        panelWidth,
        panelHeight,
        side: placement,
        align,
        ...(gap != null ? { gap } : {}),
      }),
    )
  }, [anchorRef, panelRef, placement, align, matchWidth, gap])

  // 열릴 때 paint 전에 위치 확정 (좌표 점프 방지)
  useLayoutEffect(() => {
    if (!open) return
    update()
  }, [open, update])

  // 스크롤 컨테이너/뷰포트 변화에 따라 재계산 (capture 로 모든 스크롤 포착)
  useEffect(() => {
    if (!open) return
    const onChange = () => update()
    window.addEventListener('resize', onChange)
    window.addEventListener('scroll', onChange, true)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onChange) : null
    if (ro && anchorRef.current) ro.observe(anchorRef.current)
    if (ro && panelRef.current) ro.observe(panelRef.current)
    return () => {
      window.removeEventListener('resize', onChange)
      window.removeEventListener('scroll', onChange, true)
      ro?.disconnect()
    }
  }, [open, update, anchorRef, panelRef])

  // 열려 있는 동안 전역 레지스트리에 등록 — 중첩 포털 패널의 소유 관계 판정에 쓰인다.
  useEffect(() => {
    if (!open) return
    const reg: AnchoredPanelRegistration = {
      anchor: () => anchorRef.current,
      panel: () => panelRef.current,
    }
    openAnchoredPanels.add(reg)
    return () => {
      openAnchoredPanels.delete(reg)
    }
  }, [open, anchorRef, panelRef])

  // 포털된 패널은 트리거의 DOM 자식이 아니므로, 트리거·패널 두 ref 를 모두 "안쪽"으로 친다.
  // 여기에 더해, 패널 **안에서 연** 하위 포털 패널(Select/Menu 드롭다운 등)도 안쪽이다 —
  // 소유 사슬을 걷지 않으면 팝오버 속 Select 옵션 클릭이 "바깥"으로 오판되어 팝오버가 닫힌다.
  const dismissRef = useRef(onPointerDownOutside)
  dismissRef.current = onPointerDownOutside
  useEffect(() => {
    if (!open || !dismissRef.current) return
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (anchoredPanelTreeContains(anchorRef.current, panelRef.current, target)) return
      dismissRef.current?.()
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [open, anchorRef, panelRef])

  const style = {
    '--ds-anchor-panel-top': `${pos.top}px`,
    '--ds-anchor-panel-left': `${pos.left}px`,
    ...(pos.width != null ? { '--ds-anchor-panel-width': `${pos.width}px` } : {}),
  } as CSSProperties

  const positionClassName = cn(
    'top-[var(--ds-anchor-panel-top)] left-[var(--ds-anchor-panel-left)] z-[1000]',
    pos.width != null && 'w-[var(--ds-anchor-panel-width)] max-w-none',
  )

  return { mounted, style, positionClassName }
}
