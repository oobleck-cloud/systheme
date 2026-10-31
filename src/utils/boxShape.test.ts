import fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import { getInitials } from './boxShape'

describe('getInitials 손 케이스', () => {
  test('빈 문자열', () => {
    expect(getInitials('')).toBe('')
  })

  test('단일 단어', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  test('공백 제거 + 두 글자 기본', () => {
    expect(getInitials('Alice Kim')).toBe('AK')
  })

  test('세 단어 → 기본 2글자', () => {
    expect(getInitials('John Fitzgerald Kennedy')).toBe('JF')
  })

  test('maxLength=3', () => {
    expect(getInitials('John Fitzgerald Kennedy', 3)).toBe('JFK')
  })

  test('대소문자 정규화 (대문자)', () => {
    expect(getInitials('alice kim')).toBe('AK')
  })

  test('한글', () => {
    expect(getInitials('홍 길동')).toBe('홍길')
  })

  test('연속 공백', () => {
    expect(getInitials('  Alice   Kim  ')).toBe('AK')
  })
})

describe('getInitials property invariants', () => {
  test('출력 길이는 항상 maxLength 이하', () => {
    fc.assert(
      fc.property(fc.string(), fc.integer({ min: 1, max: 5 }), (name, maxLength) => {
        const out = getInitials(name, maxLength)
        return out.length <= maxLength
      }),
    )
  })

  test('빈 또는 공백뿐인 입력은 빈 문자열', () => {
    fc.assert(
      fc.property(fc.constantFrom('', '   ', '\t\n', '   \t   '), (s) => {
        // getInitials는 split(/\s+/) 후 첫 글자를 가져오는데, 빈 문자열의 split 결과는 [''], 그 첫 글자는 ''
        // 공백뿐인 입력은 trim 후 split → ['']
        expect(getInitials(s)).toBe('')
      }),
    )
  })
})
