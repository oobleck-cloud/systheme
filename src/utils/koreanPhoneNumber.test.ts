import { describe, expect, it } from 'vitest'

import { formatKoreanPhoneDisplay, formatPhoneNumber, stripPhoneDigits } from './koreanPhoneNumber'

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

describe('formatPhoneNumber — 표시용', () => {
  it.each([
    // 휴대폰
    ['01068780239', '010-6878-0239'],
    ['0101234567', '010-123-4567'],
    ['01112345678', '011-1234-5678'],
    ['0161234567', '016-123-4567'],
    // 서울
    ['021234567', '02-123-4567'],
    ['0212345678', '02-1234-5678'],
    // 3자리 지역번호·인터넷전화·수신자부담
    ['0311234567', '031-123-4567'],
    ['03112345678', '031-1234-5678'],
    ['0641234567', '064-123-4567'],
    ['07012345678', '070-1234-5678'],
    ['0801234567', '080-123-4567'],
    // 안심번호
    ['05051234567', '0505-123-4567'],
    ['050512345678', '0505-1234-5678'],
    // 대표번호
    ['15881234', '1588-1234'],
    ['16441234', '1644-1234'],
    ['18001234', '1800-1234'],
  ])('%s → %s', (input, expected) => {
    expect(formatPhoneNumber(input)).toBe(expected)
  })

  it.each([
    ['+821068780239', '010-6878-0239'],
    ['+82 10-6878-0239', '010-6878-0239'],
    ['+82-10-6878-0239', '010-6878-0239'],
    ['+82 (0)10 6878 0239', '010-6878-0239'],
    ['+8221234567', '02-123-4567'],
    ['00821068780239', '010-6878-0239'],
  ])('국제 표기 %s → %s', (input, expected) => {
    expect(formatPhoneNumber(input)).toBe(expected)
  })

  it('공백·점으로 끊긴 번호도 숫자만 보고 서식', () => {
    expect(formatPhoneNumber('010 6878 0239')).toBe('010-6878-0239')
    expect(formatPhoneNumber('010.6878.0239')).toBe('010-6878-0239')
    expect(formatPhoneNumber(' 01068780239 ')).toBe('010-6878-0239')
  })

  it('이미 하이픈이 있으면 원문 그대로', () => {
    expect(formatPhoneNumber('010-6878-0239')).toBe('010-6878-0239')
    expect(formatPhoneNumber('02-1234-5678')).toBe('02-1234-5678')
    expect(formatPhoneNumber('0106-878-0239')).toBe('0106-878-0239')
  })

  it.each([
    ['0106878'], // 자릿수 부족
    ['010687802391'], // 자릿수 초과
    ['12345'],
    ['0001234567'], // 알 수 없는 접두
    ['010-****-0239'], // 마스킹
    ['고객 abc'],
    ['+1 415 555 0100'], // 다른 나라
  ])('모르는 형식은 원문 그대로 — %s', (input) => {
    expect(formatPhoneNumber(input)).toBe(input)
  })

  it('빈 값은 빈 문자열', () => {
    expect(formatPhoneNumber('')).toBe('')
    expect(formatPhoneNumber('   ')).toBe('')
    expect(formatPhoneNumber(null)).toBe('')
    expect(formatPhoneNumber(undefined)).toBe('')
  })
})
