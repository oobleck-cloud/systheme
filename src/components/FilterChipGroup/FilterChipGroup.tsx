'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type FilterChipOption = {
  id: string
  label: string
}

export type FilterChipGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  options: FilterChipOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (selectedIds: string[]) => void
  'aria-label'?: string
}

const FilterChipGroup = forwardRef<HTMLDivElement, FilterChipGroupProps>(
  (
    {
      className,
      options,
      value: valueProp,
      defaultValue = [],
      onChange,
      'aria-label': ariaLabel = '필터',
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<string[]>(defaultValue)
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp! : internalValue

    const handleToggle = useCallback(
      (id: string) => {
        const next = new Set(value)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        const nextArr = [...next]
        if (!isControlled) setInternalValue(nextArr)
        onChange?.(nextArr)
      },
      [isControlled, onChange, value],
    )

    // Roving tabindex: the focused chip is the single tab stop. Defaults to the first
    // selected chip (or the first chip), then follows arrow-key / focus movement.
    const defaultFocusIdx = Math.max(
      0,
      options.findIndex((opt) => value.includes(opt.id)),
    )
    const [focusedIdx, setFocusedIdx] = useState(defaultFocusIdx)
    const tabStopIdx = Math.min(focusedIdx, Math.max(0, options.length - 1))

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      const key = e.key
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return

      const chips = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>(
          '[data-slot="filter-chip-group-chip"]:not(:disabled)',
        ),
      )
      const current = document.activeElement as HTMLElement
      const idx = chips.indexOf(current)
      if (idx < 0) return

      e.preventDefault()
      let next = idx
      if (key === 'ArrowRight') next = Math.min(idx + 1, chips.length - 1)
      else if (key === 'ArrowLeft') next = Math.max(idx - 1, 0)
      else if (key === 'Home') next = 0
      else if (key === 'End') next = chips.length - 1
      const target = chips[next]
      if (!target) return
      // Map the focused chip back to its options index so the tab stop tracks focus.
      const allChips = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[data-slot="filter-chip-group-chip"]'),
      )
      setFocusedIdx(allChips.indexOf(target))
      target.focus()
    }

    return (
      <div
        ref={ref}
        data-slot="filter-chip-group-root"
        role="toolbar"
        aria-label={ariaLabel}
        className={cn('w-full', className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <Stack direction="horizontal" align="center" gap={2} wrap>
          {options.map((chip, index) => {
            const selected = value.includes(chip.id)
            const tabIndex = index === tabStopIdx ? 0 : -1
            return (
              <button
                key={chip.id}
                type="button"
                data-slot="filter-chip-group-chip"
                aria-pressed={selected}
                tabIndex={tabIndex}
                disabled={!onChange && isControlled}
                onFocus={() => setFocusedIdx(index)}
                className={cn(
                  'inline-flex max-w-full cursor-pointer items-center rounded-full px-3 py-1 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  selected
                    ? 'bg-primary text-primary-fg'
                    : 'text-fg-muted hover:bg-muted hover:text-fg',
                )}
                onClick={() => handleToggle(chip.id)}
              >
                <span data-slot="filter-chip-group-label">{chip.label}</span>
              </button>
            )
          })}
        </Stack>
      </div>
    )
  },
)

FilterChipGroup.displayName = 'FilterChipGroup'

export { FilterChipGroup }
