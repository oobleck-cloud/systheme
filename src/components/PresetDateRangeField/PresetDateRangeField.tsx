'use client'

import { forwardRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { cn } from '@/utils/cn'

export type DateRangePresetModel = { key: string; label: string }

export type DateRangeFieldValue = {
  presetKey: string
  customOpen: boolean
  start: string
  end: string
}

export type PresetDateRangeFieldProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange' | 'defaultValue'
> & {
  value?: DateRangeFieldValue
  defaultValue?: DateRangeFieldValue
  onChange?: (next: DateRangeFieldValue) => void
  presetChoices: DateRangePresetModel[]
  children?: React.ReactNode
}

const DEFAULT_RANGE_VALUE: DateRangeFieldValue = {
  presetKey: '',
  customOpen: false,
  start: '',
  end: '',
}

const PresetDateRangeField = forwardRef<HTMLDivElement, PresetDateRangeFieldProps>(
  (
    {
      className,
      value: valueProp,
      defaultValue = DEFAULT_RANGE_VALUE,
      onChange,
      presetChoices,
      children,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState<DateRangeFieldValue>(defaultValue)
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp! : internalValue

    const { presetKey, customOpen, start, end } = value

    function patch(partial: Partial<DateRangeFieldValue>) {
      const next = { ...value, ...partial }
      if (!isControlled) setInternalValue(next)
      onChange?.(next)
    }

    return (
      <div
        ref={ref}
        data-slot="preset-date-range-field-root"
        className={cn('flex w-full flex-col gap-2', className)}
        {...props}
      >
        <div data-slot="preset-date-range-field-presets" className="flex flex-wrap gap-2">
          {presetChoices.map((p) => (
            <button
              key={p.key}
              type="button"
              data-slot="preset-date-range-field-preset"
              aria-pressed={p.key === presetKey}
              className={cn(
                'rounded-full border px-3 py-1 text-sm',
                p.key === presetKey
                  ? 'border-border bg-muted font-medium text-fg'
                  : 'border-border text-fg-muted hover:bg-muted',
              )}
              onClick={() => patch({ presetKey: p.key })}
            >
              <span data-slot="preset-date-range-field-label">{p.label}</span>
            </button>
          ))}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="preset-date-range-field-open-custom"
          aria-pressed={customOpen}
          disabled={!onChange}
          onClick={() => patch({ customOpen: !customOpen })}
        >
          {customOpen ? '사용자 설정 숨기기' : '날짜 직접 입력'}
        </Button>
        {customOpen ? (
          <div
            data-slot="preset-date-range-field-custom-panel"
            className="flex flex-col gap-2 border-t border-border pt-3"
          >
            <div data-slot="preset-date-range-field-range-slot" className="min-h-8">
              {children}
            </div>
            <Input
              data-slot="preset-date-range-field-start"
              type="date"
              value={start}
              aria-label="시작일"
              onValueChange={(v) => patch({ start: v })}
            />
            <Input
              data-slot="preset-date-range-field-end"
              type="date"
              value={end}
              aria-label="종료일"
              onValueChange={(v) => patch({ end: v })}
            />
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-slot="preset-date-range-field-apply-custom"
              disabled={!onChange}
              onClick={() => onChange?.(value)}
            >
              적용
            </Button>
          </div>
        ) : null}
      </div>
    )
  },
)

PresetDateRangeField.displayName = 'PresetDateRangeField'

export { PresetDateRangeField }
