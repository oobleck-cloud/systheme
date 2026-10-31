import { describe, expect, it } from 'vitest'

import {
  birthDateDigitsToIso,
  BIRTH_DATE_DIGIT_LENGTH,
  formatBirthDateDisplay,
  isValidBirthDateDigits,
  stripDateDigits,
} from './dateDigits'

describe('stripDateDigits', () => {
  it('removes non-digits', () => {
    expect(stripDateDigits('2005-01-03')).toBe('20050103')
  })
})

describe('formatBirthDateDisplay', () => {
  it('inserts hyphens while typing', () => {
    expect(formatBirthDateDisplay('2005')).toBe('2005')
    expect(formatBirthDateDisplay('200501')).toBe('2005-01')
    expect(formatBirthDateDisplay('20050103')).toBe('2005-01-03')
  })
})

describe('birthDateDigitsToIso', () => {
  it('returns ISO date for valid YYYYMMDD', () => {
    expect(birthDateDigitsToIso('20050103')).toBe('2005-01-03')
  })

  it('returns null when incomplete', () => {
    expect(birthDateDigitsToIso('200501')).toBeNull()
  })

  it('returns null for invalid calendar date', () => {
    expect(birthDateDigitsToIso('20050230')).toBeNull()
  })
})

describe('isValidBirthDateDigits', () => {
  it('matches birthDateDigitsToIso', () => {
    expect(isValidBirthDateDigits('19900115')).toBe(true)
    expect(isValidBirthDateDigits('19900132')).toBe(false)
    expect('19900115'.length).toBe(BIRTH_DATE_DIGIT_LENGTH)
  })
})
