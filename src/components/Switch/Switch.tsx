'use client'

import { forwardRef, useState } from 'react'

import { cn } from '@/utils/cn'

type SwitchProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'role' | 'type' | 'onClick'
> & {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked: checkedProp,
      defaultChecked = false,
      onCheckedChange,
      disabled,
      id,
      'aria-labelledby': ariaLabelledby,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked)
    const isControlled = checkedProp !== undefined
    const checked = isControlled ? checkedProp! : internalChecked

    function handleClick() {
      const next = !checked
      if (!isControlled) setInternalChecked(next)
      onCheckedChange?.(next)
    }

    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={ariaLabelledby}
        disabled={disabled}
        data-slot="switch-root"
        onClick={handleClick}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
          'border border-border bg-surface shadow-[inset_0_1px_2px_oklch(0%_0_0_/0.06)]',
          'transition-[background-color,border-color] duration-effects-default ease-standard',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked && 'border-primary bg-primary',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden
          data-slot="switch-thumb"
          className={cn(
            'pointer-events-none absolute top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 rounded-full',
            'bg-background shadow-sm ring-1 ring-border/40',
            'transition-[left] duration-effects-default ease-snappy',
            checked ? 'left-[calc(100%-0.125rem-1.125rem)]' : 'left-0.5',
          )}
        />
      </button>
    )
  },
)

Switch.displayName = 'Switch'

export { Switch }
export type { SwitchProps }
