import { describe, expect, it } from 'vitest'

import { formatKoreanPhoneDisplay, stripPhoneDigits } from './koreanPhoneNumber'

describe('koreanPhoneNumber', () => {
  it('stripPhoneDigits removes hyphens', () => {
    expect(stripPhoneDigits('010-1234-5678')).toBe('01012345678')
  })

  it('formatKoreanPhoneDisplay — mobile 11자리', () => {
    expect(formatKoreanPhoneDisplay('01012345678')).toBe('010-1234-5678')
  })

  it('formatKoreanPhoneDisplay — 입력 중 partial', () => {
    expect(formatKoreanPhoneDisplay('01012')).toBe('010-12')
  })
})
