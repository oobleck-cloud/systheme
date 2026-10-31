'use client'

import { useCallback, useId } from 'react'

import { cn } from '@/utils/cn'

import { SLIDER_THUMB_CLASSES, SLIDER_TRACK_CLASSES, sliderPercent } from './sliderStyles'

type RangeValue = readonly [number, number]

type RangeSliderProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
  /** `[시작, 끝]`. 항상 시작 ≤ 끝으로 정규화되어 전달된다. */
  value: RangeValue
  onChange?: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  /** 값 표시 텍스트. 숫자를 그대로 쓰지 않고 도메인 단위로 포맷할 때 쓴다. */
  formatValue?: (value: number) => string
  showValue?: boolean
  label?: React.ReactNode
  disabled?: boolean
  /** 스크린리더용 각 썸 이름. 둘을 구분하지 않으면 어느 끝을 잡았는지 알 수 없다. */
  startLabel?: string
  endLabel?: string
}

/**
 * 양끝을 각각 끌어 구간을 고르는 슬라이더.
 *
 * 네이티브 `input[type=range]` 두 개를 겹쳐 쓴다 — 커스텀 포인터 로직 대신 키보드
 * 조작·터치·접근성을 브라우저에서 그대로 받기 위해서다. 입력 자체는 투명하고
 * 포인터는 썸에서만 받으므로, 겹친 상태에서도 가까운 썸이 잡힌다.
 */
function RangeSlider({
  className,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue,
  showValue = false,
  label,
  disabled,
  startLabel = '시작',
  endLabel = '끝',
  ...props
}: RangeSliderProps) {
  const groupId = useId()
  // 뒤집힌 값이 들어와도 화면은 항상 정상 구간을 그린다.
  const start = Math.min(value[0], value[1])
  const end = Math.max(value[0], value[1])
  const format = formatValue ?? String

  // 한쪽 썸이 반대편을 밀고 지나가지 않도록 잡아 둔다. 지나가게 두면 어느 썸을
  // 잡고 있었는지 잃어버려 커서와 값이 어긋난다.
  const handleStart = useCallback(
    (next: number) => onChange?.([Math.min(next, end), end]),
    [onChange, end],
  )
  const handleEnd = useCallback(
    (next: number) => onChange?.([start, Math.max(next, start)]),
    [onChange, start],
  )

  const startPct = sliderPercent(start, min, max)
  const endPct = sliderPercent(end, min, max)

  const inputClasses = cn(
    // 입력은 트랙 위에 겹쳐 두되 포인터는 썸에서만 받는다.
    'pointer-events-none absolute inset-x-0 w-full appearance-none bg-transparent focus-visible:outline-none',
    '[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto',
    '[&::-webkit-slider-thumb]:cursor-pointer',
    SLIDER_THUMB_CLASSES,
    disabled && 'cursor-not-allowed opacity-50',
  )

  return (
    <div className={cn('flex flex-col gap-1.5', className)} {...props}>
      {(label != null || showValue) && (
        <div className="flex items-center justify-between gap-2">
          {label != null && (
            <span id={`${groupId}-label`} className="text-sm font-medium text-fg">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm tabular-nums text-fg-subtle" aria-live="polite" aria-atomic>
              {format(start)} ~ {format(end)}
            </span>
          )}
        </div>
      )}

      <div className="relative flex h-5 items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-full items-center">
          <div className={SLIDER_TRACK_CLASSES}>
            <div
              data-slot="range-slider-fill"
              className="absolute inset-y-0 rounded-full bg-primary transition-[left,right] duration-75 left-[var(--ds-range-start)] right-[var(--ds-range-end)]"
              style={{ '--ds-range-start': `${startPct}%`, '--ds-range-end': `${100 - endPct}%` }}
            />
          </div>
        </div>

        <input
          type="range"
          className={inputClasses}
          min={min}
          max={max}
          step={step}
          value={start}
          disabled={disabled}
          aria-label={startLabel}
          aria-valuetext={format(start)}
          onChange={(e) => handleStart(e.target.valueAsNumber)}
        />
        <input
          type="range"
          className={inputClasses}
          min={min}
          max={max}
          step={step}
          value={end}
          disabled={disabled}
          aria-label={endLabel}
          aria-valuetext={format(end)}
          onChange={(e) => handleEnd(e.target.valueAsNumber)}
        />
      </div>
    </div>
  )
}

RangeSlider.displayName = 'RangeSlider'

export { RangeSlider }
export type { RangeSliderProps, RangeValue }
