'use client'

import { expect, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { MonthGrid } from './MonthGrid'
import anatomy from './MonthGrid.anatomy.json'

import type { MonthGridDayMeta } from './MonthGrid'
import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof MonthGrid> = {
  title: 'Components/L3/MonthGrid',
  component: MonthGrid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MonthGrid>

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const DEMO_MONTH = new Date(2025, 0, 1) // January 2025

/** Public holiday metadata keyed by ISO date string. */
const HOLIDAY_META: Record<string, MonthGridDayMeta> = {
  '2025-01-01': { kind: 'holiday', holidayLabel: 'Holiday' },
  '2025-01-20': { kind: 'holiday', holidayLabel: 'Holiday' },
}

function getDayMeta(date: Date): MonthGridDayMeta | undefined {
  return HOLIDAY_META[date.toISOString().slice(0, 10)]
}

// ─── Stories ──────────────────────────────────────────────────────────────────

/** month prop 없이 내장 네비게이션으로 월을 이동할 수 있는 uncontrolled 모드 */
export const UncontrolledNavigation: Story = {
  render: () => (
    <div className="w-[52rem]">
      <MonthGrid defaultMonth={DEMO_MONTH} getDayMeta={getDayMeta} />
    </div>
  ),
}

export const Default: Story = {
  render: () => {
    const [selected, setSelected] = useState<Date | null>(null)
    return (
      <div className="w-[52rem]">
        <MonthGrid
          month={DEMO_MONTH}
          selectedDate={selected}
          onSelectedDateChange={setSelected}
          getDayMeta={getDayMeta}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const cell = canvas
      .getAllByRole('gridcell')
      .find((c) => c.getAttribute('data-date') === '2025-01-02')
    expect(cell).toBeTruthy()
    if (cell) {
      await userEvent.click(cell)
      expect(cell).toHaveAttribute('aria-selected', 'true')
    }
  },
}

export const DisplayOnly: Story = {
  name: 'selectionMode — none',
  render: () => (
    <div className="w-[52rem]">
      <MonthGrid month={DEMO_MONTH} selectionMode="none" getDayMeta={getDayMeta} />
    </div>
  ),
}

/** Demonstrates the `renderCellContent` slot with simple text badges. */
export const WithCellContent: Story = {
  name: 'Slot — cell-content',
  render: () => {
    const ITEMS: Record<string, string[]> = {
      '2025-01-06': ['Alpha', 'Beta'],
      '2025-01-07': ['Gamma'],
      '2025-01-13': ['Delta', 'Epsilon', 'Zeta'],
      '2025-01-21': ['Eta'],
    }

    return (
      <div className="w-[52rem]">
        <MonthGrid
          month={DEMO_MONTH}
          getDayMeta={getDayMeta}
          renderCellContent={(date, dayKind) => {
            const entries = ITEMS[date.toISOString().slice(0, 10)]
            if (!entries?.length) return null
            const tone =
              dayKind === 'warning'
                ? 'border border-warning-border bg-background text-warning-text'
                : 'bg-primary/10 text-primary'
            return (
              <div className="flex flex-col gap-0.5">
                {entries.map((label) => (
                  <div
                    key={label}
                    className={`truncate rounded px-1 py-0.5 text-[0.625rem] font-medium ${tone}`}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )
          }}
        />
      </div>
    )
  },
}

/** Demonstrates the `renderDayAdornments` slot with a small count badge. */
export const WithDayAdornments: Story = {
  name: 'Slot — day-adornments',
  render: () => {
    const COUNTS: Record<string, number> = {
      '2025-01-06': 3,
      '2025-01-13': 7,
      '2025-01-20': 12,
    }

    return (
      <div className="w-[52rem]">
        <MonthGrid
          month={DEMO_MONTH}
          getDayMeta={getDayMeta}
          renderDayAdornments={(date) => {
            const count = COUNTS[date.toISOString().slice(0, 10)]
            if (!count) return null
            return (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-warning-primary text-[0.5rem] font-bold text-white">
                {count}
              </span>
            )
          }}
        />
      </div>
    )
  },
}

/** Demonstrates the `controllerRegion` slot with a simple month navigation bar. */
export const WithControllerSlot: Story = {
  name: 'Slot — controller-region',
  render: () => {
    const [viewMonth, setViewMonth] = useState(DEMO_MONTH)
    const [selected, setSelected] = useState<Date | null>(null)

    const title = viewMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

    return (
      <div className="w-[52rem]">
        <MonthGrid
          month={viewMonth}
          selectedDate={selected}
          onSelectedDateChange={setSelected}
          getDayMeta={getDayMeta}
          controllerRegion={
            <div className="flex items-center justify-between px-3 py-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
                }
                className="rounded p-1 text-fg-muted hover:bg-surface hover:text-fg"
              >
                ‹
              </button>
              <span className="text-sm font-semibold">{title}</span>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
                }
                className="rounded p-1 text-fg-muted hover:bg-surface hover:text-fg"
              >
                ›
              </button>
            </div>
          }
        />
      </div>
    )
  },
}

export const DensityCompact: Story = {
  name: 'Density — compact',
  render: () => (
    <div className="w-[44rem]">
      <MonthGrid month={DEMO_MONTH} density="compact" getDayMeta={getDayMeta} />
    </div>
  ),
}

export const DensityComfortable: Story = {
  name: 'Density — comfortable',
  render: () => (
    <div className="w-[60rem]">
      <MonthGrid month={DEMO_MONTH} density="comfortable" getDayMeta={getDayMeta} />
    </div>
  ),
}

export const WarningDays: Story = {
  name: 'Day kind — warning',
  render: () => {
    const WARNING_DATES = new Set(['2025-01-09', '2025-01-16', '2025-01-23'])
    return (
      <div className="w-[52rem]">
        <MonthGrid
          month={DEMO_MONTH}
          getDayMeta={(date) =>
            WARNING_DATES.has(date.toISOString().slice(0, 10))
              ? { kind: 'warning' }
              : getDayMeta(date)
          }
          renderDayAdornments={(date) =>
            WARNING_DATES.has(date.toISOString().slice(0, 10)) ? (
              <span className="text-[0.625rem] font-medium text-warning-text">공백</span>
            ) : null
          }
        />
      </div>
    )
  },
}

export const SquareFit: Story = {
  name: 'fitCells — square',
  render: () => (
    <div className="h-[32rem] w-full max-w-5xl">
      <MonthGrid
        month={DEMO_MONTH}
        weekStartsOn={1}
        fitCells="square"
        selectionMode="none"
        getDayMeta={getDayMeta}
        className="h-full"
      />
    </div>
  ),
}

export const SquareFitWidthScroll: Story = {
  name: 'fitCells — square (width basis, scroll)',
  render: () => (
    <div className="h-[20rem] w-full max-w-5xl overflow-y-auto rounded-lg border border-border">
      <MonthGrid
        month={DEMO_MONTH}
        weekStartsOn={1}
        fitCells="square"
        squareFitBasis="width"
        selectionMode="none"
        getDayMeta={getDayMeta}
        className="w-full"
      />
    </div>
  ),
}

export const RowSizingContent: Story = {
  name: 'rowSizing — content (명단 달력)',
  render: () => (
    <div className="h-[28rem] w-full max-w-5xl rounded-lg border border-border">
      <MonthGrid
        month={DEMO_MONTH}
        weekStartsOn={0}
        rowSizing="content"
        selectionMode="none"
        getDayMeta={getDayMeta}
        className="h-full"
        renderCellContent={(date) => {
          // 날짜마다 명단 길이를 다르게 — 행이 내용만큼 높아지는지 보기 위함
          const names = ['박주희', '유승한', '석진후', '지인호', '이상인'].slice(
            0,
            1 + (date.getDate() % 5),
          )
          return (
            <div className="flex flex-col gap-1">
              <span className="text-[0.625rem] font-semibold text-fg-muted">
                근무 {names.length}
              </span>
              <div className="flex flex-wrap gap-1">
                {names.map((n) => (
                  <span
                    key={n}
                    className="rounded border border-border px-1.5 py-0.5 text-[0.625rem]"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )
        }}
      />
    </div>
  ),
}
