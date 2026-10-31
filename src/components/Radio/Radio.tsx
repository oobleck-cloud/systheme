'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useCallback, useId } from 'react'

import { cn } from '@/utils/cn'

/**
 * Checkbox의 대응 쌍 — 그룹 내 단일 선택.
 * peer(sr-only input) + frame(시각 원) 패턴으로 Checkbox와 동형.
 */
const radioControlFrameVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center rounded-full',
    'border bg-background transition-colors outline-none',
    'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
    'peer-disabled:cursor-not-allowed peer-disabled:border-disabled-border peer-disabled:bg-disabled-subtle',
    '[&_.radio-dot]:transition-opacity [&_.radio-dot]:duration-effects-fast [&_.radio-dot]:ease-snappy',
    '[&_.radio-dot]:opacity-0 peer-checked:[&_.radio-dot]:opacity-100',
    'peer-checked:border-primary peer-checked:bg-primary',
  ],
  {
    variants: {
      variant: {
        default: 'border-border hover:border-border-strong',
        error:
          'border-error-border peer-focus-visible:ring-error-primary hover:border-error-primary',
      },
      size: {
        sm: 'size-4',
        md: 'size-5',
        lg: 'size-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const dotSize = {
  sm: 'size-1.5',
  md: 'size-2',
  lg: 'size-2.5',
} as const

type RadioProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> &
  VariantProps<typeof radioControlFrameVariants> & {
    label?: React.ReactNode
    description?: React.ReactNode
    onCheckedChange?: (checked: boolean) => void
  }

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      variant,
      size = 'md',
      label,
      description,
      id,
      disabled,
      onCheckedChange,
      ...inputProps
    },
    ref,
  ) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const descriptionId = description ? `${inputId}-description` : undefined

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
          onCheckedChange?.(true)
        }
      },
      [onCheckedChange],
    )

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-start gap-2',
          disabled && 'cursor-not-allowed',
          className,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          disabled={disabled}
          onChange={handleChange}
          className="peer sr-only disabled:cursor-not-allowed"
          aria-describedby={descriptionId}
          {...inputProps}
        />
        <span aria-hidden="true" className={cn(radioControlFrameVariants({ variant, size }))}>
          <span
            className={cn(
              'radio-dot rounded-full bg-primary-fg transition-opacity',
              dotSize[size ?? 'md'],
            )}
          />
        </span>
        {(label != null || description != null) && (
          <span className="flex min-w-0 flex-col gap-0.5 pt-px">
            {label != null && <span className="text-sm font-medium text-fg">{label}</span>}
            {description != null && (
              <span id={descriptionId} className="text-xs text-fg-muted">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    )
  },
)

Radio.displayName = 'Radio'

export { Radio, radioControlFrameVariants }
export type { RadioProps }
