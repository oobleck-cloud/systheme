import { describe, expect, it } from 'vitest'

import { stopClockProps } from './arrows'
import { stopClockImageId, stopClockWedgePath } from './stopClockIcon'

describe('stopClockImageId', () => {
  it('색과 길이가 같으면 같은 그림을 쓴다 — 각도는 돌려서 맞춘다', () => {
    expect(stopClockImageId('#2563eb', 30)).toBe(stopClockImageId('#2563eb', 30))
    expect(stopClockImageId('#2563eb', 30)).not.toBe(stopClockImageId('#059669', 30))
  })
})

describe('stopClockWedgePath', () => {
  it('12시에서 시작해 중심으로 닫히는 부채꼴', () => {
    const path = stopClockWedgePath(30)
    // 중심(14,14)에서 반지름 12 위로 → 12시 방향 꼭짓점
    expect(path.startsWith('M14 2A12 12')).toBe(true)
    expect(path.endsWith('L14 14Z')).toBe(true)
  })
})

describe('stopClockProps', () => {
  it('칸의 시작 시각을 시계 각도로 돌린다 — 10:30 은 315°', () => {
    expect(stopClockProps({ clock: { startHour: 10.5, minutes: 30 } }, '#2563eb')).toEqual({
      clockImage: stopClockImageId('#2563eb', 30),
      clockAngle: 315,
    })
  })

  it('시계가 없으면 그림 이름을 비워 원 레이어가 맡게 한다', () => {
    expect(stopClockProps({}, '#2563eb')).toEqual({ clockImage: '', clockAngle: 0 })
  })
})
