'use client'

import { type VariantProps } from 'class-variance-authority'
import { forwardRef, useId, useState } from 'react'

import { cn } from '@/utils/cn'
import { inputVariants } from '@/utils/fieldControlSurface'

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-4"
      aria-hidden
    >
      <path d="M3 8h10" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-4"
      aria-hidden
    >
      <path d="M8 3v10M3 8h10" />
    </svg>
  )
}

type NumberInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> &
  VariantProps<typeof inputVariants> & {
    value?: number
    defaultValue?: number
    onChange?: (value: number) => void
    min?: number
    max?: number
    step?: number
    /** Enter 키 입력 시 호출됩니다. */
    onEnterKey?: () => void
    /** Escape 키 입력 시 호출됩니다. */
    onEscapeKey?: () => void
  }

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      className,
      variant,
      size = 'md',
      value,
      defaultValue,
      onChange,
      min,
      max,
      step = 1,
      disabled,
      id,
      onEnterKey,
      onEscapeKey,
      onKeyDown: onKeyDownProp,
      ...props
    },
    ref,
  ) => {
    const autoId = useId()
    const inputId = id ?? autoId

    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState<number | undefined>(defaultValue)
    const currentValue = isControlled ? value : internalValue

    const commit = (next: number) => {
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onEnterKey?.()
      if (e.key === 'Escape') onEscapeKey?.()
      onKeyDownProp?.(e)
    }

    const handleStep = (dir: 1 | -1) => {
      const current = currentValue ?? 0
      const next = Math.round((current + dir * step) * 1e10) / 1e10
      if (min !== undefined && next < min) return
      if (max !== undefined && next > max) return
      commit(next)
    }

    const btnSize =
      size === 'sm' ? 'h-density-sm w-8' : size === 'lg' ? 'h-density-lg w-10' : 'h-density-md w-9'

    const btnBase = cn(
      'inline-flex shrink-0 items-center justify-center border border-border bg-surface text-fg',
      'transition-colors hover:bg-overlay hover:text-fg',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
      'disabled:cursor-not-allowed disabled:opacity-50',
      btnSize,
    )

    return (
      <div data-slot="number-input-root" className={cn('inline-flex items-stretch', className)}>
        <button
          type="button"
          aria-label="감소"
          tabIndex={-1}
          disabled={disabled || (min !== undefined && (currentValue ?? 0) <= min)}
          onClick={() => handleStep(-1)}
          data-slot="number-input-decrement"
          className={cn(btnBase, 'rounded-l-lg border-r-0')}
        >
          <MinusIcon />
        </button>

        <input
          ref={ref}
          id={inputId}
          type="number"
          value={currentValue ?? ''}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onChange={(e) => {
            if (!isNaN(e.target.valueAsNumber)) commit(e.target.valueAsNumber)
          }}
          aria-invalid={variant === 'error' ? true : undefined}
          data-slot="number-input-field"
          className={cn(
            inputVariants({ variant, size }),
            'rounded-none border-x-0 text-center tabular-nums',
            '[appearance:textfield]',
            '[&::-webkit-inner-spin-button]:appearance-none',
            '[&::-webkit-outer-spin-button]:appearance-none',
          )}
          onKeyDown={handleKeyDown}
          {...props}
        />

        <button
          type="button"
          aria-label="증가"
          tabIndex={-1}
          disabled={disabled || (max !== undefined && (currentValue ?? 0) >= max)}
          onClick={() => handleStep(1)}
          data-slot="number-input-increment"
          className={cn(btnBase, 'rounded-r-lg border-l-0')}
        >
          <PlusIcon />
        </button>
      </div>
    )
  },
)

NumberInput.displayName = 'NumberInput'

export { NumberInput }
export type { NumberInputProps }
