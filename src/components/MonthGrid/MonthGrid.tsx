'use client'

import { cva } from 'class-variance-authority'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'

import { useInteractionContext } from '@/primitives/interaction'
import { getCalendarDays, groupCalendarDaysIntoWeeks, isSameDay } from '@/utils/calendarDates'
import { cn } from '@/utils/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MonthGridDayKind = 'default' | 'weekend' | 'holiday' | 'warning' | 'other-month'

export type MonthGridDayMeta = {
  /** Override the auto-detected kind for a day. */
  kind?: MonthGridDayKind
  /** Short holiday name shown below the date number. */
  holidayLabel?: string
}

export type MonthGridDensity = 'compact' | 'default' | 'comfortable'

type MonthGridProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  /** Controlled: which month is displayed. 미제공 시 defaultMonth로 내부 관리됩니다. */
  month?: Date
  /** Uncontrolled initial month. Defaults to today's month. */
  defaultMonth?: Date
  /** 월이 변경될 때 호출됩니다 (내장 nav 또는 외부 controllerRegion에서 모두 호출). */
  onMonthChange?: (month: Date) => void

  /** Controlled: selected date. */
  selectedDate?: Date | null
  defaultSelectedDate?: Date | null
  onSelectedDateChange?: (date: Date | null) => void
  /** `'none'` — cells are non-interactive display-only divs. */
  selectionMode?: 'none' | 'single'
  /** Fired whenever a day cell is activated (click / Enter / Space). */
  onDayActivate?: (date: Date) => void

  /** Return metadata for a given date (kind override, holiday label). */
  getDayMeta?: (date: Date) => MonthGridDayMeta | undefined

  density?: MonthGridDensity

  /**
   * @slot 그리드 위에 렌더링되는 영역 (탐색 컨트롤, 필터 칩 등).
   * 미제공 시 내장 월 네비게이션(이전/다음 버튼 + 월 레이블)이 표시됩니다.
   * `false`를 넘기면 내장 nav도 숨길 수 있습니다.
   */
  controllerRegion?: React.ReactNode | false
  /**
   * @slot 각 날짜 셀 헤더 우측에 렌더링되는 장식 요소 (배지, 아이콘 등).
   * 날짜별 메타는 `getDayMeta`를 우선 검토하세요.
   */
  renderDayAdornments?: (date: Date) => React.ReactNode
  /**
   * @slot 날짜 헤더 아래 셀 내부에 렌더링되는 콘텐츠 (일정 칩, 수량 표시 등).
   * 날짜별 기본 메타데이터(종류·휴일명)는 `getDayMeta`로 선언형 처리하세요.
   */
  renderCellContent?: (date: Date, dayKind: MonthGridDayKind) => React.ReactNode
  /**
   * @slot 그리드 아래에 렌더링되는 영역 (요약, 범례 등).
   */
  footerRegion?: React.ReactNode

  /** Monday = 1, Sunday = 0 (default). */
  weekStartsOn?: 0 | 1
  /**
   * `square` — 셀을 정사각형으로 맞춥니다.
   * `squareFitBasis`로 크기 기준(뷰포트에 맞춤 vs 가로 최대)을 선택합니다.
   */
  fitCells?: 'default' | 'square'
  /**
   * 주 행의 높이를 무엇이 정하는가.
   *
   * - `fill`(기본): 그리드가 부모 높이를 채우고 행이 눌린다. 날짜당 내용이 한두 줄인 달력용.
   * - `content`: 행이 내용만큼 높아지고 넘치면 그리드가 스크롤한다. 하루에 여러 줄이
   *   들어가는 명단·일정 달력용 — `fill` 로 두면 내용이 **경고 없이 잘린다**.
   */
  rowSizing?: 'fill' | 'content'
  /**
   * `fitCells="square"` 일 때 셀 한 변 길이 계산 기준.
   * - `contain`(기본): 가로·세로 중 작은 쪽에 맞춰 패널 안에 전부 보임
   * - `width`: 가로 7열 기준 최대 정사각형 — 그리드가 세로로 길어지면 부모 스크롤
   */
  squareFitBasis?: 'contain' | 'width'
}

const WEEKDAYS_SUN = ['일', '월', '화', '수', '목', '금', '토'] as const
const WEEKDAYS_MON = ['월', '화', '수', '목', '금', '토', '일'] as const

// ─── CVA Variants ─────────────────────────────────────────────────────────────

const weekdayCellVariants = cva(
  'flex items-center justify-center font-medium text-fg-muted select-none',
  {
    variants: {
      density: {
        compact: 'h-6 text-[0.625rem]',
        default: 'h-7 text-xs',
        comfortable: 'h-8 text-sm',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const dateLabelContainerVariants = cva('flex items-start justify-between gap-1 shrink-0', {
  variants: {
    density: {
      compact: 'p-1',
      default: 'p-1.5',
      comfortable: 'p-2',
    },
    fitCells: {
      default: '',
      square: 'p-0',
    },
  },
  defaultVariants: { density: 'default', fitCells: 'default' },
})

const dateNumberVariants = cva(
  'inline-flex items-center justify-center font-medium tabular-nums leading-none',
  {
    variants: {
      density: {
        compact: 'size-4 text-[0.625rem]',
        default: 'size-5 text-xs',
        comfortable: 'size-6 text-sm',
      },
      isToday: {
        true: 'rounded-full bg-primary text-primary-fg',
        false: '',
      },
    },
    defaultVariants: { density: 'default', isToday: false },
  },
)

const holidayLabelVariants = cva('truncate font-normal text-error-text leading-tight', {
  variants: {
    density: {
      compact: 'text-[0.5rem]',
      default: 'text-[0.5625rem]',
      comfortable: 'text-xs',
    },
    visible: {
      true: '',
      false: 'sr-only',
    },
  },
  defaultVariants: { density: 'default', visible: false },
})

const dayCellOuterVariants = cva('min-h-0 min-w-0', {
  variants: {
    fitCells: {
      default: 'relative',
      square: 'size-full',
    },
  },
  defaultVariants: { fitCells: 'default' },
})

const dayCellInnerVariants = cva('flex flex-col outline-none transition-colors', {
  variants: {
    fitCells: {
      default: 'h-full w-full',
      square: 'size-full gap-0.5 overflow-hidden',
    },
    density: {
      compact: '',
      default: '',
      comfortable: '',
    },
  },
  compoundVariants: [
    { fitCells: 'square', density: 'compact', class: 'p-1' },
    { fitCells: 'square', density: 'default', class: 'p-1' },
    { fitCells: 'square', density: 'comfortable', class: 'p-1.5' },
  ],
  defaultVariants: { fitCells: 'default', density: 'default' },
})

const cellContentVariants = cva('min-h-0 flex-1', {
  variants: {
    /** `content` 행에서는 잘라내지 않는다 — 그리드 쪽이 스크롤을 맡는다. */
    overflow: {
      hidden: 'overflow-hidden',
      visible: 'overflow-visible',
    },
    density: {
      compact: 'p-0.5',
      default: 'p-1',
      comfortable: 'p-1.5',
    },
    fitCells: {
      default: '',
      square: 'p-0',
    },
  },
  defaultVariants: { density: 'default', fitCells: 'default', overflow: 'hidden' },
})

const SQUARE_GRID_GAP_PX = 4

function useSquareCellSize(
  enabled: boolean,
  rowCount: number,
  basis: 'contain' | 'width',
): { measureRef: RefObject<HTMLDivElement | null>; cellSize: number | null } {
  const measureRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (!enabled) {
      setCellSize(null)
      return
    }

    const element = measureRef.current
    if (!element) return

    const measure = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width <= 0) return

      const horizontalGaps = 6 * SQUARE_GRID_GAP_PX
      const fromWidth = (width - horizontalGaps) / 7
      if (basis === 'width') {
        setCellSize(Math.floor(fromWidth))
        return
      }

      if (height <= 0) return
      const verticalGaps = (rowCount - 1) * SQUARE_GRID_GAP_PX
      const fromHeight = (height - verticalGaps) / rowCount
      setCellSize(Math.floor(Math.min(fromWidth, fromHeight)))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [enabled, rowCount, basis])

  return { measureRef, cellSize }
}

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
] as const

function addMonths(date: Date, delta: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + delta)
  return d
}

function MonthGrid({
  month: controlledMonth,
  defaultMonth,
  onMonthChange,
  selectedDate: controlledSelected,
  defaultSelectedDate,
  onSelectedDateChange,
  selectionMode = 'single',
  onDayActivate,
  getDayMeta,
  density = 'default',
  controllerRegion,
  renderDayAdornments,
  renderCellContent,
  footerRegion,
  weekStartsOn = 0,
  fitCells = 'default',
  rowSizing = 'fill',
  squareFitBasis = 'contain',
  className,
  ...props
}: MonthGridProps) {
  const today = new Date()
  const weekdays = weekStartsOn === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN
  /** 정사각 모드는 셀 크기를 스스로 계산하므로 행 높이를 내용에 맡길 수 없다. */
  const contentRows = rowSizing === 'content' && fitCells !== 'square'

  const isMonthControlled = controlledMonth !== undefined
  const [internalMonth, setInternalMonth] = useState<Date>(() => defaultMonth ?? today)
  const viewDate = isMonthControlled ? controlledMonth : internalMonth
  const viewYear = viewDate.getFullYear()
  const viewMonth = viewDate.getMonth()

  function handleMonthStep(delta: number) {
    const next = addMonths(viewDate, delta)
    if (!isMonthControlled) setInternalMonth(next)
    onMonthChange?.(next)
  }

  const [internalSelected, setInternalSelected] = useState<Date | null>(defaultSelectedDate ?? null)
  const selected = controlledSelected !== undefined ? controlledSelected : internalSelected

  const days = getCalendarDays(viewYear, viewMonth, weekStartsOn)
  const weeks = groupCalendarDaysIntoWeeks(days)
  const interactive = selectionMode !== 'none'
  const squareFit = fitCells === 'square'
  const squareFitFromWidth = squareFit && squareFitBasis === 'width'
  const { measureRef: squareMeasureRef, cellSize: squareCellSize } = useSquareCellSize(
    squareFit,
    weeks.length,
    squareFitBasis,
  )

  // ─── Flat cell list for 2D navigation ─────────────────────────────────────
  const flatCells = useMemo(() => weeks.flat(), [weeks])
  const flatCellsRef = useRef(flatCells)
  flatCellsRef.current = flatCells
  const focusedIndexRef = useRef(0)

  const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
    kind: 'grid',
    itemCount: flatCells.length,
    onIntent: (intent) => {
      if (!interactive) return false
      const cells = flatCellsRef.current
      const currentIdx = focusedIndexRef.current

      function findNonNull(from: number, dir: 1 | -1): number | null {
        let i = from
        while (i >= 0 && i < cells.length) {
          if (cells[i] !== null) return i
          i += dir
        }
        return null
      }

      switch (intent.type) {
        case 'nav.right': {
          const next = findNonNull(currentIdx + 1, 1)
          if (next !== null) setFocusedIndex(next)
          return true
        }
        case 'nav.left': {
          const prev = findNonNull(currentIdx - 1, -1)
          if (prev !== null) setFocusedIndex(prev)
          return true
        }
        case 'nav.down': {
          const target = currentIdx + 7
          if (target < cells.length && cells[target] !== null) setFocusedIndex(target)
          return true
        }
        case 'nav.up': {
          const target = currentIdx - 7
          if (target >= 0 && cells[target] !== null) setFocusedIndex(target)
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

  // Initialize focusedIndex when month changes or on mount
  useEffect(() => {
    const cells = flatCells
    let target = -1
    if (selected) {
      const idx = cells.findIndex((d) => d && isSameDay(d, selected))
      if (idx >= 0) target = idx
    }
    if (target < 0) {
      const todayIdx = cells.findIndex((d) => d && isSameDay(d, today))
      if (todayIdx >= 0) target = todayIdx
    }
    if (target < 0) {
      target = cells.findIndex((d) => d !== null)
    }
    if (target >= 0) setFocusedIndex(target)
  }, [viewYear, viewMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDayActivate(date: Date) {
    if (!interactive) return
    const isAlreadySelected = selected != null && isSameDay(selected, date)
    const next = isAlreadySelected ? null : date
    if (controlledSelected === undefined) setInternalSelected(next)
    onSelectedDateChange?.(next)
    onDayActivate?.(date)
  }

  const squareGridStyle = squareFit
    ? ({
        '--ds-month-grid-row-count': weeks.length,
        ...(squareCellSize != null ? { '--ds-month-grid-cell-size': `${squareCellSize}px` } : {}),
      } as React.CSSProperties)
    : undefined

  const squareGridColumnsClass =
    squareCellSize != null
      ? '[grid-template-columns:repeat(7,var(--ds-month-grid-cell-size))]'
      : 'w-full grid-cols-7'

  function renderWeekdayHeaders() {
    return weekdays.map((wd, idx) => (
      <span
        key={wd}
        role="columnheader"
        aria-label={wd}
        className={cn(
          weekdayCellVariants({ density }),
          squareFit && 'h-6 px-1 text-center text-[0.625rem]',
          !squareFit && wd === '일' && 'text-error-text',
          !squareFit && wd === '토' && 'text-info-text',
        )}
      >
        {wd}
      </span>
    ))
  }

  return (
    <div
      data-slot="month-grid-root"
      data-density={density}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-border bg-background text-fg',
        squareFit && !squareFitFromWidth && 'min-h-0 min-w-0 w-full',
        squareFitFromWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {/* ── controller-region slot (내장 nav 또는 외부 슬롯) ── */}
      {controllerRegion !== false && (
        <div data-slot="month-grid-controller-region" className="shrink-0 border-b border-border">
          {controllerRegion ?? (
            <div
              data-slot="month-grid-month-nav"
              className="flex items-center justify-between px-3 py-2"
            >
              <button
                type="button"
                data-slot="month-grid-month-prev"
                aria-label="이전 달"
                onClick={() => handleMonthStep(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M10 12L6 8l4-4" />
                </svg>
              </button>
              <span
                data-slot="month-grid-month-label"
                className="text-sm font-medium tabular-nums text-fg"
              >
                {viewYear}년 {MONTH_NAMES[viewMonth]}
              </span>
              <button
                type="button"
                data-slot="month-grid-month-next"
                aria-label="다음 달"
                onClick={() => handleMonthStep(1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── grid-region ── */}
      <div
        ref={squareFit ? squareMeasureRef : undefined}
        data-slot="month-grid-grid-region"
        className={cn(
          'flex min-w-0 w-full flex-col',
          squareFitFromWidth ? 'shrink-0' : 'min-h-0 flex-1',
        )}
      >
        {/* Weekday header row */}
        <div
          role="row"
          aria-label="요일"
          data-slot="month-grid-weekdays"
          className={cn(
            'grid shrink-0',
            squareFit
              ? cn('mb-1 w-full min-w-0 gap-1', squareGridColumnsClass)
              : 'grid-cols-7 border-b border-border',
          )}
          style={squareFit ? squareGridStyle : undefined}
        >
          {renderWeekdayHeaders()}
        </div>

        {/* Day grid — square fit uses one grid so row heights stay equal */}
        <div
          {...contextProps}
          role="grid"
          aria-label="월 달력"
          data-slot="month-grid-day-grid"
          data-week-rows={weeks.length}
          className={cn(
            'flex-1',
            squareFit && 'grid w-full min-w-0 gap-1 content-start',
            squareFit && !squareFitFromWidth && 'min-h-0',
            squareFit && squareCellSize != null && squareGridColumnsClass,
            squareFit &&
              squareCellSize != null &&
              '[grid-template-rows:repeat(var(--ds-month-grid-row-count),var(--ds-month-grid-cell-size))]',
            squareFit && squareCellSize == null && 'grid-cols-7 auto-rows-auto',
            !squareFit && 'min-h-0',
            !squareFit && contentRows && 'overflow-y-auto',
          )}
          style={squareFit ? squareGridStyle : undefined}
        >
          {weeks.map((week, wi) => (
            <div
              key={wi}
              role="row"
              className={cn(
                squareFit ? 'contents' : 'grid grid-cols-7',
                !squareFit && wi < weeks.length - 1 && 'border-b border-border',
              )}
            >
              {week.map((date, di) => {
                const colKey = date ? date.toISOString() : `empty-${wi}-${di}`

                if (!date) {
                  return (
                    <div
                      key={colKey}
                      role="gridcell"
                      aria-hidden="true"
                      tabIndex={-1}
                      className={cn(
                        dayCellOuterVariants({ fitCells }),
                        !squareFit && 'bg-surface opacity-30',
                        !squareFit && di < 6 && 'border-r border-border',
                      )}
                    />
                  )
                }

                const meta = getDayMeta?.(date)
                const isToday = isSameDay(date, today)
                const isSelected = selected != null && isSameDay(selected, date)
                const dayIdx = date.getDay()

                const autoKind: MonthGridDayKind = meta?.holidayLabel
                  ? 'holiday'
                  : dayIdx === 0 || dayIdx === 6
                    ? 'weekend'
                    : 'default'
                const kind: MonthGridDayKind = meta?.kind ?? autoKind

                const cellToneClass = cn(
                  squareFit && 'rounded-lg border',
                  kind === 'default' &&
                    (squareFit ? 'border-border bg-background' : 'bg-background'),
                  kind === 'weekend' && (squareFit ? 'border-border bg-surface' : 'bg-surface'),
                  kind === 'holiday' &&
                    (squareFit ? 'border-border bg-background' : 'bg-background'),
                  kind === 'warning' &&
                    (squareFit
                      ? 'border-warning-border bg-background'
                      : // 격자가 이미 border-r·border-b 로 칸을 나눈다. 여기서 border 를 더하면
                        // 경고 칸 둘레에만 선이 두 줄로 겹친다 — 자리를 차지하지 않는 ring 을 쓴다.
                        'bg-background ring-1 ring-inset ring-warning-border'),
                  kind === 'other-month' && 'bg-background opacity-40',
                )

                const flatIndex = wi * 7 + di
                const itemProps = getItemProps(flatIndex)

                return (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard navigation handled by grid container via contextProps.onKeyDown (Enter/Space → activate intent bubbles up)
                  <div
                    key={colKey}
                    role="gridcell"
                    data-slot="month-grid-day-cell"
                    data-date={date.toISOString().slice(0, 10)}
                    data-day-kind={kind}
                    aria-selected={interactive ? isSelected : undefined}
                    aria-current={isToday ? 'date' : undefined}
                    tabIndex={interactive ? itemProps.tabIndex : -1}
                    onClick={interactive ? () => handleDayActivate(date) : undefined}
                    onFocus={itemProps.onFocus}
                    className={cn(
                      dayCellOuterVariants({ fitCells }),
                      !squareFit && di < 6 && 'border-r border-border',
                      !interactive && 'cursor-default',
                    )}
                  >
                    <div
                      className={cn(
                        dayCellInnerVariants({ fitCells, density }),
                        squareFit && squareCellSize == null && 'aspect-square w-full',
                        cellToneClass,
                        isSelected && 'ring-2 ring-primary ring-inset',
                        interactive && [
                          'cursor-pointer',
                          !isSelected &&
                            'hover:bg-surface/80 hover:ring-1 hover:ring-ring hover:ring-inset',
                          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                        ],
                      )}
                    >
                      {/* date-label: number + holiday label + adornments */}
                      <div
                        data-slot="month-grid-date-label"
                        className={dateLabelContainerVariants({
                          density,
                          fitCells: squareFit ? 'square' : 'default',
                        })}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span
                            data-slot="month-grid-date-number"
                            className={cn(
                              dateNumberVariants({ density, isToday }),
                              !isToday &&
                                (kind === 'holiday' || meta?.holidayLabel) &&
                                'text-error-text',
                              !isToday &&
                                kind === 'warning' &&
                                !meta?.holidayLabel &&
                                'text-warning-text',
                              !isToday && kind === 'default' && 'text-fg',
                              !isToday && kind === 'weekend' && 'text-fg-subtle',
                              !isToday && kind === 'other-month' && 'text-fg-muted',
                              !isToday && dayIdx === 0 && kind !== 'holiday' && 'text-error-text',
                              !isToday && dayIdx === 6 && kind !== 'holiday' && 'text-info-text',
                            )}
                          >
                            {date.getDate()}
                          </span>
                          {meta?.holidayLabel && (
                            <span
                              data-slot="month-grid-holiday-label"
                              className={holidayLabelVariants({ density, visible: false })}
                            >
                              {meta.holidayLabel}
                            </span>
                          )}
                        </div>

                        {/* day-adornments slot */}
                        {renderDayAdornments && (
                          <div
                            data-slot="month-grid-day-adornments"
                            className="shrink-0 flex items-start gap-0.5"
                          >
                            {renderDayAdornments(date)}
                          </div>
                        )}
                      </div>

                      {/* cell-content slot */}
                      {renderCellContent && (
                        <div
                          data-slot="month-grid-cell-content"
                          className={cellContentVariants({
                            density,
                            fitCells: squareFit ? 'square' : 'default',
                            overflow: contentRows ? 'visible' : 'hidden',
                          })}
                        >
                          {renderCellContent(date, kind)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── footer-region slot ── */}
      {footerRegion != null && (
        <div data-slot="month-grid-footer-region" className="shrink-0 border-t border-border">
          {footerRegion}
        </div>
      )}
    </div>
  )
}

MonthGrid.displayName = 'MonthGrid'

export { MonthGrid }
export type { MonthGridProps }
