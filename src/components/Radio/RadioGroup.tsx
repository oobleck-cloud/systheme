'use client'

import { useId } from 'react'

import { Radio, type RadioProps } from './Radio'

import { cn } from '@/utils/cn'

export type RadioGroupOption = {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

type RadioGroupProps = Omit<React.HTMLAttributes<HTMLFieldSetElement>, 'onChange'> & {
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  options?: RadioGroupOption[]
  legend?: React.ReactNode
  orientation?: 'vertical' | 'horizontal'
  variant?: RadioProps['variant']
  size?: RadioProps['size']
  disabled?: boolean
}

function RadioGroup({
  className,
  name,
  value,
  defaultValue,
  onChange,
  options,
  legend,
  orientation = 'vertical',
  variant,
  size,
  disabled,
  children,
  ...props
}: RadioGroupProps) {
  const groupId = useId()
  const groupName = name ?? groupId

  return (
    <fieldset className={cn('m-0 min-w-0 border-0 p-0', className)} disabled={disabled} {...props}>
      {legend != null && <legend className="mb-2 text-sm font-medium text-fg">{legend}</legend>}
      <div
        className={cn(
          'flex',
          orientation === 'vertical' ? 'flex-col gap-2' : 'flex-row flex-wrap gap-4',
        )}
      >
        {options
          ? options.map((opt) => (
              <Radio
                key={opt.value}
                name={groupName}
                value={opt.value}
                label={opt.label}
                description={opt.description}
                checked={value !== undefined ? value === opt.value : undefined}
                defaultChecked={defaultValue !== undefined ? defaultValue === opt.value : undefined}
                disabled={opt.disabled ?? disabled}
                variant={variant}
                size={size}
                onCheckedChange={(checked) => {
                  if (checked) onChange?.(opt.value)
                }}
              />
            ))
          : children}
      </div>
    </fieldset>
  )
}

RadioGroup.displayName = 'RadioGroup'

export { RadioGroup }
export type { RadioGroupProps }
