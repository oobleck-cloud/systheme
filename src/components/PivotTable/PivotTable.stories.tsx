'use client'

import { expect, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { PivotTable } from './PivotTable'
import anatomy from './PivotTable.anatomy.json'

import type { PivotCellKey, PivotColumn, PivotRow } from './PivotTable'
import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof PivotTable> = {
  title: 'Components/L3/PivotTable',
  component: PivotTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof PivotTable>

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const ROWS: PivotRow[] = [
  { id: 'r1', label: 'Row A' },
  { id: 'r2', label: 'Row B' },
  { id: 'r3', label: 'Row C' },
  { id: 'r4', label: 'Row D' },
  { id: 'r5', label: 'Row E' },
]

const COLS: PivotColumn[] = [
  { id: 'c1', label: 'Col 1', minWidth: '5rem' },
  { id: 'c2', label: 'Col 2', minWidth: '5rem' },
  { id: 'c3', label: 'Col 3', minWidth: '5rem' },
  { id: 'c4', label: 'Col 4', minWidth: '5rem' },
  { id: 'c5', label: 'Col 5', minWidth: '5rem' },
]

type CellVariant = 'filled' | 'muted' | 'empty'

const CELL_VARIANTS: Record<string, CellVariant> = {
  'r1-c1': 'filled',
  'r1-c2': 'filled',
  'r1-c4': 'muted',
  'r2-c1': 'muted',
  'r2-c3': 'filled',
  'r2-c5': 'filled',
  'r3-c2': 'filled',
  'r3-c3': 'filled',
  'r3-c5': 'muted',
  'r4-c1': 'filled',
  'r5-c4': 'filled',
  'r5-c5': 'filled',
}

const VARIANT_STYLES: Record<CellVariant, string> = {
  filled: 'bg-primary/10 text-primary',
  muted: 'bg-surface text-fg-subtle',
  empty: '',
}

const VARIANT_LABELS: Record<CellVariant, string> = {
  filled: 'Active',
  muted: 'Paused',
  empty: '',
}

function CellChip({ rowId, colId }: { rowId: string; colId: string }) {
  const variant = CELL_VARIANTS[`${rowId}-${colId}`] ?? 'empty'
  if (variant === 'empty') return null
  return (
    <span
      className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${VARIANT_STYLES[variant]}`}
    >
      {VARIANT_LABELS[variant]}
    </span>
  )
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<PivotCellKey | null>(null)
    return (
      <div className="h-[24rem]">
        <PivotTable
          rows={ROWS}
          columns={COLS}
          selectedCell={selected}
          onSelectedCellChange={setSelected}
          cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
          renderCellContent={({ row, column }) => <CellChip rowId={row.id} colId={column.id} />}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cells = canvas.getAllByRole('gridcell')
    const firstCell = cells[0]
    expect(firstCell).toBeTruthy()
    await userEvent.click(firstCell)
    expect(firstCell).toHaveAttribute('aria-selected', 'true')
  },
}

/** Demonstrates `column.adornments` — small decorators below the column label. */
export const WithColumnAdornments: Story = {
  name: 'Slot — column adornments',
  render: () => {
    const COUNTS: Record<string, number> = { c1: 4, c2: 2, c3: 3, c5: 1 }
    const colsWithAdornments: PivotColumn[] = COLS.map((c) => ({
      ...c,
      adornments: COUNTS[c.id] ? (
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-primary text-[0.5rem] font-bold text-primary-fg">
          {COUNTS[c.id]}
        </span>
      ) : null,
    }))
    return (
      <div className="h-[24rem]">
        <PivotTable
          rows={ROWS}
          columns={colsWithAdornments}
          cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
        />
      </div>
    )
  },
}

/** Demonstrates `row.adornments` — trailing badges in the row header. */
export const WithRowAdornments: Story = {
  name: 'Slot — row adornments',
  render: () => {
    const rowsWithAdornments: PivotRow[] = ROWS.map((r, i) => ({
      ...r,
      adornments:
        i % 2 === 0 ? (
          <span className="inline-flex rounded-full bg-success-subtle px-1.5 py-0.5 text-[0.5625rem] font-medium text-success-text">
            Active
          </span>
        ) : null,
    }))
    return (
      <div className="h-[24rem]">
        <PivotTable
          rows={rowsWithAdornments}
          columns={COLS}
          cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
        />
      </div>
    )
  },
}

/** Demonstrates the `controllerRegion` slot with a simple filter toggle. */
export const WithControllerSlot: Story = {
  name: 'Slot — controller-region',
  render: () => {
    const [selected, setSelected] = useState<PivotCellKey | null>(null)
    const [filter, setFilter] = useState<CellVariant | 'all'>('all')

    const filteredRows =
      filter === 'all'
        ? ROWS
        : ROWS.filter((r) =>
            COLS.some((c) => (CELL_VARIANTS[`${r.id}-${c.id}`] ?? 'empty') === filter),
          )

    return (
      <div className="h-[28rem]">
        <PivotTable
          rows={filteredRows}
          columns={COLS}
          selectedCell={selected}
          onSelectedCellChange={setSelected}
          controllerRegion={
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="text-xs font-medium text-fg-subtle">Filter:</span>
              {(['all', 'filled', 'muted'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={[
                    'rounded px-2 py-0.5 text-xs transition-colors',
                    filter === f
                      ? 'bg-primary text-primary-fg'
                      : 'bg-surface text-fg-subtle hover:text-fg',
                  ].join(' ')}
                >
                  {f === 'all' ? 'All' : VARIANT_LABELS[f]}
                </button>
              ))}
            </div>
          }
          cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
          renderCellContent={({ row, column }) => <CellChip rowId={row.id} colId={column.id} />}
        />
      </div>
    )
  },
}

export const DensityCompact: Story = {
  name: 'Density — compact',
  render: () => (
    <div className="h-[18rem]">
      <PivotTable
        rows={ROWS}
        columns={COLS}
        density="compact"
        cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
      />
    </div>
  ),
}

export const DensityComfortable: Story = {
  name: 'Density — comfortable',
  render: () => (
    <div className="h-[30rem]">
      <PivotTable
        rows={ROWS}
        columns={COLS}
        density="comfortable"
        cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
      />
    </div>
  ),
}

export const ChromeFlush: Story = {
  name: 'Chrome — flush',
  render: () => (
    <div className="h-[22rem] border border-border">
      <PivotTable
        rows={ROWS}
        columns={COLS}
        chrome="flush"
        className="h-full"
        cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
      />
    </div>
  ),
}

/** Demonstrates horizontal scroll with many columns. */
export const ManyColumns: Story = {
  name: 'Horizontal scroll',
  render: () => {
    const bigCols: PivotColumn[] = Array.from({ length: 20 }, (_, i) => ({
      id: `c${i + 1}`,
      label: `Col ${i + 1}`,
      minWidth: '4.5rem',
    }))
    return (
      <div className="h-[22rem]">
        <PivotTable
          rows={ROWS}
          columns={bigCols}
          cornerCell={<span className="text-fg-muted">Rows / Cols</span>}
        />
      </div>
    )
  },
}
