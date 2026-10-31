/**
 * MonthGrid — Interaction Grammar PR5
 *
 * Tests for 2D keyboard navigation via useInteractionContext({ kind: 'grid' })
 *
 * Calendar notes for June 2025 (weekStartsOn=0):
 *   June 1 is Sunday → leadPad=0, flat[0]=Jun1, ..., flat[29]=Jun30, flat[30..34]=null (35 cells)
 *
 * Calendar notes for May 2025 (weekStartsOn=0):
 *   May 1 is Thursday (day=4) → leadPad=4, flat[0..3]=null, flat[4]=May1, ..., flat[34]=May31 (35 cells)
 *
 * Calendar notes for January 2020 (weekStartsOn=0):
 *   Jan 1 is Wednesday (day=3) → leadPad=3, flat[0..2]=null, flat[3]=Jan1, ..., flat[33]=Jan31 (35 cells)
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MonthGrid } from './MonthGrid'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the data-date string as the MonthGrid component computes it:
 * `new Date(year, month, day).toISOString().slice(0, 10)`
 *
 * In UTC+ timezones the ISO representation may shift the date back by one day
 * compared to local time. We replicate the same conversion so our selectors match.
 */
function toDataDateStr(year: number, month: number, day: number): string {
  return new Date(year, month, day).toISOString().slice(0, 10)
}

function getCellByDate(year: number, month: number, day: number): HTMLElement {
  const dateStr = toDataDateStr(year, month, day)
  const el = document.querySelector<HTMLElement>(`[data-date="${dateStr}"]`)
  if (!el)
    throw new Error(
      `Cell not found for ${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')} (data-date="${dateStr}")`,
    )
  return el
}

// ─── A. 2D Keyboard Navigation ────────────────────────────────────────────────

describe('A. 2D keyboard navigation', () => {
  // June 2025: flat[0]=Jun1(Sun), flat[1]=Jun2(Mon), ..., flat[6]=Jun7(Sat)
  //            flat[7]=Jun8, ..., flat[28]=Jun29, flat[29]=Jun30
  //            flat[30..34]=null

  it('ArrowRight moves focus Jun 1 → Jun 2 (flat[0] → flat[1])', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 1)} />)
    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' })

    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 2).tabIndex).toBe(0)
  })

  it('ArrowLeft moves focus Jun 2 → Jun 1 (flat[1] → flat[0])', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 2)} />)
    expect(getCellByDate(2025, 5, 2).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowLeft' })

    expect(getCellByDate(2025, 5, 2).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(0)
  })

  it('ArrowDown moves focus Jun 1 → Jun 8 (flat[0]+7 = flat[7])', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 1)} />)
    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowDown' })

    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 8).tabIndex).toBe(0)
  })

  it('ArrowUp moves focus Jun 8 → Jun 1 (flat[7]-7 = flat[0])', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 8)} />)
    expect(getCellByDate(2025, 5, 8).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowUp' })

    expect(getCellByDate(2025, 5, 8).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(0)
  })

  it('ArrowDown at Jun 29 (flat[28]) stays — target flat[35] is out of bounds', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 29)} />)
    expect(getCellByDate(2025, 5, 29).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowDown' })

    // flat[28]+7=flat[35] is out of bounds (only 35 cells: flat[0..34])
    expect(getCellByDate(2025, 5, 29).tabIndex).toBe(0)
  })

  it('ArrowRight at Jun 30 (flat[29]) → next cells are null → stays', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 30)} />)
    expect(getCellByDate(2025, 5, 30).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' })

    // flat[30..34] are all null, findNonNull returns null → stays at flat[29]
    expect(getCellByDate(2025, 5, 30).tabIndex).toBe(0)
  })
})

// ─── B. Home/End Navigation ───────────────────────────────────────────────────

describe('B. Home/End navigation', () => {
  it('Home from Jun 15 → Jun 1 (first non-null = flat[0])', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 15)} />)
    expect(getCellByDate(2025, 5, 15).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Home' })

    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(0)
    expect(getCellByDate(2025, 5, 15).tabIndex).toBe(-1)
  })

  it('End from Jun 15 → Jun 30 (last non-null = flat[29])', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 15)} />)
    expect(getCellByDate(2025, 5, 15).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'End' })

    expect(getCellByDate(2025, 5, 30).tabIndex).toBe(0)
    expect(getCellByDate(2025, 5, 15).tabIndex).toBe(-1)
  })
})

// ─── C. Activation ────────────────────────────────────────────────────────────

describe('C. Activation', () => {
  it('Enter on focused cell calls onDayActivate with the correct date', () => {
    const onDayActivate = vi.fn()
    render(
      <MonthGrid
        month={new Date(2025, 5, 1)}
        selectedDate={new Date(2025, 5, 10)}
        onDayActivate={onDayActivate}
      />,
    )

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'Enter' })

    expect(onDayActivate).toHaveBeenCalledTimes(1)
    const calledWith: Date = onDayActivate.mock.calls[0][0]
    expect(calledWith.getFullYear()).toBe(2025)
    expect(calledWith.getMonth()).toBe(5) // June = month 5
    expect(calledWith.getDate()).toBe(10)
  })

  it('Space on focused cell calls onDayActivate', () => {
    const onDayActivate = vi.fn()
    render(
      <MonthGrid
        month={new Date(2025, 5, 1)}
        selectedDate={new Date(2025, 5, 10)}
        onDayActivate={onDayActivate}
      />,
    )

    fireEvent.keyDown(screen.getByRole('grid'), { key: ' ' })

    expect(onDayActivate).toHaveBeenCalledTimes(1)
    const calledWith: Date = onDayActivate.mock.calls[0][0]
    expect(calledWith.getDate()).toBe(10)
  })
})

// ─── D. Roving Tabindex ───────────────────────────────────────────────────────

describe('D. Roving tabindex', () => {
  it('only the focused cell (selectedDate=Jun 5) has tabIndex=0, all others -1', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 5)} />)

    // Jun 5 should be tabIndex=0
    expect(getCellByDate(2025, 5, 5).tabIndex).toBe(0)

    // Others should be -1
    expect(getCellByDate(2025, 5, 1).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 10).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 30).tabIndex).toBe(-1)
  })

  it('after ArrowRight, the new cell gets tabIndex=0 and old cell gets tabIndex=-1', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 5)} />)
    expect(getCellByDate(2025, 5, 5).tabIndex).toBe(0)

    fireEvent.keyDown(screen.getByRole('grid'), { key: 'ArrowRight' })

    expect(getCellByDate(2025, 5, 5).tabIndex).toBe(-1)
    expect(getCellByDate(2025, 5, 6).tabIndex).toBe(0)
  })
})

// ─── E. Null Cells ────────────────────────────────────────────────────────────

describe('E. Null cells', () => {
  // May 2025: leadPad=4 → flat[0..3]=null, flat[4]=May1
  it('null padding cells always have tabIndex=-1 (May 2025 has leading nulls)', () => {
    render(<MonthGrid month={new Date(2025, 4, 1)} selectedDate={new Date(2025, 4, 1)} />)

    // The null padding cells should have aria-hidden and tabIndex=-1
    const nullCells = document.querySelectorAll<HTMLElement>(
      '[role="gridcell"][aria-hidden="true"]',
    )
    expect(nullCells.length).toBeGreaterThan(0)
    nullCells.forEach((cell) => {
      expect(cell.tabIndex).toBe(-1)
    })
  })

  it('null cells have aria-hidden="true"', () => {
    render(<MonthGrid month={new Date(2025, 4, 1)} selectedDate={new Date(2025, 4, 1)} />)

    const nullCells = document.querySelectorAll('[role="gridcell"][aria-hidden="true"]')
    expect(nullCells.length).toBeGreaterThan(0)
  })
})

// ─── F. ARIA ──────────────────────────────────────────────────────────────────

describe('F. ARIA', () => {
  it('grid container has role="grid"', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} />)
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('day cells have role="gridcell"', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} />)
    const gridcells = document.querySelectorAll('[role="gridcell"]')
    expect(gridcells.length).toBeGreaterThan(0)
  })

  it('selected cell has aria-selected="true"', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 15)} />)
    const cell = getCellByDate(2025, 5, 15)
    expect(cell.getAttribute('aria-selected')).toBe('true')
  })

  it('non-selected cells have aria-selected="false"', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 15)} />)
    const cell = getCellByDate(2025, 5, 1)
    expect(cell.getAttribute('aria-selected')).toBe('false')
  })
})

// ─── G. Focus Initialization ──────────────────────────────────────────────────

describe('G. Focus initialization', () => {
  it('selectedDate=Jun 20 → Jun 20 starts focused (tabIndex=0)', () => {
    render(<MonthGrid month={new Date(2025, 5, 1)} selectedDate={new Date(2025, 5, 20)} />)
    expect(getCellByDate(2025, 5, 20).tabIndex).toBe(0)
  })

  it('no selectedDate, month is Jan 2020 (today not visible) → Jan 1 starts focused (flat[3] since leadPad=3)', () => {
    // Jan 2020: Jan 1 is Wednesday (day=3) → leadPad=3, flat[3]=Jan 1
    render(<MonthGrid month={new Date(2020, 0, 1)} />)
    // flat[0..2] = null, flat[3] = Jan 1 → first non-null is Jan 1
    expect(getCellByDate(2020, 0, 1).tabIndex).toBe(0)
  })
})
