'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Stack } from '@/components/layout/Stack'
import { Switch } from '@/components/Switch/Switch'
import { cn } from '@/utils/cn'

export type MatrixToggleCellDef = { id: string; label?: string }

export type MatrixToggleRowDef = { id: string; label: string; cells: MatrixToggleCellDef[] }

export type MatrixToggleValue = Record<string, Record<string, boolean>>

export type MatrixToggleGridProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  rows: MatrixToggleRowDef[]
  value?: MatrixToggleValue
  defaultValue?: MatrixToggleValue
  onChange?: (next: MatrixToggleValue) => void
}

const MatrixToggleGrid = forwardRef<HTMLDivElement, MatrixToggleGridProps>(
  ({ className, rows, value: valueProp, defaultValue = {}, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = useState<MatrixToggleValue>(defaultValue)
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp! : internalValue

    const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null)
    const tabStopCell = focusedCell ?? { row: 0, col: 0 }

    const handleToggle = useCallback(
      (rowId: string, cellId: string, nextOn: boolean) => {
        const next: MatrixToggleValue = {
          ...value,
          [rowId]: {
            ...(value[rowId] ?? {}),
            [cellId]: nextOn,
          },
        }
        if (!isControlled) setInternalValue(next)
        onChange?.(next)
      },
      [isControlled, onChange, value],
    )

    function handleGridKeyDown(e: React.KeyboardEvent<HTMLTableElement>) {
      const key = e.key
      if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return

      const current = (document.activeElement as HTMLElement)?.closest<HTMLElement>(
        '[data-matrix-cell]',
      )
      if (!current) return

      const rowIdx = Number(current.dataset.row ?? -1)
      const colIdx = Number(current.dataset.col ?? -1)
      if (rowIdx < 0 || colIdx < 0) return

      const numCols = rows[0]?.cells.length ?? 0
      if (numCols === 0) return

      e.preventDefault()
      let nextRow = rowIdx
      let nextCol = colIdx

      if (key === 'ArrowDown') nextRow = Math.min(rowIdx + 1, rows.length - 1)
      else if (key === 'ArrowUp') nextRow = Math.max(rowIdx - 1, 0)
      else if (key === 'ArrowRight') nextCol = Math.min(colIdx + 1, numCols - 1)
      else if (key === 'ArrowLeft') nextCol = Math.max(colIdx - 1, 0)
      else if (key === 'Home') nextCol = 0
      else if (key === 'End') nextCol = numCols - 1

      setFocusedCell({ row: nextRow, col: nextCol })
      const target = e.currentTarget.querySelector<HTMLElement>(
        `[data-matrix-cell][data-row="${nextRow}"][data-col="${nextCol}"] button`,
      )
      target?.focus()
    }

    return (
      <div
        ref={ref}
        data-slot="matrix-toggle-grid-root"
        className={cn('w-full overflow-x-auto', className)}
        {...props}
      >
        <table
          role="grid"
          aria-label="Matrix toggle grid"
          className="w-full min-w-max border-collapse text-sm"
          onKeyDown={handleGridKeyDown}
        >
          <tbody>
            {rows.map((r, rowIdx) => (
              <tr key={r.id} role="row" data-slot="matrix-toggle-grid-row">
                <th
                  scope="row"
                  role="rowheader"
                  data-slot="matrix-toggle-grid-row-label"
                  className="border-b border-border px-2 py-2 text-left font-medium text-fg"
                >
                  {r.label}
                </th>
                <td
                  data-slot="matrix-toggle-grid-cells"
                  className="border-b border-border px-2 py-2"
                >
                  <Stack direction="horizontal" align="center" gap={3} wrap>
                    {r.cells.map((cell, colIdx) => (
                      <span
                        key={cell.id}
                        role="gridcell"
                        data-slot="matrix-toggle-grid-cell-toggle"
                        data-matrix-cell
                        data-row={rowIdx}
                        data-col={colIdx}
                      >
                        <Switch
                          checked={value[r.id]?.[cell.id] ?? false}
                          aria-label={`${r.label} ${cell.label ?? cell.id}`}
                          tabIndex={
                            rowIdx === tabStopCell.row && colIdx === tabStopCell.col ? 0 : -1
                          }
                          onFocus={() => setFocusedCell({ row: rowIdx, col: colIdx })}
                          onCheckedChange={(next) => handleToggle(r.id, cell.id, next)}
                        />
                      </span>
                    ))}
                  </Stack>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
)

MatrixToggleGrid.displayName = 'MatrixToggleGrid'

export { MatrixToggleGrid }
