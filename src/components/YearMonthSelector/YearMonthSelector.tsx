'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { ScrollWheelColumn } from '../BirthDateScrollPicker/ScrollWheelColumn'

import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { MOBILE_SHEET_MEDIA, useMediaQuery } from '@/hooks/useMediaQuery'
import { ChevronLeft, createIconElement } from '@/icons'
import { AnchorContextSurface } from '@/primitives/anchorContextSurface'
import { useFocusTrap } from '@/primitives/anchorPopover'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
import { cn } from '@/utils/cn'
import {
  buildYearRange,
  clampYearMonth,
  formatYearMonthLabel,
  pad2,
  resolveYearMonthParts,
  shiftYearMonth,
  yearMonthPartsToDate,
  type YearMonthParts,
} from '@/utils/yearMonthModel'

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

function ChevronRightIcon() {
  return <span className="inline-flex rotate-180">{createIconElement(ChevronLeft, 'sm')}</span>
}

type YearMonthWheelColumnsProps = {
  parts: YearMonthParts
  onPartsChange: (next: YearMonthParts) => void
  minYear: number
  maxYear: number
  density: NonNullable<VariantProps<typeof columnHeaderVariants>['density']>
}

function YearMonthWheelColumns({
  parts,
  onPartsChange,
  minYear,
  maxYear,
  density,
}: YearMonthWheelColumnsProps) {
  const years = buildYearRange(minYear, maxYear)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  function update(next: YearMonthParts) {
    onPartsChange(clampYearMonth(next, minYear, maxYear))
  }

  return (
    <div data-slot="year-month-selector-columns" className="flex divide-x divide-border">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={columnHeaderVariants({ density })}>년</span>
        <ScrollWheelColumn
          slotPrefix="year-month-selector"
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
          slotPrefix="year-month-selector"
          columnId="month"
          aria-label="월"
          density={density}
          value={parts.month}
          onChange={(month) => update({ ...parts, month })}
          options={months.map((m) => ({ value: m, label: pad2(m) }))}
        />
      </div>
    </div>
  )
}

type YearMonthSelectorProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  Pick<VariantProps<typeof columnHeaderVariants>, 'density'> & {
    /** 조회 기준 월 (해당 월 1일, controlled) */
    value?: Date
    /** Uncontrolled 초기 기준 월 */
    defaultValue?: Date
    onChange?: (month: Date) => void
    minYear?: number
    maxYear?: number
    disabled?: boolean
    'aria-label'?: string
  }

function YearMonthSelector({
  className,
  value,
  defaultValue,
  onChange,
  minYear = 2020,
  maxYear = new Date().getFullYear() + 2,
  density,
  disabled = false,
  'aria-label': ariaLabel = '조회 연월',
  ...props
}: YearMonthSelectorProps) {
  const portalRoot = usePortalRoot()
  const den = density ?? 'default'
  const isSheet = useMediaQuery(MOBILE_SHEET_MEDIA)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<Date | undefined>(defaultValue)
  const currentValue = isControlled ? value : internalValue

  const [parts, setParts] = useState<YearMonthParts>(() =>
    resolveYearMonthParts(currentValue, minYear, maxYear),
  )
  const sheetTitleId = useId()
  const sheetPanelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(sheetPanelRef, isSheet && isOpen)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setParts(resolveYearMonthParts(currentValue, minYear, maxYear))
  }, [currentValue, minYear, maxYear])

  useEffect(() => {
    if (!isSheet || !isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isSheet, isOpen])

  useEffect(() => {
    if (!isSheet || !isOpen) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [isSheet, isOpen])

  function emit(partsNext: YearMonthParts) {
    const nextDate = yearMonthPartsToDate(partsNext)
    if (!isControlled) setInternalValue(nextDate)
    onChange?.(nextDate)
  }

  function handleOpen(next: boolean) {
    if (disabled) return
    if (next) {
      setParts(resolveYearMonthParts(currentValue, minYear, maxYear))
    }
    setIsOpen(next)
  }

  function handlePartsChange(next: YearMonthParts) {
    const clamped = clampYearMonth(next, minYear, maxYear)
    setParts(clamped)
    if (!isSheet) {
      emit(clamped)
    }
  }

  function confirmSheet() {
    emit(parts)
    setIsOpen(false)
  }

  function stepMonth(delta: number) {
    const shifted = shiftYearMonth(resolveYearMonthParts(currentValue, minYear, maxYear), delta)
    const next = clampYearMonth(shifted, minYear, maxYear)
    emit(next)
  }

  const label = formatYearMonthLabel(resolveYearMonthParts(currentValue, minYear, maxYear))

  const wheel = (
    <YearMonthWheelColumns
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
            data-slot="year-month-selector-sheet-root"
            className="fixed inset-0 z-50"
            role="presentation"
          >
            <OverlayScrim
              data-slot="year-month-selector-sheet-scrim"
              dismissLabel="조회 연월 선택 닫기"
              onClick={() => setIsOpen(false)}
            />
            <Panel
              ref={sheetPanelRef}
              role="dialog"
              data-slot="year-month-selector-sheet-panel"
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
                  조회 연월
                </h2>
              </div>
              <div className="px-1 pb-2">{wheel}</div>
              <div data-slot="year-month-selector-confirm" className="border-t border-border p-4">
                <Button type="button" size="lg" className="w-full" onClick={confirmSheet}>
                  확인
                </Button>
              </div>
            </Panel>
          </div>,
          portalRoot,
        )
      : null

  return (
    <div
      data-slot="year-month-selector-root"
      role="group"
      aria-label={ariaLabel}
      className={cn('inline-flex items-center gap-0.5', className)}
      {...props}
    >
      <IconButton
        type="button"
        variant="ghost"
        size="sm"
        shape="rounded"
        data-slot="year-month-selector-prev-month"
        aria-label="이전 달"
        disabled={disabled}
        onClick={() => stepMonth(-1)}
      >
        {createIconElement(ChevronLeft, 'sm')}
      </IconButton>

      {isSheet ? (
        <button
          type="button"
          data-slot="year-month-selector-trigger"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          className={cn(
            'inline-flex min-w-24 items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium tabular-nums',
            'text-fg transition-colors hover:bg-secondary/60',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          onClick={() => handleOpen(!isOpen)}
        >
          {label}
        </button>
      ) : (
        <AnchorContextSurface
          layout="inline"
          open={isOpen}
          onOpenChange={handleOpen}
          portaled
          panelVariant="list"
          panelScrollHint={false}
          panelRole="dialog"
          trapFocus
          panelAriaModal
          panelAriaLabel={ariaLabel}
          panelClassName="w-[min(100%,16rem)] overflow-hidden p-0"
          panel={wheel}
          surface={
            <button
              type="button"
              data-slot="year-month-selector-trigger"
              disabled={disabled}
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              aria-label={`${ariaLabel}, ${label}`}
              className={cn(
                'inline-flex min-w-24 items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium tabular-nums',
                'text-fg transition-colors hover:bg-secondary/60',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                disabled && 'cursor-not-allowed opacity-50',
              )}
              onClick={() => handleOpen(!isOpen)}
            >
              {label}
            </button>
          }
        />
      )}

      <IconButton
        type="button"
        variant="ghost"
        size="sm"
        shape="rounded"
        data-slot="year-month-selector-next-month"
        aria-label="다음 달"
        disabled={disabled}
        onClick={() => stepMonth(1)}
      >
        <ChevronRightIcon />
      </IconButton>

      {sheetPortal}
    </div>
  )
}

export { YearMonthSelector }
export type { YearMonthSelectorProps }
