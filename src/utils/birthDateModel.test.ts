import { describe, expect, it } from 'vitest'

import {
  clampBirthParts,
  daysInMonth,
  parseBirthDateDigits,
  toBirthDateDigits,
} from './birthDateModel'

describe('birthDateModel', () => {
  it('round-trips YYYYMMDD digits', () => {
    const parts = { year: 2005, month: 1, day: 3 }
    expect(toBirthDateDigits(parts)).toBe('20050103')
    expect(parseBirthDateDigits('20050103')).toEqual(parts)
  })

  it('clamps day when month has fewer days', () => {
    expect(clampBirthParts({ year: 2024, month: 2, day: 31 })).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    })
  })

  it('daysInMonth handles leap year', () => {
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2023, 2)).toBe(28)
  })
})
