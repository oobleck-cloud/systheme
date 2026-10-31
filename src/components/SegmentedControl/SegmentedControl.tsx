'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useState } from 'react'

import { cn } from '@/utils/cn'

// 회색 판(track) — `bg-muted`(시안 color/muted). 예전 `bg-surface-muted` 는 테마에 없는 토큰이라 판이 그려지지 않았다.
const segmentedControlVariants = cva('gap-1 rounded-lg bg-muted p-1', {
  variants: {
    block: {
      true: 'grid w-full auto-cols-fr grid-flow-col',
      false: 'inline-flex w-fit shrink-0',
    },
  },
  defaultVariants: {
    block: false,
  },
})

/* 선택 세그먼트는 중립 raised 스타일(bg-background + border-border-subtle) —
   색 악센트(primary)는 화면의 콘텐츠 선택에 양보한다 */
const segmentedControlItemVariants = cva(
  'whitespace-nowrap rounded-md border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-2.5 py-1.5 text-sm',
      },
      selected: {
        true: 'border-border-subtle bg-background text-fg',
        false: 'border-transparent text-fg-muted hover:text-fg',
      },
    },
    defaultVariants: {
      size: 'md',
      selected: false,
    },
  },
)

type SegmentedControlItem = {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

/** 키 입력 → 다음 enabled 인덱스. 해당 없는 키는 null. */
function resolveNextIndex(key: string, currentIdx: number, length: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (currentIdx + 1) % length
    case 'ArrowLeft':
    case 'ArrowUp':
      return (currentIdx - 1 + length) % length
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return null
  }
}

type SegmentedControlProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  VariantProps<typeof segmentedControlVariants> & {
    items: ReadonlyArray<SegmentedControlItem>
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    size?: 'sm' | 'md'
    disabled?: boolean
    'aria-label'?: string
  }

const SegmentedControl = forwardRef<HTMLDivElement, SegmentedControlProps>(
  (
    {
      items,
      value: valueProp,
      defaultValue,
      onValueChange,
      size = 'md',
      block,
      disabled = false,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(() => defaultValue ?? items[0]?.value ?? '')
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp : internalValue

    const handleValueChange = (next: string) => {
      if (!isControlled) setInternalValue(next)
      onValueChange?.(next)
    }

    // WAI-ARIA tablist: Arrow keys navigate between segments (automatic activation).
    // 핸들러는 focusable한 tab 버튼에 붙인다(roving tabindex).
    function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
      const enabledItems = items.filter((item) => !disabled && !item.disabled)
      if (enabledItems.length === 0) return
      const currentIdx = enabledItems.findIndex((item) => item.value === value)
      const nextIdx = resolveNextIndex(e.key, currentIdx, enabledItems.length)
      if (nextIdx === null) return
      e.preventDefault()

      const next = enabledItems[nextIdx]
      if (!next || next.value === value) return
      handleValueChange(next.value)
      const root = e.currentTarget.closest('[data-slot="segmented-control-root"]')
      const tabs = root?.querySelectorAll<HTMLElement>('[data-slot="segmented-control-item"]')
      const targetTab = tabs?.[items.findIndex((item) => item.value === next.value)]
      targetTab?.focus()
    }

    const hasSelection = items.some((item) => !disabled && !item.disabled && item.value === value)
    const firstEnabledIdx = items.findIndex((item) => !disabled && !item.disabled)

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        data-slot="segmented-control-root"
        className={cn(segmentedControlVariants({ block }), className)}
        {...props}
      >
        {items.map((item, idx) => {
          const selected = value === item.value
          const itemDisabled = disabled || item.disabled
          const isTabStop = selected || (!hasSelection && idx === firstEnabledIdx)
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={itemDisabled}
              tabIndex={isTabStop ? 0 : -1}
              data-slot="segmented-control-item"
              className={segmentedControlItemVariants({ size, selected })}
              onKeyDown={handleKeyDown}
              onClick={() => {
                if (itemDisabled || selected) return
                handleValueChange(item.value)
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    )
  },
)

SegmentedControl.displayName = 'SegmentedControl'

export { SegmentedControl, segmentedControlVariants, segmentedControlItemVariants }
export type { SegmentedControlItem, SegmentedControlProps }
