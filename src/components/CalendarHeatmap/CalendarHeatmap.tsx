'use client'

import { scaleSequential, interpolateRgb, timeWeek, timeSunday, min, max } from 'd3'
import * as React from 'react'

import type { ChartMargin, CalendarEntry } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface CalendarHeatmapProps {
  data: CalendarEntry[]
  /** First date to show (inclusive, ISO string or Date) */
  startDate: string | Date
  /** Last date to show (inclusive, ISO string or Date) */
  endDate: string | Date
  title?: string
  description?: string
  /** Cell size in px */
  cellSize?: number
  /** Gap between cells in px */
  cellGap?: number
  formatValue?: (v: number) => string
  className?: string
  onDayClick?: (entry: CalendarEntry) => void
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function CalendarHeatmap({
  data,
  startDate,
  endDate,
  title,
  description,
  cellSize = 14,
  cellGap = 2,
  formatValue = String,
  className,
  onDayClick,
}: CalendarHeatmapProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  const start = new Date(startDate)
  const end = new Date(endDate)

  // How many weeks do we span?
  const weeks = Math.ceil(timeWeek.count(timeSunday.floor(start), end)) + 1
  const chartW = weeks * (cellSize + cellGap) + 30
  const chartH = 7 * (cellSize + cellGap) + 32

  const margin: ChartMargin = { top: 20, right: 8, bottom: 8, left: 24 }

  return (
    <ChartFrame
      title={title}
      description={description}
      height={chartH + margin.top + margin.bottom}
      margin={margin}
      tooltip={tooltip}
      empty={data.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <CalendarInner
          dims={dims}
          data={data}
          start={start}
          end={end}
          cellSize={cellSize}
          cellGap={cellGap}
          formatValue={formatValue}
          onDayClick={onDayClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

CalendarHeatmap.displayName = 'CalendarHeatmap'

function CalendarInner({
  dims,
  data,
  start,
  end,
  cellSize,
  cellGap,
  formatValue,
  onDayClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: CalendarEntry[]
  start: Date
  end: Date
  cellSize: number
  cellGap: number
  formatValue: (v: number) => string
  onDayClick?: (entry: CalendarEntry) => void
  onHover: (
    x: number,
    y: number,
    content: { title?: string; items: Array<{ label: string; value: string }> },
  ) => void
  onLeave: () => void
}) {
  const { margin } = dims

  const seqLow = readToken(CHART_TOKENS.seqLow, null)
  const seqHigh = readToken('--ds-chart-series-2', null)
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  const values = data.map((d) => d.value)
  const vMin = min(values) ?? 0
  const vMax = max(values) ?? 1
  const colorScale = scaleSequential()
    .domain([vMin, vMax])
    .interpolator(interpolateRgb(seqLow || '#f0fdf4', seqHigh || '#16a34a'))

  const dataMap = new Map(data.map((d) => [d.date, d]))
  const step = cellSize + cellGap

  // Generate all days in range
  const days: Date[] = []
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)
  const endMs = end.getTime()
  while (cursor.getTime() <= endMs) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  // Find the first Sunday on or before start
  const firstSunday = timeSunday.floor(start)

  const interactive = Boolean(onDayClick)

  type CellMeta = {
    isoDate: string
    entry: CalendarEntry | undefined
    weekOffset: number
    dayOfWeek: number
    cx: number
    cy: number
    color: string
  }

  const cellMetas: CellMeta[] = days.map((day) => {
    const isoDate = day.toISOString().slice(0, 10)
    const entry = dataMap.get(isoDate)
    const dayOfWeek = day.getDay()
    const weekOffset = Math.floor(
      (day.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    const cx = weekOffset * step
    const cy = dayOfWeek * step
    const color = entry ? colorScale(entry.value) : gridColor
    return { isoDate, entry, weekOffset, dayOfWeek, cx, cy, color }
  })

  const cellByCoord = new Map(cellMetas.map((c) => [`${c.weekOffset}-${c.dayOfWeek}`, c]))

  // Roving tabindex: only one active cell is the tab stop (defaults to the first cell with data).
  const firstActiveKey = (() => {
    const first = cellMetas.find((c) => c.entry)
    return first ? `${first.weekOffset}-${first.dayOfWeek}` : null
  })()
  const [focusedKey, setFocusedKey] = React.useState<string | null>(null)
  const activeTabKey = focusedKey && cellByCoord.has(focusedKey) ? focusedKey : firstActiveKey

  function handleGridKeyDown(e: React.KeyboardEvent<SVGGElement>) {
    if (!interactive) return
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return
    if (key === 'Enter' || key === ' ') return

    const current = document.activeElement as SVGElement
    const weekOffset = Number(current.getAttribute('data-week'))
    const dayOfWeek = Number(current.getAttribute('data-dow'))
    if (Number.isNaN(weekOffset) || Number.isNaN(dayOfWeek)) return

    e.preventDefault()
    let nextWeek = weekOffset
    let nextDay = dayOfWeek

    if (key === 'ArrowRight') nextWeek += 1
    else if (key === 'ArrowLeft') nextWeek -= 1
    else if (key === 'ArrowDown') nextDay += 1
    else if (key === 'ArrowUp') nextDay -= 1
    else if (key === 'Home') nextWeek = 0
    else if (key === 'End') {
      const maxWeek = Math.max(...cellMetas.map((c) => c.weekOffset))
      nextWeek = maxWeek
    }

    const target = cellByCoord.get(`${nextWeek}-${nextDay}`)
    if (!target?.entry) return

    setFocusedKey(`${nextWeek}-${nextDay}`)
    const el = e.currentTarget.querySelector<SVGElement>(
      `[data-slot="calendar-heatmap-segment"][data-week="${nextWeek}"][data-dow="${nextDay}"]`,
    )
    el?.focus()
  }

  function handleCellKeyDown(
    e: React.KeyboardEvent<SVGGElement>,
    entry: CalendarEntry | undefined,
  ) {
    if (!interactive || !entry) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onDayClick?.(entry)
    }
  }

  return (
    <g
      role="grid"
      aria-label="Calendar heatmap"
      transform={`translate(${margin.left},${margin.top})`}
      onKeyDown={handleGridKeyDown}
    >
      {/* Week-day labels */}
      {[1, 3, 5].map((d) => (
        <text
          key={d}
          x={-4}
          y={d * step + cellSize / 2 + 4}
          textAnchor="end"
          fontSize={9}
          fill={axisLabelColor}
        >
          {WEEK_DAYS[d]}
        </text>
      ))}

      {cellMetas.map((cell) => {
        const canActivate = interactive && Boolean(cell.entry)
        const cellKey = `${cell.weekOffset}-${cell.dayOfWeek}`
        const isTabStop = canActivate && cellKey === activeTabKey

        return (
          <g
            key={cell.isoDate}
            role="gridcell"
            data-slot="calendar-heatmap-segment"
            data-week={cell.weekOffset}
            data-dow={cell.dayOfWeek}
            tabIndex={canActivate ? (isTabStop ? 0 : -1) : -1}
            aria-label={
              cell.entry ? `${cell.isoDate}, ${formatValue(cell.entry.value)}` : cell.isoDate
            }
            className={cn(canActivate && 'cursor-pointer outline-none focus:opacity-80')}
            onFocus={canActivate ? () => setFocusedKey(cellKey) : undefined}
            onKeyDown={(e) => handleCellKeyDown(e, cell.entry)}
            onMouseEnter={(e) => {
              if (!cell.entry) return
              const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - r.left, e.clientY - r.top, {
                title: cell.isoDate,
                items: [{ label: '값', value: formatValue(cell.entry.value) }],
              })
            }}
            onMouseLeave={onLeave}
            onClick={() => cell.entry && onDayClick?.(cell.entry)}
          >
            <rect
              x={cell.cx}
              y={cell.cy}
              width={cellSize}
              height={cellSize}
              fill={cell.color}
              rx={2}
              aria-hidden="true"
            />
          </g>
        )
      })}

      {/* Month labels — show label at start of each month */}
      {days
        .filter((d, i) => i === 0 || d.getDate() === 1)
        .map((d) => {
          const weekOffset = Math.floor(
            (d.getTime() - firstSunday.getTime()) / (7 * 24 * 60 * 60 * 1000),
          )
          return (
            <text
              key={d.toISOString()}
              x={weekOffset * step}
              y={-6}
              fontSize={9}
              fill={axisLabelColor}
            >
              {MONTH_LABELS[d.getMonth()]}
            </text>
          )
        })}
    </g>
  )
}
