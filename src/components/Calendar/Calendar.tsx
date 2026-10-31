'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useInteractionContext } from '@/primitives/interaction/useInteractionContext'
import { getCalendarDays, isSameDay } from '@/utils/calendarDates'
import { cn } from '@/utils/cn'

const calendarHeaderVariants = cva('flex items-center justify-between', {
  variants: {
    density: {
      compact: 'mb-2',
      default: 'mb-3',
      loose: 'mb-4',
    },
  },
  defaultVariants: { density: 'default' },
})

const calendarTitleVariants = cva('font-semibold tabular-nums', {
  variants: {
    density: {
      compact: 'text-xs',
      default: 'text-sm',
      loose: 'text-base',
    },
  },
  defaultVariants: { density: 'default' },
})

const calendarWeekdayRowVariants = cva('grid grid-cols-7', {
  variants: {
    density: {
      compact: 'mb-0.5',
      default: 'mb-1',
      loose: 'mb-1.5',
    },
  },
  defaultVariants: { density: 'default' },
})

const calendarWeekdayCellVariants = cva(
  'flex items-center justify-center font-medium text-fg-muted',
  {
    variants: {
      density: {
        compact: 'h-7 text-[0.625rem]',
        default: 'h-8 text-xs',
        loose: 'h-10 text-sm',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const calendarDayGridVariants = cva('', {
  variants: {
    density: {
      compact: '',
      default: '',
      loose: '',
    },
  },
  defaultVariants: { density: 'default' },
})

const calendarDayCellVariants = cva(
  [
    'relative flex w-full items-center justify-center rounded-md transition-colors',
    'focus-visible:outline-none',
  ],
  {
    variants: {
      density: {
        compact: 'h-7 text-xs',
        default: 'h-8 text-sm',
        loose: 'h-10 text-base',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const navBtnVariants = cva(
  [
    'flex items-center justify-center rounded-md text-fg-muted transition-colors',
    'hover:bg-surface hover:text-fg',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
  ],
  {
    variants: {
      density: {
        compact: 'h-6 w-6',
        default: 'h-7 w-7',
        loose: 'h-8 w-8',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const todayDotVariants = cva('absolute left-1/2 -translate-x-1/2 rounded-full bg-primary', {
  variants: {
    density: {
      compact: 'bottom-0.5 h-0.5 w-0.5',
      default: 'bottom-1 h-1 w-1',
      loose: 'bottom-1.5 h-1.5 w-1.5',
    },
  },
  defaultVariants: { density: 'default' },
})

const navIconVariants = cva('', {
  variants: {
    density: {
      compact: 'h-3.5 w-3.5',
      default: 'h-4 w-4',
      loose: 'h-[1.125rem] w-[1.125rem]',
    },
  },
  defaultVariants: { density: 'default' },
})

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = [
  '1월',
  '2월',
  '3월',
  '4월',
  '5월',
  '6월',
  '7월',
  '8월',
  '9월',
  '10월',
  '11월',
  '12월',
]

// ─── Types ────────────────────────────────────────────────────────────────────

type CalendarProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> &
  Pick<VariantProps<typeof calendarHeaderVariants>, 'density'> & {
    /** Currently selected date (controlled) */
    value?: Date | null
    /** Uncontrolled: initially selected date */
    defaultValue?: Date | null
    /** Called when a day is clicked */
    onChange?: (date: Date) => void

    /** Controlled: which month/year is displayed */
    month?: Date
    /** Called when month navigation changes the view */
    onMonthChange?: (month: Date) => void
    /** Uncontrolled: initial displayed month (defaults to value or today) */
    defaultMonth?: Date

    /** Highlight today with a dot indicator. Default: true */
    showToday?: boolean

    min?: Date
    max?: Date
  }

// ─── Component ────────────────────────────────────────────────────────────────

function Calendar({
  className,
  value,
  defaultValue,
  onChange,
  month: controlledMonth,
  onMonthChange,
  defaultMonth,
  showToday = true,
  min,
  max,
  density,
  autoFocus = false,
  ...props
}: CalendarProps) {
  const today = new Date()
  const d = density ?? 'default'
  const rootRef = useRef<HTMLDivElement>(null)
  // 방향키 더블프레스 감지용 (좌/우 연타 → 월, 상/하 연타 → 년도)
  const arrowBurstRef = useRef<{ type: string; at: number }>({ type: '', at: 0 })
  // 방향키 이동 후 새 tab-stop 셀로 DOM 포커스를 옮기기 위한 플래그
  const moveFocusRef = useRef(false)

  const isValueControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<Date | null>(defaultValue ?? null)
  const selectedValue = isValueControlled ? value : internalValue

  const [internalMonth, setInternalMonth] = useState<Date>(
    () =>
      controlledMonth ?? defaultMonth ?? (selectedValue instanceof Date ? selectedValue : today),
  )

  const viewDate = controlledMonth ?? internalMonth
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  function navigate(deltaMonths: number) {
    const next = new Date(viewYear, viewMonth + deltaMonths, 1)
    if (controlledMonth !== undefined) {
      onMonthChange?.(next)
    } else {
      setInternalMonth(next)
      onMonthChange?.(next)
    }
  }

  /** 같은 방향 화살표를 350ms 내 연타했는지 — 더블프레스(월/년도 이동) 판정 */
  function isArrowDoublePress(type: string): boolean {
    const b = arrowBurstRef.current
    const now = Date.now()
    const isDouble = b.type === type && now - b.at < 350
    arrowBurstRef.current = isDouble ? { type: '', at: 0 } : { type, at: now }
    return isDouble
  }

  function isDisabled(day: Date) {
    if (min && day < new Date(min.getFullYear(), min.getMonth(), min.getDate())) return true
    if (max && day > new Date(max.getFullYear(), max.getMonth(), max.getDate())) return true
    return false
  }

  const days = getCalendarDays(viewYear, viewMonth)
  const weeks = useMemo(() => {
    const rows: (Date | null)[][] = []
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7))
    }
    return rows
  }, [days])

  const flatCells = useMemo(() => weeks.flat(), [weeks])
  const flatCellsRef = useRef(flatCells)
  flatCellsRef.current = flatCells
  const focusedIndexRef = useRef(0)

  function handleDayActivate(day: Date) {
    if (isDisabled(day)) return
    if (!isValueControlled) setInternalValue(day)
    onChange?.(day)
  }

  const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
    kind: 'grid',
    itemCount: flatCells.length,
    onIntent: (intent) => {
      const cells = flatCellsRef.current
      const currentIdx = focusedIndexRef.current

      // 방향 이동 계열은 이동 후 DOM 포커스도 새 셀로 옮긴다 (포커스 링이 따라가도록)
      if (intent.type.startsWith('nav.')) moveFocusRef.current = true

      function findNonNull(from: number, dir: 1 | -1): number | null {
        let i = from
        while (i >= 0 && i < cells.length) {
          const cell = cells[i]
          if (cell !== null && !isDisabled(cell)) return i
          i += dir
        }
        return null
      }

      switch (intent.type) {
        case 'nav.right': {
          if (isArrowDoublePress('nav.right')) {
            navigate(1) // 우 연타 → 다음 달
            return true
          }
          const next = findNonNull(currentIdx + 1, 1)
          if (next !== null) {
            setFocusedIndex(next)
          } else if (currentIdx % 7 === 6 || currentIdx === cells.length - 1) {
            navigate(1)
          }
          return true
        }
        case 'nav.left': {
          if (isArrowDoublePress('nav.left')) {
            navigate(-1) // 좌 연타 → 이전 달
            return true
          }
          const prev = findNonNull(currentIdx - 1, -1)
          if (prev !== null) {
            setFocusedIndex(prev)
          } else if (currentIdx % 7 === 0) {
            navigate(-1)
          }
          return true
        }
        case 'nav.down': {
          if (isArrowDoublePress('nav.down')) {
            navigate(12) // 하 연타 → 다음 연도
            return true
          }
          const target = currentIdx + 7
          if (target < cells.length && cells[target] !== null && !isDisabled(cells[target]!)) {
            setFocusedIndex(target)
          } else {
            navigate(1)
          }
          return true
        }
        case 'nav.up': {
          if (isArrowDoublePress('nav.up')) {
            navigate(-12) // 상 연타 → 이전 연도
            return true
          }
          const target = currentIdx - 7
          if (target >= 0 && cells[target] !== null && !isDisabled(cells[target]!)) {
            setFocusedIndex(target)
          } else {
            navigate(-1)
          }
          return true
        }
        case 'nav.first': {
          const first = findNonNull(0, 1)
          if (first !== null) setFocusedIndex(first)
          return true
        }
        case 'nav.last': {
          const last = findNonNull(cells.length - 1, -1)
          if (last !== null) setFocusedIndex(last)
          return true
        }
        case 'activate': {
          const date = cells[currentIdx]
          if (date) handleDayActivate(date)
          return true
        }
        default:
          return false
      }
    },
  })

  focusedIndexRef.current = focusedIndex

  useEffect(() => {
    const cells = flatCells
    let target = -1
    if (selectedValue instanceof Date) {
      const idx = cells.findIndex((day) => day && isSameDay(day, selectedValue))
      if (idx >= 0) target = idx
    }
    if (target < 0) {
      const todayIdx = cells.findIndex((day) => day && isSameDay(day, today))
      if (todayIdx >= 0) target = todayIdx
    }
    if (target < 0) {
      target = cells.findIndex((day) => day !== null && !isDisabled(day))
    }
    if (target >= 0) setFocusedIndex(target)
  }, [viewYear, viewMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  // 방향키 이동 후 새 tab-stop 셀로 DOM 포커스 이동 (interaction context 는 tabindex 만 갱신하므로 보완)
  useEffect(() => {
    if (!moveFocusRef.current) return
    moveFocusRef.current = false
    rootRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')?.focus()
  }, [focusedIndex, viewYear, viewMonth])

  // autoFocus: 마운트 시 그리드의 tab-stop 날짜 셀에 포커스 → 팝오버 열자마자 방향키 조작 가능.
  // 팝오버 마운트/포커스트랩 타이밍이 불안정해 rAF + setTimeout(안전망) 둘 다 시도한다.
  useEffect(() => {
    if (!autoFocus) return
    const focusGridCell = () => {
      const cell =
        rootRef.current?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]') ??
        rootRef.current?.querySelector<HTMLElement>(
          '[role="gridcell"][tabindex]:not([aria-hidden="true"])',
        )
      if (cell && document.activeElement !== cell) cell.focus()
    }
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(focusGridCell)
    })
    const timer = setTimeout(focusGridCell, 80)
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      clearTimeout(timer)
    }
  }, [autoFocus])

  return (
    <div ref={rootRef} className={cn('w-full select-none', className)} {...props}>
      {/* ── Navigation header ── */}
      <div className={calendarHeaderVariants({ density: d })}>
        <div className="flex items-center">
          <NavBtn density={d} onClick={() => navigate(-12)} aria-label="이전 연도">
            <DoubleChevronLeft className={navIconVariants({ density: d })} />
          </NavBtn>
          <NavBtn density={d} onClick={() => navigate(-1)} aria-label="이전 달">
            <ChevronLeft className={navIconVariants({ density: d })} />
          </NavBtn>
        </div>

        <span className={calendarTitleVariants({ density: d })}>
          {viewYear}년 {MONTH_NAMES[viewMonth]}
        </span>

        <div className="flex items-center">
          <NavBtn density={d} onClick={() => navigate(1)} aria-label="다음 달">
            <ChevronRight className={navIconVariants({ density: d })} />
          </NavBtn>
          <NavBtn density={d} onClick={() => navigate(12)} aria-label="다음 연도">
            <DoubleChevronRight className={navIconVariants({ density: d })} />
          </NavBtn>
        </div>
      </div>

      {/* ── Weekday headers ── */}
      <div className={calendarWeekdayRowVariants({ density: d })} role="row" aria-label="요일">
        {WEEKDAYS.map((wd) => (
          <span
            key={wd}
            role="columnheader"
            className={calendarWeekdayCellVariants({ density: d })}
          >
            {wd}
          </span>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div
        {...contextProps}
        role="grid"
        aria-label="월 달력"
        className={calendarDayGridVariants({ density: d })}
      >
        {weeks.map((week, wi) => (
          <div key={wi} role="row" className="grid grid-cols-7">
            {week.map((day, di) => {
              const flatIndex = wi * 7 + di

              if (!day) {
                return (
                  <div
                    key={`empty-${wi}-${di}`}
                    role="gridcell"
                    aria-hidden="true"
                    tabIndex={-1}
                    className={calendarDayCellVariants({ density: d })}
                  />
                )
              }

              const selected = selectedValue instanceof Date && isSameDay(day, selectedValue)
              const isToday = showToday && isSameDay(day, today)
              const disabled = isDisabled(day)
              const itemProps = getItemProps(flatIndex)
              // 키보드 이동 위치(tab-stop)를 항상 보이게 — programmatic focus 는 :focus-visible 를
              // 트리거하지 않으므로 focusedIndex 기준으로 ring 을 직접 표시.
              const focused = flatIndex === focusedIndex

              return (
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard handled by grid container
                <div
                  key={day.toISOString()}
                  role="gridcell"
                  aria-label={day.toLocaleDateString()}
                  aria-selected={selected}
                  aria-current={isToday ? 'date' : undefined}
                  aria-disabled={disabled || undefined}
                  tabIndex={disabled ? -1 : itemProps.tabIndex}
                  onClick={disabled ? undefined : () => handleDayActivate(day)}
                  onFocus={itemProps.onFocus}
                  className={cn(
                    calendarDayCellVariants({ density: d }),
                    !selected && !disabled && 'cursor-pointer hover:bg-surface',
                    selected && 'cursor-pointer bg-primary font-medium text-primary-fg',
                    disabled && 'cursor-not-allowed opacity-40',
                    focused && !disabled && 'ring-2 ring-primary ring-inset',
                  )}
                >
                  {day.getDate()}

                  {isToday && !selected && (
                    <span aria-hidden="true" className={todayDotVariants({ density: d })} />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Internal sub-components ──────────────────────────────────────────────────

type NavDensity = NonNullable<VariantProps<typeof navBtnVariants>['density']>

function NavBtn({
  density,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { density: NavDensity }) {
  return <button type="button" className={cn(navBtnVariants({ density }), className)} {...props} />
}

const ChevronLeft = ({ className }: { className?: string }) => (
  <svg
    className={cn('h-4 w-4', className)}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10 4l-4 4 4 4" />
  </svg>
)
const ChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={cn('h-4 w-4', className)}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 4l4 4-4 4" />
  </svg>
)
const DoubleChevronLeft = ({ className }: { className?: string }) => (
  <svg
    className={cn('h-4 w-4', className)}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 4L4 8l4 4M12 4L8 8l4 4" />
  </svg>
)
const DoubleChevronRight = ({ className }: { className?: string }) => (
  <svg
    className={cn('h-4 w-4', className)}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4l4 4-4 4M8 4l4 4-4 4" />
  </svg>
)

export { Calendar }
export type { CalendarProps }
