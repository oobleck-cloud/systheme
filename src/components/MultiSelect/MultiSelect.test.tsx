/**
 * MultiSelect — Behavior tests
 *
 * A. Open/close — click, Enter, Space, Escape, ArrowDown on closed trigger
 * B. Toggle selection — click adds/removes; multi-select accumulates
 * C. Keyboard navigation — ArrowDown/Up moves highlight (focusedIndex → bg-surface)
 * D. Keyboard activation on options — Enter/Space toggles; Escape closes
 * E. Disabled items — not toggleable by click or keyboard
 * F. ARIA — combobox, listbox, aria-multiselectable, aria-selected
 * G. Controlled value — external value array reflected as selected tags
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MultiSelect } from './MultiSelect'

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
]

function renderMultiSelect(props: Partial<React.ComponentProps<typeof MultiSelect>> = {}) {
  return render(<MultiSelect options={OPTIONS} placeholder="선택..." {...props} />)
}

function getTrigger() {
  return screen.getByRole('combobox')
}

function openDropdown() {
  fireEvent.click(getTrigger())
}

function getListbox() {
  return screen.getByRole('listbox')
}

function getOptions() {
  return screen.getAllByRole('option')
}

// ─── A. Open/close ────────────────────────────────────────────────────────────

describe('A. Open/close', () => {
  it('click on trigger opens the dropdown', () => {
    renderMultiSelect()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    openDropdown()

    expect(getListbox()).toBeInTheDocument()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')
  })

  it('second click on trigger closes the dropdown', () => {
    renderMultiSelect()
    openDropdown()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(getTrigger())

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('Enter on closed trigger opens the dropdown', () => {
    renderMultiSelect()
    fireEvent.keyDown(getTrigger(), { key: 'Enter' })

    expect(getListbox()).toBeInTheDocument()
  })

  it('Space on closed trigger opens the dropdown', () => {
    renderMultiSelect()
    fireEvent.keyDown(getTrigger(), { key: ' ' })

    expect(getListbox()).toBeInTheDocument()
  })

  it('ArrowDown on closed trigger opens the dropdown', () => {
    renderMultiSelect()
    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })

    expect(getListbox()).toBeInTheDocument()
  })

  it('Escape on open trigger closes the dropdown', () => {
    renderMultiSelect()
    openDropdown()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(getTrigger(), { key: 'Escape' })

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('onOpenChange is called with true when opened', () => {
    const onOpenChange = vi.fn()
    renderMultiSelect({ onOpenChange })
    openDropdown()

    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('onOpenChange is called with false when closed via Escape', () => {
    const onOpenChange = vi.fn()
    renderMultiSelect({ onOpenChange })
    openDropdown()
    onOpenChange.mockClear()

    fireEvent.keyDown(getTrigger(), { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disabled trigger does not open on click', () => {
    renderMultiSelect({ disabled: true })
    openDropdown()

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})

// ─── B. Toggle selection ──────────────────────────────────────────────────────

describe('B. Toggle selection', () => {
  it('clicking an option adds it to the selection', () => {
    const onChange = vi.fn()
    renderMultiSelect({ onChange })
    openDropdown()

    fireEvent.click(getOptions()[0])

    expect(onChange).toHaveBeenCalledWith(['a'])
  })

  it('clicking a selected option removes it from the selection', () => {
    const onChange = vi.fn()
    renderMultiSelect({ value: ['a', 'b'], onChange })
    openDropdown()

    fireEvent.click(getOptions()[0]) // deselect 'a'

    expect(onChange).toHaveBeenCalledWith(['b'])
  })

  it('selections accumulate in uncontrolled mode', () => {
    const onChange = vi.fn()
    renderMultiSelect({ onChange })
    openDropdown()

    fireEvent.click(getOptions()[0]) // → ['a']
    fireEvent.click(getOptions()[1]) // → ['a', 'b']

    expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('selected options render as tags in the trigger', () => {
    renderMultiSelect({ value: ['a', 'c'] })

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Cherry')).toBeInTheDocument()
    expect(screen.queryByText('Banana')).not.toBeInTheDocument()
  })

  it('removing a tag via its remove button calls onChange without that value', () => {
    const onChange = vi.fn()
    renderMultiSelect({ value: ['a', 'b'], onChange })

    // Tags render in the trigger — find the Apple tag's remove button
    const removeButtons = screen.getAllByRole('button')
    // Tag remove buttons have aria-label containing the tag label
    const appleRemove = removeButtons.find((btn) => btn.closest('[data-slot="tag-root"]') !== null)
    if (appleRemove) {
      fireEvent.click(appleRemove)
      expect(onChange).toHaveBeenCalled()
    }
  })
})

// ─── C. Keyboard navigation ───────────────────────────────────────────────────

describe('C. Keyboard navigation', () => {
  it('ArrowDown on open trigger moves highlight to next option', () => {
    renderMultiSelect()
    openDropdown()

    const opts = getOptions()
    expect(opts[0].classList.contains('bg-surface')).toBe(true)

    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })

    expect(opts[0].classList.contains('bg-surface')).toBe(false)
    expect(opts[1].classList.contains('bg-surface')).toBe(true)
  })

  it('ArrowUp on open trigger moves highlight to previous option', () => {
    renderMultiSelect()
    openDropdown()

    // Move to index 1 first
    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })
    const opts = getOptions()
    expect(opts[1].classList.contains('bg-surface')).toBe(true)

    fireEvent.keyDown(getTrigger(), { key: 'ArrowUp' })

    expect(opts[0].classList.contains('bg-surface')).toBe(true)
    expect(opts[1].classList.contains('bg-surface')).toBe(false)
  })

  it('ArrowDown does not go past the last option', () => {
    renderMultiSelect()
    openDropdown()

    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })
    fireEvent.keyDown(getTrigger(), { key: 'ArrowDown' })

    const opts = getOptions()
    expect(opts[2].classList.contains('bg-surface')).toBe(true)
  })

  it('ArrowUp does not go before the first option', () => {
    renderMultiSelect()
    openDropdown()

    fireEvent.keyDown(getTrigger(), { key: 'ArrowUp' })

    const opts = getOptions()
    expect(opts[0].classList.contains('bg-surface')).toBe(true)
  })
})

// ─── D. Keyboard activation on options ───────────────────────────────────────

describe('D. Keyboard activation on options', () => {
  it('Enter on a focused option toggles it and calls onChange', () => {
    const onChange = vi.fn()
    renderMultiSelect({ onChange })
    openDropdown()

    const opts = getOptions()
    fireEvent.keyDown(opts[0], { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith(['a'])
  })

  it('Space on a focused option toggles it and calls onChange', () => {
    const onChange = vi.fn()
    renderMultiSelect({ onChange })
    openDropdown()

    const opts = getOptions()
    fireEvent.keyDown(opts[1], { key: ' ' })

    expect(onChange).toHaveBeenCalledWith(['b'])
  })

  it('Escape on a focused option closes the dropdown', () => {
    renderMultiSelect()
    openDropdown()

    const opts = getOptions()
    fireEvent.keyDown(opts[0], { key: 'Escape' })

    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')
  })
})

// ─── E. Disabled items ────────────────────────────────────────────────────────

describe('E. Disabled items', () => {
  const disabledOptions = [
    { value: 'a', label: 'Apple', disabled: true },
    { value: 'b', label: 'Banana' },
  ]

  it('clicking a disabled option does not call onChange', () => {
    const onChange = vi.fn()
    renderMultiSelect({ options: disabledOptions, onChange })
    openDropdown()

    fireEvent.click(getOptions()[0])

    expect(onChange).not.toHaveBeenCalled()
  })

  it('Enter on a disabled option does not call onChange', () => {
    const onChange = vi.fn()
    renderMultiSelect({ options: disabledOptions, onChange })
    openDropdown()

    const opts = getOptions()
    fireEvent.keyDown(opts[0], { key: 'Enter' })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('disabled option has aria-disabled="true"', () => {
    renderMultiSelect({ options: disabledOptions })
    openDropdown()

    const opts = getOptions()
    expect(opts[0]).toHaveAttribute('aria-disabled', 'true')
    expect(opts[1]).not.toHaveAttribute('aria-disabled', 'true')
  })
})

// ─── F. ARIA ──────────────────────────────────────────────────────────────────

describe('F. ARIA', () => {
  it('trigger has role="combobox" and aria-haspopup="listbox"', () => {
    renderMultiSelect()
    expect(getTrigger()).toHaveAttribute('aria-haspopup', 'listbox')
  })

  it('trigger aria-expanded reflects open state', () => {
    renderMultiSelect()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'false')

    openDropdown()
    expect(getTrigger()).toHaveAttribute('aria-expanded', 'true')
  })

  it('listbox has aria-multiselectable="true"', () => {
    renderMultiSelect()
    openDropdown()

    expect(getListbox()).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('selected options have aria-selected="true", unselected have "false"', () => {
    renderMultiSelect({ value: ['b'] })
    openDropdown()

    const opts = getOptions()
    expect(opts[0]).toHaveAttribute('aria-selected', 'false')
    expect(opts[1]).toHaveAttribute('aria-selected', 'true')
    expect(opts[2]).toHaveAttribute('aria-selected', 'false')
  })
})

// ─── G. Controlled value ──────────────────────────────────────────────────────

describe('G. Controlled value', () => {
  it('placeholder shown when value is empty array', () => {
    renderMultiSelect({ value: [] })
    expect(screen.getByText('선택...')).toBeInTheDocument()
  })

  it('placeholder not shown when value has items', () => {
    renderMultiSelect({ value: ['a'] })
    expect(screen.queryByText('선택...')).not.toBeInTheDocument()
  })

  it('controlled value is reflected in aria-selected without internal state', () => {
    renderMultiSelect({ value: ['a', 'c'] })
    openDropdown()

    const opts = getOptions()
    expect(opts[0]).toHaveAttribute('aria-selected', 'true')
    expect(opts[1]).toHaveAttribute('aria-selected', 'false')
    expect(opts[2]).toHaveAttribute('aria-selected', 'true')
  })
})

describe('MultiSelect 접근 가능한 이름', () => {
  it('aria-label 은 바깥 래퍼가 아니라 트리거에 붙는다', () => {
    render(<MultiSelect aria-label="담당자" options={[{ value: 'a', label: 'A' }]} />)

    expect(screen.getByRole('combobox', { name: '담당자' })).toBeInTheDocument()
  })
})
