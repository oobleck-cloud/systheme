'use client'

import { type VariantProps } from 'class-variance-authority'
import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { Calendar, type CalendarProps } from '@/components/Calendar'
import { inputVariants } from '@/components/Input'
import { spring } from '@/foundations/motionTokens'
import {
  ANCHOR_PANEL_FALLBACK_SIZE_PX,
  computeAnchorPanelPosition,
} from '@/primitives/anchorPanelPosition'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { MotionPanel } from '@/primitives/panelMotion'
import { cn } from '@/utils/cn'

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}. ${m}. ${day}.`
}

type DatePickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'size'> &
  Pick<CalendarProps, 'showToday' | 'min' | 'max' | 'density'> & {
    /** Controlled: 현재 선택된 날짜. 미제공 시 defaultValue로 내부 관리됩니다. */
    value?: Date | null
    /** Uncontrolled 초기 선택 날짜 (기본값: null) */
    defaultValue?: Date | null
    onChange?: (date: Date | null) => void
    placeholder?: string
    disabled?: boolean
  }

function DatePicker({
  className,
  variant,
  size = 'md',
  value: valueProp,
  defaultValue = null,
  onChange,
  placeholder = '날짜 선택',
  disabled = false,
  showToday,
  min,
  max,
  density = 'default',
  ...props
}: DatePickerProps) {
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue)
  const value = useMemo(
    () => (isControlled ? valueProp : internalValue),
    [isControlled, valueProp, internalValue],
  )
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const popoverId = useId()

  const updatePos = useCallback(() => {
    const trigger = rootRef.current
    const panelEl = panelRef.current
    if (!trigger) return
    const panelWidth = panelEl?.offsetWidth ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.width
    const panelHeight = panelEl?.offsetHeight ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.height
    setPanelPos(
      computeAnchorPanelPosition({
        anchorRect: trigger.getBoundingClientRect(),
        panelWidth,
        panelHeight,
      }),
    )
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePos()
  }, [isOpen, updatePos])

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [isOpen, updatePos])

  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isOpen])

  useDismissOnEscape(isOpen, () => setIsOpen(false))
  useFocusTrap(panelRef, isOpen)

  return (
    <div ref={rootRef} className={cn('relative w-full', className)} {...props}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          inputVariants({ variant, size }),
          'flex cursor-pointer items-center justify-between gap-2 text-left',
          !value && 'text-fg-muted',
        )}
      >
        <span>{value ? formatDate(value) : placeholder}</span>
        <span aria-hidden="true" className="flex shrink-0 items-center text-fg-muted">
          <CalendarIcon />
        </span>
      </button>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <MotionPanel
              ref={panelRef}
              id={popoverId}
              role="dialog"
              aria-modal="true"
              aria-label="날짜 선택기"
              position="fixed"
              offset="none"
              className={cn(
                'z-[1000]',
                density === 'compact' && 'w-64 p-2',
                density === 'default' && 'w-72 p-3',
                density === 'loose' && 'w-80 p-4',
              )}
              style={{ top: panelPos.top, left: panelPos.left, transformOrigin: 'top' }}
              initial={{ opacity: 0, scaleY: 0.92, y: -4 }}
              animate={{ opacity: 1, scaleY: 1, y: 0, transition: spring.standard }}
              exit={{ opacity: 0, scaleY: 0.92, y: -4, transition: spring.standard }}
            >
              <Calendar
                value={value}
                onChange={(date) => {
                  if (!isControlled) setInternalValue(date)
                  onChange?.(date)
                  setIsOpen(false)
                }}
                defaultMonth={value instanceof Date ? value : undefined}
                showToday={showToday}
                min={min}
                max={max}
                density={density}
              />
            </MotionPanel>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  )
}

const CalendarIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="3" width="12" height="11" rx="1.5" />
    <path d="M5 1.5v3M11 1.5v3M2 7h12" />
  </svg>
)

export { DatePicker }
export type { DatePickerProps }
