import { describe, expect, it } from 'vitest'

import { isDateActive, stepCursorDate } from './timetable-utils'

import type { TimetableDateMeta } from './timetable-types'

/** 데이터가 8/21·8/28 에만 있고, 활성(고객 희망)은 8/28 하나뿐인 상황. */
const DATES: TimetableDateMeta[] = [
  { id: '2026-08-21', active: false },
  { id: '2026-08-28', active: true },
]

describe('stepCursorDate', () => {
  it('이전은 데이터 유무와 무관하게 바로 직전 일자다', () => {
    expect(stepCursorDate(new Date(2026, 7, 28), -1)).toEqual(new Date(2026, 7, 27))
  })

  it('다음은 바로 다음 일자다', () => {
    expect(stepCursorDate(new Date(2026, 7, 28), 1)).toEqual(new Date(2026, 7, 29))
  })

  it('월·연 경계를 넘어간다', () => {
    expect(stepCursorDate(new Date(2026, 8, 1), -1)).toEqual(new Date(2026, 7, 31))
    expect(stepCursorDate(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 1))
  })
})

describe('isDateActive', () => {
  it('메타에 있는 날은 active 플래그를 따른다', () => {
    expect(isDateActive(new Date(2026, 7, 28), DATES)).toBe(true)
    expect(isDateActive(new Date(2026, 7, 21), DATES)).toBe(false)
  })

  it('메타에 없는 날(=모르는 날)은 활성으로 본다', () => {
    expect(isDateActive(new Date(2026, 7, 27), DATES)).toBe(true)
  })

  it('메타 자체가 없으면 활성으로 본다', () => {
    expect(isDateActive(new Date(2026, 7, 27), undefined)).toBe(true)
  })
})
