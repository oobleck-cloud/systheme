'use client'

import { forwardRef } from 'react'

import { useTableChrome } from './TableChromeContext'

import { cn } from '@/utils/cn'

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  /** 스크린샷의 이사일 강조 등 — 배경 톤만 적용 (내용은 자유) */
  highlight?: boolean
  /**
   * 내용 줄바꿈 방지. 짧은 값 컬럼이 줄바꿈 대신 콘텐츠 폭을 차지하도록 한다.
   * 긴 텍스트(주소 등)는 nowrap 대신 max-width + truncate 를 권장.
   */
  nowrap?: boolean
}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, highlight, nowrap, ...props }, ref) => {
    const chrome = useTableChrome()
    return (
      <td
        ref={ref}
        data-slot="table-cell"
        data-highlight={highlight ? 'true' : undefined}
        className={cn(
          'border-b border-border align-middle text-fg',
          'py-density-cell px-density-cell text-density-cell',
          chrome === 'flush' && 'border-x-0',
          highlight && 'bg-warning-subtle/80',
          nowrap && 'whitespace-nowrap',
          className,
        )}
        {...props}
      />
    )
  },
)

TableCell.displayName = 'TableCell'

export { TableCell }
export type { TableCellProps }
