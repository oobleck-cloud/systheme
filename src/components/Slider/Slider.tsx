'use client'

import { forwardRef, useId } from 'react'

import { cn } from '@/utils/cn'

import { SLIDER_THUMB_CLASSES, SLIDER_TRACK_CLASSES, sliderPercent } from './sliderStyles'

type SliderProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'size'
> & {
  value?: number
  defaultValue?: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  showValue?: boolean
  label?: React.ReactNode
}

const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      defaultValue,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      showValue = false,
      label,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const autoId = useId()
    const inputId = id ?? autoId

    const pct = value !== undefined ? sliderPercent(value, min, max) : undefined

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {(label != null || showValue) && (
          <div className="flex items-center justify-between gap-2">
            {label != null && (
              <label htmlFor={inputId} className="text-sm font-medium text-fg">
                {label}
              </label>
            )}
            {showValue && value !== undefined && (
              <span className="text-sm text-fg-subtle tabular-nums" aria-live="polite" aria-atomic>
                {value}
              </span>
            )}
          </div>
        )}

        <div className="relative flex h-5 items-center">
          {/* 커스텀 트랙 — 채워진 영역과 배경 트랙을 분리 */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 flex w-full items-center"
            aria-hidden
          >
            <div className={SLIDER_TRACK_CLASSES}>
              {pct !== undefined && (
                <div
                  data-slot="slider-fill"
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-75 w-[var(--ds-slider-fill)]"
                  style={{ '--ds-slider-fill': `${pct}%` }}
                />
              )}
            </div>
          </div>

          <input
            ref={ref}
            id={inputId}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            defaultValue={defaultValue}
            disabled={disabled}
            onChange={(e) => onChange?.(e.target.valueAsNumber)}
            className={cn(
              'relative w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none',
              SLIDER_THUMB_CLASSES,
              disabled && 'cursor-not-allowed opacity-50',
            )}
            {...props}
          />
        </div>
      </div>
    )
  },
)

Slider.displayName = 'Slider'

export { Slider }
export type { SliderProps }
