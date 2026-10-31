/**
 * Select — Interaction Grammar PR4
 *
 * Test cases:
 * A. Keyboard navigation — open: ArrowDown/Up/Home/End navigate focusedIndex → CSS highlight class changes
 * B. Keyboard activation: Enter selects focused option, calls onChange
 * C. Keyboard close: Escape on trigger closes dropdown
 * D. Trigger open: ArrowDown on trigger when closed → opens dropdown
 * E. Roving tabindex: When open, only focused item has tabIndex=0, others have -1
 * F. Role attributes: <ul> has role="listbox", items have role="option", aria-selected
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Select } from './Select'

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
]

function renderSelect(props: Partial<React.ComponentProps<typeof Select>> = {}) {
  return render(
    <Select options={OPTIONS} placeholder="선택..." data-testid="select-root" {...props} />,
  )
}

function openSelect() {
  const trigger = screen.getByRole('combobox')
  fireEvent.click(trigger)
}

// ---------------------------------------------------------------------------
// A. Keyboard navigation — open
// ---------------------------------------------------------------------------

describe('A. Keyboard navigation — open', () => {
  it('ArrowDown moves highlight to next item', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')

    // Initially index 0 is focused (Apple)
    const items = listbox.querySelectorAll('[role="option"]')
    expect(items[0].classList.contains('bg-surface')).toBe(true)
    expect(items[1].classList.contains('bg-surface')).toBe(false)

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    expect(items[0].classList.contains('bg-surface')).toBe(false)
    expect(items[1].classList.contains('bg-surface')).toBe(true)
  })

  it('ArrowUp moves highlight to previous item', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    // Move to index 1 first
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    expect(items[1].classList.contains('bg-surface')).toBe(true)

    // Then move back
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })
    expect(items[0].classList.contains('bg-surface')).toBe(true)
    expect(items[1].classList.contains('bg-surface')).toBe(false)
  })

  it('ArrowDown does not go past the last item', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    // Move past the end
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    // Should be at last item (Cherry, index 2)
    expect(items[2].classList.contains('bg-surface')).toBe(true)
  })

  it('ArrowUp does not go before the first item', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    // Already at index 0, press ArrowUp
    fireEvent.keyDown(listbox, { key: 'ArrowUp' })

    expect(items[0].classList.contains('bg-surface')).toBe(true)
  })

  it('Home moves focus to first item', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    // Move to last first
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    fireEvent.keyDown(listbox, { key: 'Home' })
    expect(items[0].classList.contains('bg-surface')).toBe(true)
    expect(items[2].classList.contains('bg-surface')).toBe(false)
  })

  it('End moves focus to last item', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    fireEvent.keyDown(listbox, { key: 'End' })
    expect(items[2].classList.contains('bg-surface')).toBe(true)
    expect(items[0].classList.contains('bg-surface')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// B. Keyboard activation: Enter selects focused option
// ---------------------------------------------------------------------------

describe('B. Keyboard activation', () => {
  it('Enter on open dropdown selects the focused option and calls onChange', () => {
    const onChange = vi.fn()
    renderSelect({ onChange })
    openSelect()

    const listbox = screen.getByRole('listbox')

    // Focus is on index 0 (Apple)
    fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('Enter after ArrowDown selects the newly focused option', () => {
    const onChange = vi.fn()
    renderSelect({ onChange })
    openSelect()

    const listbox = screen.getByRole('listbox')
    fireEvent.keyDown(listbox, { key: 'ArrowDown' })
    fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('Space on open dropdown selects the focused option', () => {
    const onChange = vi.fn()
    renderSelect({ onChange })
    openSelect()

    const listbox = screen.getByRole('listbox')
    fireEvent.keyDown(listbox, { key: ' ' })

    expect(onChange).toHaveBeenCalledWith('a')
  })

  it('Enter on disabled option does not call onChange', () => {
    const onChange = vi.fn()
    const disabledOptions = [
      { value: 'a', label: 'Apple', disabled: true },
      { value: 'b', label: 'Banana' },
    ]
    renderSelect({ options: disabledOptions, onChange })
    openSelect()

    const listbox = screen.getByRole('listbox')
    // Focused on index 0 (Apple, disabled)
    fireEvent.keyDown(listbox, { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// C. Keyboard close: Escape
// ---------------------------------------------------------------------------

describe('C. Keyboard close', () => {
  it('Escape on open listbox closes the dropdown (aria-expanded becomes false)', () => {
    renderSelect()
    openSelect()

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true')

    const listbox = screen.getByRole('listbox')
    fireEvent.keyDown(listbox, { key: 'Escape' })

    // AnimatePresence keeps the element in DOM during exit animation.
    // Verify the state change via aria-expanded on the trigger.
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false')
  })
})

// ---------------------------------------------------------------------------
// D. Trigger open: ArrowDown on trigger when closed
// ---------------------------------------------------------------------------

describe('D. Trigger open', () => {
  it('ArrowDown on closed trigger opens the dropdown', () => {
    renderSelect()

    const trigger = screen.getByRole('combobox')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Enter on closed trigger opens the dropdown', () => {
    renderSelect()

    const trigger = screen.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: 'Enter' })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Space on closed trigger opens the dropdown', () => {
    renderSelect()

    const trigger = screen.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: ' ' })

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('Escape on open trigger closes the dropdown (aria-expanded becomes false)', () => {
    renderSelect()
    openSelect()

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(trigger, { key: 'Escape' })

    // AnimatePresence keeps the element in DOM during exit animation.
    // Verify the state change via aria-expanded on the trigger.
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

// ---------------------------------------------------------------------------
// E. Roving tabindex
// ---------------------------------------------------------------------------

describe('E. Roving tabindex', () => {
  it('when open, only focused item (index 0) has tabIndex=0, others have -1', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })

  it('after ArrowDown, focused item (index 1) has tabIndex=0', () => {
    renderSelect()
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    fireEvent.keyDown(listbox, { key: 'ArrowDown' })

    expect(items[0]).toHaveAttribute('tabindex', '-1')
    expect(items[1]).toHaveAttribute('tabindex', '0')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })

  it('disabled items always have tabIndex=-1', () => {
    const disabledOptions = [
      { value: 'a', label: 'Apple', disabled: true },
      { value: 'b', label: 'Banana' },
    ]
    renderSelect({ options: disabledOptions })
    openSelect()

    const listbox = screen.getByRole('listbox')
    const items = listbox.querySelectorAll('[role="option"]')

    // Index 0 is disabled — should have tabIndex=-1 regardless of being focused
    expect(items[0]).toHaveAttribute('tabindex', '-1')
  })
})

// ---------------------------------------------------------------------------
// F. Role attributes
// ---------------------------------------------------------------------------

describe('F. Role attributes', () => {
  it('listbox container has role="listbox"', () => {
    renderSelect()
    openSelect()

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('items have role="option"', () => {
    renderSelect()
    openSelect()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(OPTIONS.length)
  })

  it('selected option has aria-selected="true"', () => {
    renderSelect({ value: 'b' })
    openSelect()

    const options = screen.getAllByRole('option')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[2]).toHaveAttribute('aria-selected', 'false')
  })

  it('trigger has role="combobox" and aria-haspopup="listbox"', () => {
    renderSelect()

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('trigger aria-expanded reflects open state', () => {
    renderSelect()

    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    openSelect()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('Select 접근 가능한 이름', () => {
  it('aria-label 은 바깥 래퍼가 아니라 트리거에 붙는다', () => {
    render(<Select aria-label="대행 맡기기" options={[{ value: 'a', label: 'A' }]} />)

    expect(screen.getByRole('combobox', { name: '대행 맡기기' })).toBeInTheDocument()
  })
})
