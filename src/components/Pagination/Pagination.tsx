'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { ChevronsLeft, ChevronsRight, createIconElement } from '@/icons'
import {
  allocatePaginationSlots,
  buildPaginationRange,
  maxPaginationRangeLength,
} from '@/utils/buildPaginationRange'
import { cn } from '@/utils/cn'

/**
 * 페이지 번호 버튼 — 넓으면 자릿수와 무관하게 같은 폭(w-12), 좁으면 **남는 폭을 고르게 나눈다.**
 *
 * 좁은 화면에서 폭을 고정하면 다섯 개(« 이전 현재 다음 »)가 컨테이너를 넘어 마지막 »가 잘렸다.
 * 다섯은 전부 보여야 하는 최소 구성이므로, 줄어드는 쪽은 각 칸이고 바닥은 터치 타깃(40px)이다.
 */
const pageControlClassName = 'w-full min-w-0 px-0 tabular-nums'
const pageSlotClassName = 'flex w-12 min-w-10 shrink items-center justify-center'

type PaginationProps = React.HTMLAttributes<HTMLElement> & {
  page?: number
  defaultPage?: number
  totalPages: number
  totalItems?: number
  onPageChange?: (page: number) => void
  /** 현재 페이지 양옆에 보일 페이지 수 (기본 1) */
  siblingCount?: number
  /** `총 N건` 영역 표시 */
  showSummary?: boolean
  summaryFormatter?: (totalItems: number) => React.ReactNode
  /** 맨 처음/맨 끝 버튼의 접근성 이름 */
  firstLabel?: string
  lastLabel?: string
}

function Pagination({
  className,
  page: pageProp,
  defaultPage = 1,
  totalPages,
  totalItems,
  onPageChange,
  siblingCount = 1,
  showSummary = true,
  summaryFormatter,
  firstLabel = '첫 페이지',
  lastLabel = '마지막 페이지',
  ...props
}: PaginationProps) {
  const [internalPage, setInternalPage] = useState(defaultPage)
  const isControlled = pageProp !== undefined
  const page = isControlled ? pageProp! : internalPage

  const handlePageChange = (next: number) => {
    if (!isControlled) setInternalPage(next)
    onPageChange?.(next)
  }

  const safeTotal = Math.max(0, totalPages)
  const safePage = Math.min(Math.max(1, page), Math.max(1, safeTotal))
  const range = safeTotal > 0 ? buildPaginationRange(safePage, safeTotal, siblingCount) : []
  const slotCount = maxPaginationRangeLength(safeTotal, siblingCount)
  /**
   * 자리맞춤 빈칸은 그리지 않는다.
   *
   * 예전에는 페이지가 바뀌어도 폭이 흔들리지 않게 빈 슬롯으로 자리를 잡아 뒀는데, 말줄임이
   * 생기는 페이지에서는 그 빈칸이 **가운데가 뚫린 구멍**으로 보였다(실측). 묶음이 가운데
   * 정렬이라 폭이 한 칸 늘고 주는 것은 눈에 띄지 않지만, 구멍은 눈에 띈다.
   */
  const slots = useMemo(
    () => allocatePaginationSlots(range, slotCount).filter((slot) => slot !== null),
    [range, slotCount],
  )

  /**
   * 좁은 폭에서 남길 슬롯 — 현재 페이지와 그 양옆뿐.
   *
   * 나머지(먼 번호·말줄임·자리맞춤 빈칸)는 접는다. 예전에는 이전·다음 버튼과 일곱 칸이
   * 통째로 남아 가로로 넘쳤고, 스크롤로 버티게 하면 페이지 번호를 찾으러 옆으로 밀어야 했다.
   * 처음·끝은 번호가 아니라 « » 로 남으므로 어디서든 양 끝으로 한 번에 간다.
   */
  const isNearCurrent = (item: number | 'ellipsis' | null): boolean =>
    typeof item === 'number' && Math.abs(item - safePage) <= 1

  const summary =
    showSummary && totalItems != null
      ? (summaryFormatter?.(totalItems) ?? (
          <span className="text-sm text-fg-muted">총 {totalItems}건</span>
        ))
      : null

  if (safeTotal <= 0) {
    return summary ? (
      <nav
        data-slot="pagination-root"
        className={cn('flex w-full items-center justify-center', className)}
        {...props}
      >
        {summary}
      </nav>
    ) : null
  }

  return (
    <nav
      data-slot="pagination-root"
      // 좁으면 요약이 위로 접히고, 그래도 모자라면 컨트롤이 스스로 가로 스크롤한다.
      // 예전에는 요약이 `absolute right-full` 이라 화면 왼쪽 밖으로 나가 잘렸다(실측).
      className={cn('@container/pagination flex w-full flex-col items-center gap-2', className)}
      aria-label="페이지 탐색"
      {...props}
    >
      {summary ? (
        <div
          data-slot="pagination-summary"
          className="w-full text-center whitespace-nowrap @[26rem]/pagination:hidden"
        >
          {summary}
        </div>
      ) : null}
      <div className="relative flex max-w-full items-center justify-center">
        <div
          data-slot="pagination-controls"
          className="flex min-w-0 items-center justify-center gap-1.5 @[26rem]/pagination:gap-2"
        >
          <IconButton
            type="button"
            variant="secondary"
            size="md"
            className="shrink-0"
            data-slot="pagination-first"
            aria-label={firstLabel}
            disabled={safePage <= 1}
            onClick={() => handlePageChange(1)}
          >
            {createIconElement(ChevronsLeft, 'sm')}
          </IconButton>
          <ul
            data-slot="pagination-pages"
            className="flex min-w-0 items-center gap-1.5 @[26rem]/pagination:gap-2"
          >
            {slots.map((item, idx) => {
              const slotClass = cn(
                pageSlotClassName,
                !isNearCurrent(item) && 'hidden @[26rem]/pagination:flex',
              )

              if (item === null) {
                return (
                  <li key={`slot-${idx}`} className={slotClass} aria-hidden>
                    <span className="invisible text-sm">0</span>
                  </li>
                )
              }

              if (item === 'ellipsis') {
                return (
                  <li key={`ellipsis-${idx}`} className={slotClass}>
                    <span className="text-sm text-fg-muted" aria-hidden>
                      …
                    </span>
                  </li>
                )
              }

              return (
                <li key={`page-${item}-${idx}`} className={slotClass}>
                  <Button
                    type="button"
                    variant={item === safePage ? 'primary' : 'secondary'}
                    size="md"
                    density="default"
                    className={pageControlClassName}
                    data-slot="pagination-page-control"
                    aria-current={item === safePage ? 'page' : undefined}
                    onClick={() => handlePageChange(item)}
                  >
                    {item}
                  </Button>
                </li>
              )
            })}
          </ul>
          <IconButton
            type="button"
            variant="secondary"
            size="md"
            className="shrink-0"
            data-slot="pagination-last"
            aria-label={lastLabel}
            disabled={safePage >= safeTotal}
            onClick={() => handlePageChange(safeTotal)}
          >
            {createIconElement(ChevronsRight, 'sm')}
          </IconButton>
        </div>
        {summary ? (
          <div
            data-slot="pagination-summary"
            className="absolute top-1/2 right-full mr-4 hidden -translate-y-1/2 whitespace-nowrap @[26rem]/pagination:block"
          >
            {summary}
          </div>
        ) : null}
      </div>
    </nav>
  )
}

export { Pagination }
export type { PaginationProps }
