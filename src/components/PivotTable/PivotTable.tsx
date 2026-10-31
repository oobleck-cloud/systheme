'use client'

import { cva } from 'class-variance-authority'
import { useState } from 'react'

import { cn } from '@/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PivotRow = {
  id: string
  label: React.ReactNode
  /** Optional trailing adornments rendered in the row header (badges, icons, etc.). */
  adornments?: React.ReactNode
}

export type PivotColumn = {
  id: string
  label: React.ReactNode
  /** Optional adornments rendered below the column label (indicator dots, counts, etc.). */
  adornments?: React.ReactNode
  /** Minimum column width. Defaults to `6rem`. */
  minWidth?: string
}

export type PivotCellKey = { rowId: string; columnId: string }

export type PivotTableDensity = 'compact' | 'default' | 'comfortable'

type PivotTableProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  rows: PivotRow[]
  columns: PivotColumn[]

  /** Controlled: selected cell. Pass `null` to deselect. */
  selectedCell?: PivotCellKey | null
  defaultSelectedCell?: PivotCellKey | null
  onSelectedCellChange?: (cell: PivotCellKey | null) => void
  onCellActivate?: (cell: PivotCellKey) => void

  density?: PivotTableDensity

  /**
   * `'panel'` — rounded border chrome (default, card-like).
   * `'flush'` — edge-to-edge, no outer border-radius.
   */
  chrome?: 'panel' | 'flush'

  /**
   * @slot 스크롤 영역 위에 렌더링되는 영역 (필터, 툴바, 기간 선택 등).
   */
  controllerRegion?: React.ReactNode
  /**
   * @slot 좌상단 고정 코너 셀 내부.
   */
  cornerCell?: React.ReactNode
  /**
   * @slot 각 데이터 셀 내부 콘텐츠. `row`와 `column`을 받아 선언형으로 렌더링하세요.
   *
   * @example
   * renderCellContent={({ row, column }) => cellData[`${row.id}-${column.id}`] ?? null}
   */
  renderCellContent?: (params: { row: PivotRow; column: PivotColumn }) => React.ReactNode
  /**
   * @slot 스크롤 영역 아래에 렌더링되는 영역 (합계, 범례 등).
   */
  footerRegion?: React.ReactNode

  /** Min-height of each data row. Defaults to `2.5rem`. */
  rowHeight?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSameCell(a: PivotCellKey, b: PivotCellKey) {
  return a.rowId === b.rowId && a.columnId === b.columnId
}

// ─── CVA Variants ─────────────────────────────────────────────────────────────

const headerCellVariants = cva(
  'border-b border-r border-border bg-surface font-medium text-fg-subtle whitespace-nowrap select-none',
  {
    variants: {
      density: {
        compact: 'px-2 py-1 text-[0.6875rem]',
        default: 'px-3 py-2 text-xs',
        comfortable: 'px-4 py-3 text-sm',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const rowHeaderCellVariants = cva(
  [
    'sticky left-0 z-10',
    'border-b border-r border-border bg-surface font-medium text-fg-subtle whitespace-nowrap',
    'flex items-center justify-between gap-2',
  ],
  {
    variants: {
      density: {
        compact: 'px-2 py-1 text-xs min-w-[7rem]',
        default: 'px-3 py-2 text-sm min-w-[8rem]',
        comfortable: 'px-4 py-3 text-base min-w-[10rem]',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const dataCellVariants = cva(
  ['border-b border-r border-border bg-background', 'outline-none transition-colors', 'align-top'],
  {
    variants: {
      density: {
        compact: 'p-1',
        default: 'p-1.5',
        comfortable: 'p-2',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

// ─── Component ────────────────────────────────────────────────────────────────

function PivotTable({
  rows,
  columns,
  selectedCell: controlledCell,
  defaultSelectedCell,
  onSelectedCellChange,
  onCellActivate,
  density = 'default',
  chrome = 'panel',
  controllerRegion,
  cornerCell,
  renderCellContent,
  footerRegion,
  rowHeight,
  className,
  ...props
}: PivotTableProps) {
  const [internalCell, setInternalCell] = useState<PivotCellKey | null>(defaultSelectedCell ?? null)
  const selected = controlledCell !== undefined ? controlledCell : internalCell

  // Roving tabindex: keep a single data cell in the tab order.
  const [focusedCell, setFocusedCell] = useState<PivotCellKey | null>(null)
  const firstCell: PivotCellKey | null =
    rows[0] && columns[0] ? { rowId: rows[0].id, columnId: columns[0].id } : null
  const tabStopCell = focusedCell ?? selected ?? firstCell

  function handleCellActivate(key: PivotCellKey) {
    const isAlreadySelected = selected != null && isSameCell(selected, key)
    const next = isAlreadySelected ? null : key
    if (controlledCell === undefined) setInternalCell(next)
    onSelectedCellChange?.(next)
    onCellActivate?.(key)
  }

  const cellHeight =
    rowHeight ??
    (density === 'compact' ? '2.25rem' : density === 'comfortable' ? '3.5rem' : '2.75rem')

  function handleGridKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return

    const currentCell = (document.activeElement as HTMLElement)?.closest<HTMLTableCellElement>(
      '[role="gridcell"]',
    )
    if (!currentCell) return

    const currentRowId = currentCell.dataset.row ?? ''
    const currentColId = currentCell.dataset.col ?? ''
    const rowIdx = rows.findIndex((r) => r.id === currentRowId)
    const colIdx = columns.findIndex((c) => c.id === currentColId)
    if (rowIdx < 0 || colIdx < 0) return

    e.preventDefault()
    let nextRowIdx = rowIdx
    let nextColIdx = colIdx

    if (key === 'ArrowDown') nextRowIdx = Math.min(rowIdx + 1, rows.length - 1)
    else if (key === 'ArrowUp') nextRowIdx = Math.max(rowIdx - 1, 0)
    else if (key === 'ArrowRight') nextColIdx = Math.min(colIdx + 1, columns.length - 1)
    else if (key === 'ArrowLeft') nextColIdx = Math.max(colIdx - 1, 0)
    else if (key === 'Home') nextColIdx = 0
    else if (key === 'End') nextColIdx = columns.length - 1

    const nextRowId = rows[nextRowIdx]?.id
    const nextColId = columns[nextColIdx]?.id
    if (!nextRowId || !nextColId) return

    setFocusedCell({ rowId: nextRowId, columnId: nextColId })
    const target = e.currentTarget.querySelector<HTMLElement>(
      `[role="gridcell"][data-row="${nextRowId}"][data-col="${nextColId}"]`,
    )
    target?.focus()
  }

  return (
    <div
      data-slot="pivot-table-root"
      data-density={density}
      className={cn(
        'flex flex-col overflow-hidden bg-background text-fg',
        chrome === 'panel' && 'rounded-lg border border-border',
        className,
      )}
      {...props}
    >
      {/* ── controller-region slot ── */}
      {controllerRegion != null && (
        <div data-slot="pivot-table-controller-region" className="shrink-0 border-b border-border">
          {controllerRegion}
        </div>
      )}

      {/* ── scroll-surface ── */}
      <div data-slot="pivot-table-scroll-surface" className="flex-1 overflow-auto min-h-0">
        <table role="grid" className="table-fixed border-collapse" onKeyDown={handleGridKeyDown}>
          {/* Column width hints */}
          <colgroup>
            {/* Row header column */}
            <col
              style={
                {
                  '--ds-pt-row-header-w':
                    density === 'compact' ? '7rem' : density === 'comfortable' ? '10rem' : '8rem',
                  width: 'var(--ds-pt-row-header-w)',
                } as React.CSSProperties
              }
            />
            {columns.map((col) => (
              <col
                key={col.id}
                style={
                  {
                    '--ds-pt-col-w': col.minWidth ?? '6rem',
                    width: 'var(--ds-pt-col-w)',
                  } as React.CSSProperties
                }
              />
            ))}
          </colgroup>

          {/* ── Header row ── */}
          <thead>
            <tr data-slot="pivot-table-header-row">
              {/* corner-cell */}
              <th
                data-slot="pivot-table-corner-cell"
                scope="col"
                className={cn(
                  'sticky left-0 top-0 z-30',
                  headerCellVariants({ density }),
                  'text-left',
                )}
              >
                {cornerCell}
              </th>

              {/* column-headers */}
              {columns.map((col) => (
                <th
                  key={col.id}
                  data-slot="pivot-table-column-header-cell"
                  scope="col"
                  className={cn(
                    'sticky top-0 z-20',
                    headerCellVariants({ density }),
                    'text-center',
                  )}
                >
                  <div data-slot="pivot-table-column-label" className="truncate">
                    {col.label}
                  </div>
                  {col.adornments != null && (
                    <div
                      data-slot="pivot-table-column-adornments"
                      className="mt-0.5 flex items-center justify-center gap-0.5"
                    >
                      {col.adornments}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body rows ── */}
          <tbody data-slot="pivot-table-body-rows">
            {rows.map((row) => (
              <tr key={row.id} data-slot="pivot-table-matrix-row" role="row">
                {/* row-header-cell */}
                <th
                  scope="row"
                  data-slot="pivot-table-row-header-cell"
                  style={{ '--ds-pt-row-h': cellHeight } as React.CSSProperties}
                  className={cn(rowHeaderCellVariants({ density }), 'min-h-[var(--ds-pt-row-h)]')}
                >
                  <span data-slot="pivot-table-row-label" className="truncate">
                    {row.label}
                  </span>
                  {row.adornments != null && (
                    <span data-slot="pivot-table-row-adornments" className="shrink-0">
                      {row.adornments}
                    </span>
                  )}
                </th>

                {/* data-cells */}
                {columns.map((col) => {
                  const key: PivotCellKey = { rowId: row.id, columnId: col.id }
                  const isSelected = selected != null && isSameCell(selected, key)
                  const isTabStop = tabStopCell != null && isSameCell(tabStopCell, key)

                  return (
                    <td
                      key={col.id}
                      role="gridcell"
                      data-slot="pivot-table-matrix-cell"
                      data-row={row.id}
                      data-col={col.id}
                      aria-selected={isSelected}
                      tabIndex={isTabStop ? 0 : -1}
                      style={{ '--ds-pt-row-h': cellHeight } as React.CSSProperties}
                      onFocus={() => setFocusedCell(key)}
                      onClick={() => handleCellActivate(key)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleCellActivate(key)
                        }
                      }}
                      className={cn(
                        dataCellVariants({ density }),
                        'min-h-[var(--ds-pt-row-h)]',
                        isSelected && 'ring-2 ring-primary ring-inset bg-primary/5',
                        !isSelected &&
                          'hover:bg-surface/70 hover:ring-1 hover:ring-ring hover:ring-inset',
                        'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset focus-visible:outline-none',
                      )}
                    >
                      {/* cell-content slot */}
                      {renderCellContent && (
                        <div
                          data-slot="pivot-table-cell-content"
                          className="flex min-h-[var(--ds-pt-row-h)] items-start"
                        >
                          {renderCellContent({ row, column: col })}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── footer-region slot ── */}
      {footerRegion != null && (
        <div data-slot="pivot-table-footer-region" className="shrink-0 border-t border-border">
          {footerRegion}
        </div>
      )}
    </div>
  )
}

PivotTable.displayName = 'PivotTable'

export { PivotTable }
export type { PivotTableProps }
