import fc from 'fast-check'
import { describe, expect, test } from 'vitest'

import {
  buildPaginationRange,
  maxPaginationRangeLength,
  allocatePaginationSlots,
} from './buildPaginationRange'

/**
 * Pagination range 함수는 단순해 보이지만 모든 경계(total=0, current=1, current=total,
 * delta가 total보다 큰 경우)에서 invariant를 지켜야 한다. 손으로 적은 케이스 + property test.
 */

describe('buildPaginationRange — 손으로 검증한 대표 케이스', () => {
  test('total=0이면 빈 배열', () => {
    expect(buildPaginationRange(1, 0, 1)).toEqual([])
  })

  test('total=1이면 [1]', () => {
    expect(buildPaginationRange(1, 1, 1)).toEqual([1])
  })

  test('total=5, current=3, delta=1 → [1,2,3,4,5]', () => {
    expect(buildPaginationRange(3, 5, 1)).toEqual([1, 2, 3, 4, 5])
  })

  test('total=10, current=5, delta=1 → [1, ellipsis, 4,5,6, ellipsis, 10]', () => {
    expect(buildPaginationRange(5, 10, 1)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10])
  })

  test('total=10, current=1, delta=1 → [1,2, ellipsis, 10]', () => {
    expect(buildPaginationRange(1, 10, 1)).toEqual([1, 2, 'ellipsis', 10])
  })

  test('total=10, current=10, delta=1 → [1, ellipsis, 9,10]', () => {
    expect(buildPaginationRange(10, 10, 1)).toEqual([1, 'ellipsis', 9, 10])
  })

  test('인접한 두 페이지 사이에 ellipsis 없음', () => {
    // current=3, total=5, delta=1 — 1과 2 사이에 ellipsis가 없어야 함
    const r = buildPaginationRange(3, 5, 1)
    expect(r).not.toContain('ellipsis')
  })

  test('한 페이지 차이는 ellipsis 대신 그 페이지를 넣는다', () => {
    // current=4, total=10, delta=1 → 1과 3 사이는 한 페이지 차이라 2가 들어감
    expect(buildPaginationRange(4, 10, 1)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 10])
  })
})

describe('maxPaginationRangeLength', () => {
  test('total=10, delta=1 → 최대 7슬롯', () => {
    expect(maxPaginationRangeLength(10, 1)).toBe(7)
  })

  test('total=5, delta=1 → ellipsis 없이 5', () => {
    expect(maxPaginationRangeLength(5, 1)).toBe(5)
  })
})

describe('allocatePaginationSlots', () => {
  test('첫·마지막 페이지는 양 끝 슬롯에 고정', () => {
    const slots = allocatePaginationSlots([1, 2, 'ellipsis', 12], 7)
    expect(slots[0]).toBe(1)
    expect(slots[6]).toBe(12)
    expect(slots[1]).toBe(2)
    expect(slots[2]).toBe('ellipsis')
    expect(slots[3]).toBeNull()
  })

  test('중간 페이지 range 는 슬롯을 가득 채운다', () => {
    const range = buildPaginationRange(5, 12, 1)
    const slots = allocatePaginationSlots(range, maxPaginationRangeLength(12, 1))
    expect(slots).toEqual(range)
  })
})

describe('buildPaginationRange — property-based invariants', () => {
  test('출력은 항상 1과 total 을 포함한다 (total >= 1)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 0, max: 5 }),
        (total, delta) => {
          const current = Math.min(Math.max(1, Math.floor(total / 2)), total)
          const r = buildPaginationRange(current, total, delta)
          expect(r[0]).toBe(1)
          expect(r[r.length - 1]).toBe(total)
        },
      ),
    )
  })

  test('current 페이지가 항상 결과에 포함된다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 1, max: 500 }),
        (total, delta, currentRaw) => {
          const current = ((currentRaw - 1) % total) + 1
          const r = buildPaginationRange(current, total, delta)
          expect(r).toContain(current)
        },
      ),
    )
  })

  test('숫자 항목은 항상 [1, total] 범위 안이며 단조 증가', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 5 }),
        (total, delta) => {
          const r = buildPaginationRange(Math.ceil(total / 2), total, delta)
          const nums = r.filter((x): x is number => typeof x === 'number')
          for (const n of nums) {
            expect(n).toBeGreaterThanOrEqual(1)
            expect(n).toBeLessThanOrEqual(total)
          }
          for (let i = 1; i < nums.length; i += 1) {
            expect(nums[i]).toBeGreaterThan(nums[i - 1]!)
          }
        },
      ),
    )
  })

  test('연속된 두 ellipsis는 등장하지 않는다', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 5 }),
        (total, delta) => {
          const r = buildPaginationRange(Math.ceil(total / 2), total, delta)
          for (let i = 1; i < r.length; i += 1) {
            if (r[i] === 'ellipsis' && r[i - 1] === 'ellipsis') {
              throw new Error(`연속 ellipsis: ${r.join(',')}`)
            }
          }
        },
      ),
    )
  })
})
