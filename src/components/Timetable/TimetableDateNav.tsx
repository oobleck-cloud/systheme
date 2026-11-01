'use client'

import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { formatTimetableDate, stepCursorDate } from './timetable-utils'

import { Calendar } from '@/components/Calendar'
import { IconButton } from '@/components/IconButton'
import {
  anchorPopoverRootClassName,
  useDismissOnEscape,
  useFocusTrap,
} from '@/primitives/anchorPopover'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
import { useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'

function ChevronLeftIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 3L6 8l4 5" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 3l4 5-4 5" />
    </svg>
  )
}

function ChevronDownSmallIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')}
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 4l4 4 4-4" />
    </svg>
  )
}

type TimetableDateNavProps = {
  cursorDate: Date
  datePickerOpen?: boolean
  onDateChange: (next: Date) => void
  /** 이전·다음 = 하루. 넘기지 않으면 여기서 직접 하루를 옮긴다. */
  onStepDate?: (direction: -1 | 1) => void
  onDatePickerOpenChange?: (open: boolean) => void
  /** 날짜 오른쪽에 붙는 표식 (예: "고객 희망일" 배지) */
  trailing?: React.ReactNode
  disabled?: boolean
  className?: string
}

function TimetableDateNav({
  cursorDate,
  datePickerOpen: datePickerOpenControlled,
  onDateChange,
  onStepDate,
  onDatePickerOpenChange,
  trailing,
  disabled = false,
  className,
}: TimetableDateNavProps) {
  const portalRoot = usePortalRoot()
  const stepDate = (direction: -1 | 1) =>
    onStepDate ? onStepDate(direction) : onDateChange(stepCursorDate(cursorDate, direction))

  const [innerOpen, setInnerOpen] = useState(false)
  const isOpen = datePickerOpenControlled ?? innerOpen
  const setOpen = (v: boolean) => {
    if (datePickerOpenControlled === undefined) setInnerOpen(v)
    onDatePickerOpenChange?.(v)
  }

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open: isOpen,
    anchorRef: containerRef,
    panelRef,
    placement: 'below',
    onPointerDownOutside: () => setOpen(false),
  })
  useDismissOnEscape(isOpen, () => setOpen(false))
  useFocusTrap(panelRef, isOpen)

  return (
    <div
      data-slot="timetable-date-nav"
      className={cn('flex min-w-0 items-center gap-0.5', className)}
    >
      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        aria-label="이전 날짜"
        disabled={disabled}
        onClick={() => stepDate(-1)}
      >
        <ChevronLeftIcon />
      </IconButton>

      <div ref={containerRef} className={cn(anchorPopoverRootClassName, 'relative')}>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={popoverId}
          onClick={() => setOpen(!isOpen)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1',
            'text-density-cell font-medium text-fg tabular-nums',
            'hover:bg-overlay focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            'transition-colors disabled:cursor-not-allowed disabled:opacity-50',
          )}
        >
          {formatTimetableDate(cursorDate)}
          <ChevronDownSmallIcon open={isOpen} />
        </button>

        {mounted &&
          createPortal(
            isOpen ? (
              <Panel
                ref={panelRef}
                id={popoverId}
                role="dialog"
                aria-modal="true"
                aria-label="날짜 선택"
                position="fixed"
                offset="none"
                className={cn('w-72 p-3', positionClassName)}
                style={panelStyle}
              >
                <Calendar
                  autoFocus
                  value={cursorDate}
                  density="default"
                  onChange={(d) => {
                    onDateChange(d)
                    setOpen(false)
                  }}
                  defaultMonth={cursorDate}
                />
              </Panel>
            ) : null,
            portalRoot,
          )}
      </div>

      <IconButton
        type="button"
        size="sm"
        variant="ghost"
        aria-label="다음 날짜"
        disabled={disabled}
        onClick={() => stepDate(1)}
      >
        <ChevronRightIcon />
      </IconButton>

      {trailing ? (
        <span data-slot="date-nav-trailing" className="ml-1.5 flex shrink-0 items-center">
          {trailing}
        </span>
      ) : null}
    </div>
  )
}

export { TimetableDateNav }
export type { TimetableDateNavProps }
