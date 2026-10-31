/** `1 … 4 5 6 … 10` 형태의 페이지 인덱스(1-based) 또는 `'ellipsis'` 배열 */
function buildPaginationRange(
  current: number,
  total: number,
  delta: number,
): Array<number | 'ellipsis'> {
  if (total < 1) return []
  const range: number[] = []
  for (let i = 1; i <= total; i += 1) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i)
    }
  }
  const out: Array<number | 'ellipsis'> = []
  let prev: number | undefined
  for (const i of range) {
    if (prev !== undefined) {
      if (i - prev === 2) out.push(prev + 1)
      else if (i - prev > 2) out.push('ellipsis')
    }
    out.push(i)
    prev = i
  }
  return out
}

/** 현재 total·delta 에서 페이지 전환 시 나올 수 있는 최대 range 길이 */
function maxPaginationRangeLength(totalPages: number, delta: number): number {
  if (totalPages < 1) return 0
  let max = 0
  for (let page = 1; page <= totalPages; page += 1) {
    max = Math.max(max, buildPaginationRange(page, totalPages, delta).length)
  }
  return max
}

type PaginationSlot = number | 'ellipsis' | null

/**
 * range 를 고정 슬롯 수에 배치 — 첫·마지막 페이지는 양 끝 슬롯에 고정,
 * 중간 항목은 왼쪽부터 순서대로 채워 페이지 전환 시 버튼 위치가 흔들리지 않게 한다.
 */
function allocatePaginationSlots(
  range: Array<number | 'ellipsis'>,
  slotCount: number,
): PaginationSlot[] {
  const slots: PaginationSlot[] = Array.from({ length: slotCount }, () => null)
  if (range.length === 0 || slotCount === 0) return slots

  slots[0] = range[0]!

  if (range.length === 1 || slotCount === 1) return slots

  slots[slotCount - 1] = range[range.length - 1]!

  const middle = range.slice(1, -1)
  for (let i = 0; i < middle.length; i += 1) {
    const slotIndex = 1 + i
    if (slotIndex >= slotCount - 1) break
    slots[slotIndex] = middle[i]!
  }

  return slots
}

export { allocatePaginationSlots, buildPaginationRange, maxPaginationRangeLength }
export type { PaginationSlot }
