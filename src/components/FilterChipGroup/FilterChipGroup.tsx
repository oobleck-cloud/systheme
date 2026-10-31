'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type FilterChipOption = {
  id: string
  label: string
  /**
   * 라벨 앞 흐린 앞말(예: 구역 칩의 시 「서울」 + 라벨 「강동구」). 표의 구역 칩(`Tag` qualifier)과
   * 같은 문법 — 앞말은 보통 굵기·흐린 색, 라벨이 주인공.
   */
  qualifier?: string
  /** 라벨 옆 주의 표시(예: 「빈 날 3」). 고른 칩에서도 같은 색이다. */
  note?: string
}

export type FilterChipGroupProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'defaultValue'
> & {
  options: FilterChipOption[]
  value?: string[]
  defaultValue?: string[]
  onChange?: (selectedIds: string[]) => void
  /**
   * `multiple`(기본) — 칩마다 켜고 끈다.
   * `single` — 하나만 고른다(고른 칩을 다시 눌러도 그대로). 항목이 많아 SegmentedControl 에
   *   안 들어가는 단일 선택(구 고르기 등)에 쓴다.
   */
  selectionMode?: 'multiple' | 'single'
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
      selectionMode = 'multiple',
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
        if (selectionMode === 'single') {
          if (!isControlled) setInternalValue([id])
          onChange?.([id])
          return
        }
        const next = new Set(value)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        const nextArr = [...next]
        if (!isControlled) setInternalValue(nextArr)
        onChange?.(nextArr)
      },
      [isControlled, onChange, selectionMode, value],
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
                  'inline-flex max-w-full cursor-pointer items-center rounded-full border px-3 py-1 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  // 고른 칩은 secondary 채움 — primary 는 같은 화면의 주 버튼에 양보한다.
                  // 안 고른 칩은 외곽선이라 글자가 아니라 누를 거리로 읽힌다.
                  selected
                    ? 'border-transparent bg-secondary font-semibold text-secondary-fg'
                    : 'border-border text-fg hover:bg-muted',
                )}
                onClick={() => handleToggle(chip.id)}
              >
                {chip.qualifier ? (
                  <span
                    data-slot="filter-chip-group-qualifier"
                    className="mr-1 font-normal text-fg-muted"
                  >
                    {chip.qualifier}
                  </span>
                ) : null}
                <span data-slot="filter-chip-group-label">{chip.label}</span>
                {chip.note ? (
                  <span
                    data-slot="filter-chip-group-note"
                    className="ml-1 text-xs font-medium text-warning-text"
                  >
                    {chip.note}
                  </span>
                ) : null}
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
