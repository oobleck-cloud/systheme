import { describe, expect, test } from 'vitest'

import { cn } from './cn'

/**
 * cn() 은 clsx + tailwind-merge 의 합성. 디자인시스템에서 가장 빈번히 호출되는
 * 헬퍼이므로 다음 4가지 계약을 항상 만족해야 한다:
 *
 *  1. falsy 값(undefined, null, false, '') 무시
 *  2. 배열/객체 conditional 형태 평탄화
 *  3. 같은 Tailwind property 충돌 시 뒤쪽이 이김 (twMerge)
 *  4. 결과는 단일 string + 공백 분리
 */

describe('cn() 계약', () => {
  test('falsy 값을 무시한다', () => {
    expect(cn('a', undefined, null, false, '', 'b')).toBe('a b')
  })

  test('배열/객체 conditional을 평탄화', () => {
    expect(cn(['a', 'b'], { c: true, d: false })).toBe('a b c')
  })

  test('Tailwind 충돌 시 뒤쪽이 이긴다', () => {
    // px-2 vs px-4 → 뒤쪽 px-4 가 살아남음
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    // text-red-500 vs text-blue-500
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  test('Tailwind 비충돌 클래스는 모두 보존', () => {
    const out = cn('flex items-center gap-2', 'rounded-lg')
    expect(out).toContain('flex')
    expect(out).toContain('items-center')
    expect(out).toContain('gap-2')
    expect(out).toContain('rounded-lg')
  })

  test('빈 입력은 빈 문자열', () => {
    expect(cn()).toBe('')
    expect(cn(undefined, null, false)).toBe('')
  })

  test('중복 클래스는 한 번만 (twMerge)', () => {
    // 같은 클래스 두 번 → 한 번만
    const out = cn('flex', 'flex')
    expect(out.split(/\s+/).filter((x) => x === 'flex').length).toBe(1)
  })
})
