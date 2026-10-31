import { describe, expect, it } from 'vitest'

import { getCalendarDays, groupCalendarDaysIntoWeeks, isSameDay } from './calendarDates'

describe('calendarDates', () => {
  it('isSameDay compares local date parts', () => {
    expect(isSameDay(new Date(2025, 0, 2), new Date(2025, 0, 2))).toBe(true)
    expect(isSameDay(new Date(2025, 0, 2), new Date(2025, 0, 3))).toBe(false)
  })

  it('getCalendarDays pads to full weeks', () => {
    const days = getCalendarDays(2025, 0)
    expect(days.length % 7).toBe(0)
    expect(days.filter(Boolean)).toHaveLength(31)
  })

  it('groupCalendarDaysIntoWeeks splits by seven', () => {
    const weeks = groupCalendarDaysIntoWeeks(getCalendarDays(2025, 0))
    expect(weeks.every((week) => week.length === 7)).toBe(true)
  })
})
