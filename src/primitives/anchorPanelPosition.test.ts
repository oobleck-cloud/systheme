import { describe, expect, it } from 'vitest'

import { computeAnchorPanelPosition, computeSideAlignedPanelPosition } from './anchorPanelPosition'

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }
}

describe('computeAnchorPanelPosition', () => {
  it('below: 오른쪽 끝 트리거면 패널을 왼쪽으로 밀어 뷰포트 안에 둔다', () => {
    const anchor = rect(900, 40, 96, 32)
    const pos = computeAnchorPanelPosition({
      anchorRect: anchor,
      panelWidth: 256,
      panelHeight: 220,
      placement: 'below',
      viewportWidth: 1024,
      viewportHeight: 768,
      viewportPad: 8,
    })

    expect(pos.left + 256).toBeLessThanOrEqual(1024 - 8)
    expect(pos.left).toBe(900 + 96 - 256)
  })

  it('right: 오른쪽 공간이 부족하면 트리거 왼쪽에 패널을 둔다', () => {
    const anchor = rect(980, 100, 40, 40)
    const pos = computeAnchorPanelPosition({
      anchorRect: anchor,
      panelWidth: 200,
      panelHeight: 180,
      placement: 'right',
      viewportWidth: 1024,
      viewportHeight: 768,
      viewportPad: 8,
    })

    expect(pos.left + 200).toBeLessThanOrEqual(1024 - 8)
    expect(pos.left).toBeLessThan(anchor.left)
  })

  it('below: 아래 공간이 부족하면 트리거 위로 flip 한다', () => {
    const anchor = rect(100, 700, 120, 40)
    const pos = computeAnchorPanelPosition({
      anchorRect: anchor,
      panelWidth: 200,
      panelHeight: 220,
      placement: 'below',
      viewportWidth: 1024,
      viewportHeight: 768,
      viewportPad: 8,
    })

    expect(pos.top + 220).toBeLessThanOrEqual(768 - 8)
    expect(pos.top).toBeLessThan(anchor.top)
  })
})

describe('computeSideAlignedPanelPosition', () => {
  const VIEW = { viewportWidth: 1024, viewportHeight: 768, viewportPad: 8 }

  it('bottom + center: 트리거 아래에, 가로 중앙 정렬', () => {
    const anchor = rect(400, 100, 100, 40)
    const pos = computeSideAlignedPanelPosition({
      anchorRect: anchor,
      panelWidth: 200,
      panelHeight: 120,
      side: 'bottom',
      align: 'center',
      gap: 6,
      ...VIEW,
    })

    expect(pos.top).toBe(anchor.bottom + 6)
    // 중앙 정렬: 패널 중심 == 트리거 중심(450)
    expect(pos.left + 200 / 2).toBe(450)
  })

  it('bottom + start/end: 트리거 좌/우 모서리에 정렬', () => {
    const anchor = rect(400, 100, 100, 40)
    const start = computeSideAlignedPanelPosition({
      anchorRect: anchor,
      panelWidth: 80,
      panelHeight: 60,
      side: 'bottom',
      align: 'start',
      ...VIEW,
    })
    const end = computeSideAlignedPanelPosition({
      anchorRect: anchor,
      panelWidth: 80,
      panelHeight: 60,
      side: 'bottom',
      align: 'end',
      ...VIEW,
    })

    expect(start.left).toBe(anchor.left)
    expect(end.left).toBe(anchor.right - 80)
  })

  it('bottom: 아래 공간이 부족하면 top 으로 flip 한다', () => {
    const anchor = rect(400, 720, 100, 40)
    const pos = computeSideAlignedPanelPosition({
      anchorRect: anchor,
      panelWidth: 200,
      panelHeight: 200,
      side: 'bottom',
      gap: 6,
      ...VIEW,
    })

    // top 으로 flip → 트리거 위쪽
    expect(pos.top).toBe(anchor.top - 6 - 200)
    expect(pos.top).toBeGreaterThanOrEqual(8)
  })

  it('right: 오른쪽 공간이 부족하면 left 로 flip 한다', () => {
    const anchor = rect(960, 300, 40, 40)
    const pos = computeSideAlignedPanelPosition({
      anchorRect: anchor,
      panelWidth: 240,
      panelHeight: 120,
      side: 'right',
      gap: 6,
      ...VIEW,
    })

    expect(pos.left).toBe(anchor.left - 6 - 240)
    expect(pos.left).toBeGreaterThanOrEqual(8)
  })

  it('최종 좌표는 항상 뷰포트 패딩 안으로 clamp 된다', () => {
    const anchor = rect(0, 0, 20, 20)
    const pos = computeSideAlignedPanelPosition({
      anchorRect: anchor,
      panelWidth: 300,
      panelHeight: 300,
      side: 'left',
      align: 'start',
      ...VIEW,
    })

    expect(pos.left).toBeGreaterThanOrEqual(8)
    expect(pos.top).toBeGreaterThanOrEqual(8)
    expect(pos.left + 300).toBeLessThanOrEqual(1024 - 8)
  })
})
