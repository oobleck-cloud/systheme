import { PANEL_ANCHOR_GAP_PX, PANEL_SURFACE_ANCHOR_GAP_PX } from './panel'

export const ANCHOR_PANEL_VIEWPORT_PAD_PX = 8

/** 포털 패널 위치 추정용 (첫 레이아웃 전) */
export const ANCHOR_PANEL_FALLBACK_SIZE_PX = { width: 256, height: 220 } as const

export type AnchorPanelPlacement = 'below' | 'above' | 'right' | 'overlay'

/** overlay 배치 시 앵커(셀) top-left 기준 바깥 여백 — 패널이 셀 콘텐츠를 살짝 감싸 "셀이 확대"되는 느낌(노션식). */
export const ANCHOR_PANEL_OVERLAY_OUTSET_PX = 5

export type AnchorPanelPosition = {
  top: number
  left: number
  width?: number
}

export type ComputeAnchorPanelPositionInput = {
  anchorRect: DOMRect | DOMRectReadOnly
  panelWidth: number
  panelHeight: number
  placement?: AnchorPanelPlacement
  matchSurfaceWidth?: boolean
  viewportWidth?: number
  viewportHeight?: number
  viewportPad?: number
}

/**
 * 트리거(서피스) 기준 선호 위치를 계산한 뒤 뷰포트 안으로 clamp/flip 합니다.
 */
export function computeAnchorPanelPosition({
  anchorRect,
  panelWidth,
  panelHeight,
  placement = 'below',
  matchSurfaceWidth = false,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
  viewportPad = ANCHOR_PANEL_VIEWPORT_PAD_PX,
}: ComputeAnchorPanelPositionInput): AnchorPanelPosition {
  const vw = viewportWidth
  const vh = viewportHeight
  const pad = viewportPad
  const maxLeft = Math.max(pad, vw - pad - panelWidth)
  const maxTop = Math.max(pad, vh - pad - panelHeight)

  const width = matchSurfaceWidth ? anchorRect.width : undefined
  let left: number
  let top: number

  if (placement === 'overlay') {
    // 셀을 덮으며 그 자리에서 확대되는 편집 표면(노션식). 앵커 top-left 에 살짝 바깥 여백을 두고 정렬.
    // (gap 없이 셀 위에 겹친다. 아래 공통 clamp 가 뷰포트 밖이면 위/안으로 민다.)
    top = anchorRect.top - ANCHOR_PANEL_OVERLAY_OUTSET_PX
    left = anchorRect.left - ANCHOR_PANEL_OVERLAY_OUTSET_PX
  } else if (placement === 'right') {
    top = anchorRect.top
    left = anchorRect.right + PANEL_ANCHOR_GAP_PX
    if (left > maxLeft) {
      left = anchorRect.left - PANEL_ANCHOR_GAP_PX - panelWidth
    }
  } else if (placement === 'above') {
    const gap = PANEL_SURFACE_ANCHOR_GAP_PX
    top = anchorRect.top - gap - panelHeight
    left = anchorRect.left

    if (left > maxLeft) {
      left = anchorRect.right - panelWidth
    }

    // 위에 공간이 부족하면 아래로 flip
    if (top < pad && anchorRect.bottom + gap + panelHeight <= vh - pad) {
      top = anchorRect.bottom + gap
    }
  } else {
    const gap = PANEL_SURFACE_ANCHOR_GAP_PX
    top = anchorRect.bottom + gap
    left = anchorRect.left

    if (left > maxLeft) {
      left = anchorRect.right - panelWidth
    }

    if (top > maxTop && anchorRect.top - gap - panelHeight >= pad) {
      top = anchorRect.top - gap - panelHeight
    }
  }

  return {
    top: Math.min(Math.max(top, pad), maxTop),
    left: Math.min(Math.max(left, pad), maxLeft),
    width,
  }
}

export type AnchorPanelSide = 'top' | 'bottom' | 'left' | 'right'
export type AnchorPanelAlign = 'start' | 'center' | 'end'

const OPPOSITE_SIDE: Record<AnchorPanelSide, AnchorPanelSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}

export type ComputeSideAlignedPanelPositionInput = {
  anchorRect: DOMRect | DOMRectReadOnly
  panelWidth: number
  panelHeight: number
  /** 선호 방향. 공간이 부족하면 반대편으로 flip 합니다. */
  side?: AnchorPanelSide
  /** 교차축 정렬 (`top`/`bottom`이면 좌우, `left`/`right`이면 상하) */
  align?: AnchorPanelAlign
  gap?: number
  viewportWidth?: number
  viewportHeight?: number
  viewportPad?: number
}

/**
 * `Tooltip`/`Popover`처럼 4방향(side) + 정렬(align)이 필요한 패널 위치 계산.
 * 선호 side가 뷰포트에 안 들어가면 반대편으로 flip 한 뒤, 최종 좌표를 뷰포트 안으로 clamp 합니다.
 * 단순 드롭다운(아래로 펼침)은 {@link computeAnchorPanelPosition} 의 `below`/`right` 를 쓰세요.
 */
export function computeSideAlignedPanelPosition({
  anchorRect,
  panelWidth,
  panelHeight,
  side = 'bottom',
  align = 'center',
  gap = PANEL_ANCHOR_GAP_PX,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
  viewportPad = ANCHOR_PANEL_VIEWPORT_PAD_PX,
}: ComputeSideAlignedPanelPositionInput): AnchorPanelPosition {
  const pad = viewportPad
  const vw = viewportWidth
  const vh = viewportHeight

  const sideFits = (s: AnchorPanelSide): boolean => {
    switch (s) {
      case 'top':
        return anchorRect.top - gap - panelHeight >= pad
      case 'bottom':
        return anchorRect.bottom + gap + panelHeight <= vh - pad
      case 'left':
        return anchorRect.left - gap - panelWidth >= pad
      case 'right':
        return anchorRect.right + gap + panelWidth <= vw - pad
    }
  }

  // 선호 side가 안 들어가고 반대편은 들어가면 flip. 둘 다 안 되면 선호 side 유지(아래 clamp).
  const resolvedSide = sideFits(side) || !sideFits(OPPOSITE_SIDE[side]) ? side : OPPOSITE_SIDE[side]
  const isVertical = resolvedSide === 'top' || resolvedSide === 'bottom'

  let top: number
  let left: number

  if (isVertical) {
    top = resolvedSide === 'bottom' ? anchorRect.bottom + gap : anchorRect.top - gap - panelHeight
    if (align === 'start') left = anchorRect.left
    else if (align === 'end') left = anchorRect.right - panelWidth
    else left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2
  } else {
    left = resolvedSide === 'right' ? anchorRect.right + gap : anchorRect.left - gap - panelWidth
    if (align === 'start') top = anchorRect.top
    else if (align === 'end') top = anchorRect.bottom - panelHeight
    else top = anchorRect.top + anchorRect.height / 2 - panelHeight / 2
  }

  const maxLeft = Math.max(pad, vw - pad - panelWidth)
  const maxTop = Math.max(pad, vh - pad - panelHeight)

  return {
    top: Math.min(Math.max(top, pad), maxTop),
    left: Math.min(Math.max(left, pad), maxLeft),
  }
}

export function computePointerAnchorPanelPosition({
  pointerX,
  pointerY,
  panelWidth,
  panelHeight,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 0,
  viewportPad = ANCHOR_PANEL_VIEWPORT_PAD_PX,
}: {
  pointerX: number
  pointerY: number
  panelWidth: number
  panelHeight: number
  viewportWidth?: number
  viewportHeight?: number
  viewportPad?: number
}): AnchorPanelPosition {
  const pad = viewportPad
  const maxLeft = Math.max(pad, viewportWidth - pad - panelWidth)
  const maxTop = Math.max(pad, viewportHeight - pad - panelHeight)

  return {
    top: Math.min(Math.max(pointerY + PANEL_ANCHOR_GAP_PX, pad), maxTop),
    left: Math.min(Math.max(pointerX, pad), maxLeft),
  }
}
