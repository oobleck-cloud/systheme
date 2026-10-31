import { describe, expect, it } from 'vitest'

import { circlePath, pixelPath, pointOnCircle, pointsAlong, type PixelPoint } from './arrowGeometry'

const A: PixelPoint = { x: 0, y: 0 }
const B: PixelPoint = { x: 100, y: 0 }

describe('pixelPath', () => {
  it('두 끝점을 잇는 직선', () => {
    expect(pixelPath(A, B)).toEqual([A, B])
  })
})

describe('pointOnCircle', () => {
  it('0도는 오른쪽, 90도는 화면 아래', () => {
    const c = { x: 100, y: 100 }
    const right = pointOnCircle(c, 36, 0)
    const down = pointOnCircle(c, 36, 90)
    expect(right.x).toBeCloseTo(136)
    expect(right.y).toBeCloseTo(100)
    expect(down.x).toBeCloseTo(100)
    expect(down.y).toBeCloseTo(136)
  })
})

describe('circlePath', () => {
  const center = { x: 50, y: 50 }
  const path = circlePath(center, 36)

  it('모든 점이 중심에서 반지름만큼 떨어져 있다', () => {
    for (const p of path) {
      expect(Math.hypot(p.x - center.x, p.y - center.y)).toBeCloseTo(36, 6)
    }
  })

  it('첫 점과 끝 점이 같아 닫힌다', () => {
    expect(path[0]!.x).toBeCloseTo(path[path.length - 1]!.x, 6)
    expect(path[0]!.y).toBeCloseTo(path[path.length - 1]!.y, 6)
  })
})

describe('pointsAlong', () => {
  it('구간을 count + 1 등분한 자리에 놓는다', () => {
    const points = pointsAlong([A, B], 3)
    expect(points.map((p) => Math.round(p.x))).toEqual([25, 50, 75])
  })

  it('꺾인 경로도 길이 기준으로 나눈다', () => {
    const path = [A, { x: 100, y: 0 }, { x: 100, y: 100 }]
    const [mid] = pointsAlong(path, 1)
    expect(mid).toEqual({ x: 100, y: 0 })
  })

  it('개수가 0이거나 길이가 0이면 비어 있다', () => {
    expect(pointsAlong([A, B], 0)).toEqual([])
    expect(pointsAlong([A, { ...A }], 2)).toEqual([])
  })
})
