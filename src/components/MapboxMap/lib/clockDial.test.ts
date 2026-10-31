import { describe, expect, it } from 'vitest'

import {
  annularSectorPath,
  clockAngle,
  clockSweep,
  dialCellArc,
  dialKey,
  dialSegments,
  dialToneStyle,
  polarPoint,
  type MarkerDial,
} from './clockDial'

const DAY: Pick<MarkerDial, 'startHour' | 'cellMinutes'> = { startHour: 8, cellMinutes: 30 }

describe('clockAngle', () => {
  it('12시가 위(0°), 3시가 오른쪽(90°), 시계 방향', () => {
    expect(clockAngle(12)).toBe(0)
    expect(clockAngle(15)).toBe(90)
    expect(clockAngle(18)).toBe(180)
  })

  it('12시간 시계라 8시와 20시는 같은 자리(240°)', () => {
    expect(clockAngle(8)).toBe(240)
    expect(clockAngle(20)).toBe(240)
  })

  it('30분은 15°', () => {
    expect(clockAngle(10.5) - clockAngle(10)).toBe(15)
    expect(clockSweep(30)).toBe(15)
  })
})

describe('polarPoint', () => {
  it('0° 는 위, 90° 는 오른쪽 (y 가 아래로 자란다)', () => {
    const [x0, y0] = polarPoint(0, 0, 10, 0)
    expect(x0).toBeCloseTo(0)
    expect(y0).toBeCloseTo(-10)
    const [x1, y1] = polarPoint(0, 0, 10, 90)
    expect(x1).toBeCloseTo(10)
    expect(y1).toBeCloseTo(0)
  })
})

describe('dialCellArc', () => {
  it('08~20시 30분 칸 24개가 원 한 바퀴를 빈틈없이 채운다', () => {
    const arcs = Array.from({ length: 24 }, (_, index) => dialCellArc(DAY, index))
    expect(arcs[0]).toEqual({ startDeg: 240, endDeg: 255 })
    // 12:00 칸(index 8)은 위에서 시작한다
    expect(arcs[8]!.startDeg % 360).toBe(0)
    const total = arcs.reduce((sum, arc) => sum + (arc.endDeg - arc.startDeg), 0)
    expect(total).toBe(360)
  })

  it('틈은 양쪽 칸이 절반씩 내어 준다', () => {
    expect(dialCellArc(DAY, 0, 4)).toEqual({ startDeg: 242, endDeg: 253 })
  })

  it('틈이 칸보다 넓어도 칸이 뒤집히지 않는다', () => {
    const arc = dialCellArc(DAY, 0, 100)
    expect(arc.endDeg).toBeGreaterThanOrEqual(arc.startDeg)
  })
})

describe('annularSectorPath', () => {
  it('고리 조각은 바깥 호 → 안쪽 호로 닫힌다', () => {
    const path = annularSectorPath(0, 0, 5, 10, 0, 90)
    expect(path).toBe('M0 -10A10 10 0 0 1 10 0L5 0A5 5 0 0 0 0 -5Z')
  })

  it('안쪽 반지름 0 이면 중심에서 뻗는 부채꼴', () => {
    expect(annularSectorPath(0, 0, 0, 10, 0, 90)).toBe('M0 -10A10 10 0 0 1 10 0L0 0Z')
  })

  it('180° 를 넘는 호는 large-arc 플래그가 선다', () => {
    expect(annularSectorPath(0, 0, 5, 10, 0, 270)).toContain('A10 10 0 1 1')
  })

  it('폭이 없거나 반지름이 뒤집히면 그릴 것이 없다', () => {
    expect(annularSectorPath(0, 0, 5, 10, 30, 30)).toBe('')
    expect(annularSectorPath(0, 0, 10, 5, 0, 30)).toBe('')
  })
})

describe('dialSegments', () => {
  it('칸마다 톤과 경로를 하나씩 낸다', () => {
    const dial: MarkerDial = { ...DAY, cells: ['base', 'soft', 'strong', 'warn'] }
    const segments = dialSegments(dial, { cx: 22, cy: 22, innerR: 13, outerR: 22, gapDeg: 3 })
    expect(segments.map((segment) => segment.tone)).toEqual(['base', 'soft', 'strong', 'warn'])
    expect(segments.every((segment) => segment.path.startsWith('M'))).toBe(true)
  })
})

describe('dialKey', () => {
  it('같은 시계판이면 같은 키, 칸 하나만 달라도 다른 키', () => {
    const a: MarkerDial = { ...DAY, cells: ['base', 'soft', 'strong', 'warn'] }
    const b: MarkerDial = { ...DAY, cells: ['base', 'soft', 'strong', 'warn'] }
    const c: MarkerDial = { ...DAY, cells: ['base', 'soft', 'soft', 'warn'] }
    expect(dialKey(a)).toBe(dialKey(b))
    expect(dialKey(a)).not.toBe(dialKey(c))
    expect(dialKey(undefined)).toBe('')
  })
})

describe('dialToneStyle', () => {
  it('연한·진한 칸은 마커 색의 농도, 경고만 고정 주황', () => {
    expect(dialToneStyle('strong', '#2563eb')).toEqual({ fill: '#2563eb', alpha: 1 })
    expect(dialToneStyle('soft', '#2563eb')).toEqual({ fill: '#2563eb', alpha: 0.3 })
    expect(dialToneStyle('warn', '#2563eb').fill).toBe('#f08a24')
    expect(dialToneStyle('base', '#2563eb').fill).not.toBe('#2563eb')
  })
})
