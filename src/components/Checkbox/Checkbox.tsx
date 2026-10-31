'use client'

import { type VariantProps } from 'class-variance-authority'
import { forwardRef, useCallback, useId, useState } from 'react'

import { cn } from '@/utils/cn'
import { checkboxControlFrameVariants } from '@/utils/fieldControlSurface'

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'type' | 'onChange' | 'defaultChecked'
> &
  VariantProps<typeof checkboxControlFrameVariants> & {
    label?: React.ReactNode
    description?: React.ReactNode
    indeterminate?: boolean
    defaultChecked?: boolean
    onCheckedChange?: (checked: boolean) => void
  }

const markSize = {
  sm: 'size-2.5',
  md: 'size-3',
  lg: 'size-3.5',
} as const

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      variant,
      size = 'md',
      label,
      description,
      id,
      indeterminate = false,
      disabled,
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      ...inputProps
    },
    ref,
  ) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const descriptionId = description ? `${inputId}-description` : undefined

    const [internalChecked, setInternalChecked] = useState(defaultChecked)
    const isControlled = checkedProp !== undefined
    const checked = isControlled ? checkedProp! : internalChecked

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
        if (node) node.indeterminate = indeterminate
      },
      [ref, indeterminate],
    )

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.checked
        if (!isControlled) setInternalChecked(next)
        onCheckedChange?.(next)
      },
      [isControlled, onCheckedChange],
    )

    const markClass = markSize[size ?? 'md']

    const control = (
      <>
        <input
          ref={setRefs}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          checked={isControlled ? checked : undefined}
          defaultChecked={!isControlled ? defaultChecked : undefined}
          onChange={handleChange}
          className={cn('peer sr-only disabled:cursor-not-allowed')}
          aria-invalid={variant === 'error' ? true : undefined}
          aria-describedby={descriptionId}
          {...inputProps}
        />
        <span
          aria-hidden="true"
          className={cn(
            checkboxControlFrameVariants({ variant, size }),
            '[&_.checkbox-check]:pointer-events-none [&_.checkbox-check]:absolute [&_.checkbox-check]:top-1/2 [&_.checkbox-check]:left-1/2 [&_.checkbox-check]:-translate-x-1/2 [&_.checkbox-check]:-translate-y-1/2',
            '[&_.checkbox-check]:transition-opacity [&_.checkbox-check]:duration-effects-fast [&_.checkbox-check]:ease-snappy',
            '[&_.checkbox-check]:opacity-0 peer-checked:[&_.checkbox-check]:opacity-100',
            '[&_.checkbox-dash]:pointer-events-none [&_.checkbox-dash]:absolute [&_.checkbox-dash]:top-1/2 [&_.checkbox-dash]:left-1/2 [&_.checkbox-dash]:-translate-x-1/2 [&_.checkbox-dash]:-translate-y-1/2',
            '[&_.checkbox-dash]:transition-opacity [&_.checkbox-dash]:duration-effects-fast [&_.checkbox-dash]:ease-snappy',
            '[&_.checkbox-dash]:opacity-0 peer-indeterminate:[&_.checkbox-dash]:opacity-100',
            'peer-checked:[&_.checkbox-dash]:opacity-0',
            'peer-indeterminate:[&_.checkbox-check]:opacity-0',
          )}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('checkbox-check', markClass)}
          >
            <path d="M3 8l3.5 3.5L13 4" />
          </svg>
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className={cn('checkbox-dash', markClass)}
          >
            <path d="M3 8h10" />
          </svg>
        </span>
      </>
    )

    return (
      <label
        className={cn(
          'inline-flex cursor-pointer items-start gap-2',
          disabled && 'cursor-not-allowed',
          className,
        )}
      >
        {control}
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

Checkbox.displayName = 'Checkbox'

export { Checkbox, checkboxControlFrameVariants }
export type { CheckboxProps }
export type { CheckboxControlFrameVariantProps } from '@/utils/fieldControlSurface'
