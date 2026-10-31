'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ScrollWheelColumn } from './ScrollWheelColumn'

import { Button } from '@/components/Button'
import { inputVariants } from '@/components/Input'
import { MOBILE_SHEET_MEDIA, useMediaQuery } from '@/hooks/useMediaQuery'
import {
  anchorPopoverRootClassName,
  useDismissOnEscape,
  useFocusTrap,
  usePointerDownOutside,
} from '@/primitives/anchorPopover'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import {
  buildYearRange,
  clampBirthParts,
  daysInMonth,
  type BirthDateParts,
  pad2,
  resolveBirthDateParts,
  toBirthDateDigits,
} from '@/utils/birthDateModel'
import { cn } from '@/utils/cn'
import { formatBirthDateDisplay } from '@/utils/dateDigits'

const columnHeaderVariants = cva('border-b border-border text-center font-medium text-fg-muted', {
  variants: {
    density: {
      compact: 'px-2 py-1 text-[0.625rem]',
      default: 'px-3 py-1.5 text-xs',
      loose: 'px-4 py-2 text-sm',
    },
  },
  defaultVariants: { density: 'default' },
})

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M5 1.5v3M11 1.5v3M2 7h12" />
    </svg>
  )
}

type BirthDateScrollPickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'size'> &
  Pick<VariantProps<typeof columnHeaderVariants>, 'density'> & {
    /** YYYYMMDD 숫자 8자리 (controlled) */
    value?: string
    /** Uncontrolled 초기 YYYYMMDD 숫자값 */
    defaultValue?: string
    onChange?: (digits: string) => void
    placeholder?: string
    disabled?: boolean
    minYear?: number
    maxYear?: number
    /** 트리거 접근성 라벨 */
    'aria-label'?: string
  }

function BirthDateWheelColumns({
  parts,
  onPartsChange,
  minYear,
  maxYear,
  density,
}: {
  parts: BirthDateParts
  onPartsChange: (next: BirthDateParts) => void
  minYear: number
  maxYear: number
  density: NonNullable<VariantProps<typeof columnHeaderVariants>['density']>
}) {
  const years = buildYearRange(minYear, maxYear)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const dayCount = daysInMonth(parts.year, parts.month)
  const days = Array.from({ length: dayCount }, (_, i) => i + 1)

  function update(next: BirthDateParts) {
    onPartsChange(clampBirthParts(next))
  }

  return (
    <div data-slot="birth-date-scroll-picker-columns" className="flex divide-x divide-border">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={columnHeaderVariants({ density })}>년</span>
        <ScrollWheelColumn
          columnId="year"
          aria-label="년"
          density={density}
          value={parts.year}
          onChange={(year) => update({ ...parts, year })}
          options={years.map((y) => ({ value: y, label: String(y) }))}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={columnHeaderVariants({ density })}>월</span>
        <ScrollWheelColumn
          columnId="month"
          aria-label="월"
          density={density}
          value={parts.month}
          onChange={(month) => update({ ...parts, month })}
          options={months.map((m) => ({ value: m, label: pad2(m) }))}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={columnHeaderVariants({ density })}>일</span>
        <ScrollWheelColumn
          columnId="day"
          aria-label="일"
          density={density}
          value={parts.day}
          onChange={(day) => update({ ...parts, day })}
          options={days.map((d) => ({ value: d, label: pad2(d) }))}
        />
      </div>
    </div>
  )
}

function BirthDateScrollPicker({
  className,
  variant,
  size = 'md',
  value,
  defaultValue,
  onChange,
  placeholder = '생년월일 선택',
  disabled = false,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  density,
  'aria-label': ariaLabel = '생년월일',
  ...props
}: BirthDateScrollPickerProps) {
  const den = density ?? 'default'
  const isSheet = useMediaQuery(MOBILE_SHEET_MEDIA)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue ?? '')
  const currentValue = isControlled ? value : internalValue

  const [parts, setParts] = useState<BirthDateParts>(() =>
    resolveBirthDateParts(currentValue, minYear, maxYear),
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const desktopPanelRef = useRef<HTMLDivElement>(null)
  const sheetPanelRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()
  const sheetTitleId = useId()

  useDismissOnEscape(isOpen, () => setIsOpen(false))
  useFocusTrap(desktopPanelRef, isOpen && !isSheet)
  useFocusTrap(sheetPanelRef, isOpen && isSheet)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setParts(resolveBirthDateParts(currentValue, minYear, maxYear))
  }, [currentValue, minYear, maxYear])

  function commit(digits: string) {
    if (!isControlled) setInternalValue(digits)
    onChange?.(digits)
  }

  usePointerDownOutside({
    enabled: isOpen && !isSheet,
    containerRef,
    onPointerDownOutside: () => setIsOpen(false),
  })

  useEffect(() => {
    if (!isSheet || !isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isSheet, isOpen])

  function handleOpen(next: boolean) {
    if (disabled) return
    if (next) {
      setParts(resolveBirthDateParts(currentValue, minYear, maxYear))
    }
    setIsOpen(next)
  }

  function handlePartsChange(next: BirthDateParts) {
    const clamped = clampBirthParts(next)
    setParts(clamped)
    if (!isSheet) {
      commit(toBirthDateDigits(clamped))
    }
  }

  function confirmSheet() {
    commit(toBirthDateDigits(parts))
    setIsOpen(false)
  }

  const display =
    currentValue && formatBirthDateDisplay(currentValue)
      ? formatBirthDateDisplay(currentValue)
      : null

  const wheel = (
    <BirthDateWheelColumns
      parts={parts}
      onPartsChange={handlePartsChange}
      minYear={minYear}
      maxYear={maxYear}
      density={den}
    />
  )

  const sheetPortal =
    mounted && isSheet && isOpen
      ? createPortal(
          <div
            data-slot="birth-date-scroll-picker-sheet-root"
            className="fixed inset-0 z-50"
            role="presentation"
          >
            <OverlayScrim
              data-slot="birth-date-scroll-picker-sheet-scrim"
              dismissLabel="생년월일 선택 닫기"
              onClick={() => setIsOpen(false)}
            />
            <Panel
              ref={sheetPanelRef}
              role="dialog"
              data-slot="birth-date-scroll-picker-sheet-panel"
              appearance="solid"
              shape="edge-bottom"
              position="fixed"
              offset="none"
              scrollHint={false}
              aria-modal="true"
              aria-labelledby={sheetTitleId}
              className="z-[60] flex flex-col gap-0 overflow-hidden p-0"
            >
              <div className="border-b border-border px-4 py-3">
                <h2 id={sheetTitleId} className="text-base font-semibold text-fg">
                  생년월일
                </h2>
              </div>
              <div className="px-1 pb-2">{wheel}</div>
              <div
                data-slot="birth-date-scroll-picker-confirm"
                className="border-t border-border p-4"
              >
                <Button type="button" size="lg" className="w-full" onClick={confirmSheet}>
                  확인
                </Button>
              </div>
            </Panel>
          </div>,
          document.body,
        )
      : null

  return (
    <div
      ref={containerRef}
      data-slot="birth-date-scroll-picker-root"
      className={cn(anchorPopoverRootClassName, className)}
      {...props}
    >
      <button
        type="button"
        data-slot="birth-date-scroll-picker-trigger"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isSheet ? undefined : popoverId}
        aria-label={ariaLabel}
        onClick={() => handleOpen(!isOpen)}
        className={cn(
          inputVariants({ variant, size }),
          'flex w-full cursor-pointer items-center justify-between gap-2 text-left',
          !display && 'text-fg-muted',
        )}
      >
        <span data-slot="birth-date-scroll-picker-value">{display ?? placeholder}</span>
        <span aria-hidden="true" className="flex shrink-0 items-center text-fg-muted">
          <CalendarIcon />
        </span>
      </button>

      {!isSheet && isOpen && (
        <Panel
          ref={desktopPanelRef}
          id={popoverId}
          data-slot="birth-date-scroll-picker-panel"
          role="dialog"
          aria-modal="true"
          aria-label="생년월일 선택"
          className="w-[min(100%,20rem)] overflow-hidden p-0"
        >
          {wheel}
        </Panel>
      )}

      {sheetPortal}
    </div>
  )
}

export { BirthDateScrollPicker }
export type { BirthDateScrollPickerProps }
