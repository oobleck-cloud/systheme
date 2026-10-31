/**
 * CommandPalette — Behavior tests
 *
 * A. Visibility — renders when open, hidden when closed (controlled + uncontrolled)
 * B. Query filtering — filters rows by title and subtitle match
 * C. Row selection — clicking a row button marks it as selected (aria-current)
 * D. Execute — run button calls onExecute with the selected row id
 * E. Backdrop close — clicking the backdrop scrim calls onOpenChange(false)
 * F. ARIA — role=dialog, aria-modal
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CommandPalette } from './CommandPalette'

const ROWS = [
  { id: 'create-task', title: '새 작업 만들기', subtitle: '할 일 목록에 추가' },
  { id: 'open-settings', title: '설정 열기' },
  { id: 'search-files', title: '파일 검색', subtitle: '프로젝트 파일 탐색' },
]

function renderPalette(props: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  return render(<CommandPalette commandRows={ROWS} {...props} />)
}

// ─── A. Visibility ────────────────────────────────────────────────────────────

describe('A. Visibility', () => {
  it('renders dialog when open=true', () => {
    renderPalette({ open: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render dialog when open=false', () => {
    renderPalette({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uncontrolled: defaultOpen=true renders dialog on mount', () => {
    renderPalette({ defaultOpen: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uncontrolled: defaultOpen=false (default) does not render dialog', () => {
    renderPalette()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ─── B. Query filtering ───────────────────────────────────────────────────────

describe('B. Query filtering', () => {
  it('shows all rows when query is empty', () => {
    renderPalette({ open: true })

    const titles = screen.getAllByRole('button', { name: /만들기|설정|파일/ })
    expect(titles.length).toBeGreaterThanOrEqual(ROWS.length)
  })

  it('filters rows by title match (controlled query)', () => {
    renderPalette({ open: true, query: '설정' })

    expect(screen.getByText('설정 열기')).toBeInTheDocument()
    expect(screen.queryByText('새 작업 만들기')).not.toBeInTheDocument()
    expect(screen.queryByText('파일 검색')).not.toBeInTheDocument()
  })

  it('filters rows by subtitle match (controlled query)', () => {
    renderPalette({ open: true, query: '프로젝트' })

    expect(screen.getByText('파일 검색')).toBeInTheDocument()
    expect(screen.queryByText('새 작업 만들기')).not.toBeInTheDocument()
  })

  it('shows no rows when query matches nothing', () => {
    renderPalette({ open: true, query: 'zzz존재하지않음zzz' })

    expect(screen.queryByText('새 작업 만들기')).not.toBeInTheDocument()
    expect(screen.queryByText('설정 열기')).not.toBeInTheDocument()
    expect(screen.queryByText('파일 검색')).not.toBeInTheDocument()
  })

  it('calls onQueryChange when the search input value changes', () => {
    const onQueryChange = vi.fn()
    renderPalette({ open: true, onQueryChange })

    const input = screen.getByRole('textbox', { name: '명령어 검색' })
    fireEvent.change(input, { target: { value: '설정' } })

    expect(onQueryChange).toHaveBeenCalledWith('설정')
  })
})

// ─── C. Row selection ─────────────────────────────────────────────────────────

describe('C. Row selection', () => {
  it('first row is auto-selected by default (aria-current=true)', () => {
    renderPalette({ open: true })

    const rowButtons = screen.getAllByRole('button', { name: /만들기|설정|파일/ })
    // First row's button should have aria-current="true"
    expect(rowButtons[0]).toHaveAttribute('aria-current', 'true')
  })

  it('clicking a row button marks it as selected (aria-current=true)', () => {
    renderPalette({ open: true })

    const rowButtons = screen.getAllByRole('button', { name: /만들기|설정|파일/ })
    fireEvent.click(rowButtons[1]) // 설정 열기

    expect(rowButtons[1]).toHaveAttribute('aria-current', 'true')
    expect(rowButtons[0]).toHaveAttribute('aria-current', 'false')
  })

  it('clicking a different row updates the selection', () => {
    renderPalette({ open: true })

    const rowButtons = screen.getAllByRole('button', { name: /만들기|설정|파일/ })
    fireEvent.click(rowButtons[2]) // 파일 검색

    expect(rowButtons[2]).toHaveAttribute('aria-current', 'true')
    expect(rowButtons[0]).toHaveAttribute('aria-current', 'false')
  })
})

// ─── D. Execute ───────────────────────────────────────────────────────────────

describe('D. Execute', () => {
  it('clicking the run button calls onExecute with the selected row id', () => {
    const onExecute = vi.fn()
    renderPalette({ open: true, onExecute })

    // First row is auto-selected — find and click its run button
    const runButtons = screen.getAllByRole('button', { name: '실행' })
    fireEvent.click(runButtons[0])

    expect(onExecute).toHaveBeenCalledWith('create-task')
  })

  it('run buttons for non-selected rows are disabled', () => {
    const onExecute = vi.fn()
    renderPalette({ open: true, onExecute })

    const runButtons = screen.getAllByRole('button', { name: '실행' })
    // Only the first (selected) run button should be enabled
    expect(runButtons[0]).not.toBeDisabled()
    expect(runButtons[1]).toBeDisabled()
    expect(runButtons[2]).toBeDisabled()
  })

  it('run button is disabled when onExecute is not provided', () => {
    renderPalette({ open: true })

    const runButtons = screen.getAllByRole('button', { name: '실행' })
    runButtons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('clicking a row then the run button executes that row', () => {
    const onExecute = vi.fn()
    renderPalette({ open: true, onExecute })

    const rowButtons = screen.getAllByRole('button', { name: /만들기|설정|파일/ })
    fireEvent.click(rowButtons[1]) // 설정 열기 선택

    const runButtons = screen.getAllByRole('button', { name: '실행' })
    fireEvent.click(runButtons[1]) // 설정 열기의 실행 버튼

    expect(onExecute).toHaveBeenCalledWith('open-settings')
  })
})

// ─── E. Backdrop close ────────────────────────────────────────────────────────

describe('E. Backdrop close', () => {
  it('clicking the backdrop calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderPalette({ open: true, onOpenChange })

    const backdrop = document.querySelector('[data-slot="command-palette-backdrop"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── F. ARIA ──────────────────────────────────────────────────────────────────

describe('G. ARIA', () => {
  it('has role="dialog" when open', () => {
    renderPalette({ open: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dialog has aria-modal="true"', () => {
    renderPalette({ open: true })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('search input has aria-label', () => {
    renderPalette({ open: true })
    expect(screen.getByRole('textbox', { name: '명령어 검색' })).toBeInTheDocument()
  })
})
