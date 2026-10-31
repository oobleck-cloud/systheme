'use client'

import { forwardRef, useCallback } from 'react'

import { TableCell } from './TableCell'
import { useTableChrome } from './TableChromeContext'

import { cn } from '@/utils/cn'

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & {
  rowId?: string
  selected?: boolean
  /**
   * anatomy `row-select` — 보통 체크박스.
   *
   * 셀은 이 컴포넌트가 만든다. `TableCell` 로 감싸 넘기면 `<td>` 안에 `<td>` 가 되어
   * 하이드레이션이 깨진다 — 내용만 넘긴다.
   */
  selectionSlot?: React.ReactNode
  /** anatomy `row-activate` — 별도 셀/버튼; 생략 시 `onActivate` 로 행 클릭 처리 */
  activateSlot?: React.ReactNode
  /** 행 전체 클릭 시 (버튼·링크·입력 등은 무시) */
  onActivate?: (rowId: string) => void
}

function isInteractiveRowTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(
    target.closest(
      'button,a,input,textarea,select,option,[role="button"],[role="checkbox"],[role="menuitem"],[data-table-row-stop]',
    ),
  )
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  (
    {
      className,
      rowId,
      selected,
      selectionSlot,
      activateSlot,
      onActivate,
      onClick,
      onMouseDown,
      onKeyDown,
      children,
      ...props
    },
    ref,
  ) => {
    const chrome = useTableChrome()
    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLTableRowElement>) => {
        onMouseDown?.(e)
        if (e.defaultPrevented) return
        if (!onActivate) return
        if (isInteractiveRowTarget(e.target)) return
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
        }
      },
      [onMouseDown, onActivate],
    )

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLTableRowElement>) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (!onActivate) return
        if (isInteractiveRowTarget(e.target)) return
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault()
        }
        if (rowId != null) {
          onActivate(rowId)
        }
        if (e.metaKey || e.ctrlKey) {
          window.getSelection()?.removeAllRanges()
        }
      },
      [onClick, onActivate, rowId],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (!onActivate || rowId == null) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate(rowId)
        }
      },
      [onKeyDown, onActivate, rowId],
    )

    return (
      <tr
        ref={ref}
        data-slot="table-row"
        data-selected={selected || undefined}
        tabIndex={onActivate ? -1 : undefined}
        className={cn(
          onActivate &&
            (chrome === 'flush'
              ? 'cursor-pointer select-none transition-colors hover:bg-surface/70'
              : 'cursor-pointer select-none transition-colors hover:bg-surface/80'),
          selected && 'bg-surface/60',
          className,
        )}
        onMouseDown={onActivate ? handleMouseDown : onMouseDown}
        onClick={onActivate ? handleClick : onClick}
        onKeyDown={onActivate ? handleKeyDown : onKeyDown}
        {...props}
      >
        {selectionSlot != null && selectionSlot !== false && (
          <TableCell className={cn('w-12 min-w-12 align-middle', 'py-density-cell px-2')}>
            {selectionSlot}
          </TableCell>
        )}
        {activateSlot != null && activateSlot !== false && activateSlot}
        {children}
      </tr>
    )
  },
)

TableRow.displayName = 'TableRow'

export { TableRow }
export type { TableRowProps }
