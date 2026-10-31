'use client'

import { scaleLinear, scaleTime, line as d3Line, curveMonotoneX, extent, min, max } from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin, SeriesData, DataPoint } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface LineChartProps {
  series: SeriesData[]
  /** Use Date objects as x values and render a time axis */
  timeAxis?: boolean
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  /** Show dots at each data point */
  showDots?: boolean
  /** Show area fill below the line */
  showArea?: boolean
  /** Curve interpolation — defaults to monotone */
  curved?: boolean
  formatY?: (v: number) => string
  formatX?: (v: number | string | Date) => string
  className?: string
  onPointClick?: (series: string, point: DataPoint) => void
}

export function LineChart({
  series,
  timeAxis = false,
  title,
  description,
  height = 300,
  margin,
  showDots = true,
  showArea = false,
  curved = true,
  formatY = compactFormat,
  formatX,
  className,
  onPointClick,
}: LineChartProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  const legendItems: ChartLegendItem[] = series.map((s, i) => ({
    key: s.key,
    label: s.name ?? s.key,
    colorIndex: (s.colorIndex ?? (i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }))

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      legendItems={series.length > 1 ? legendItems : undefined}
      tooltip={tooltip}
      empty={series.length === 0 || series.every((s) => s.data.length === 0)}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <LineChartInner
          dims={dims}
          series={series}
          timeAxis={timeAxis}
          showDots={showDots}
          showArea={showArea}
          curved={curved}
          formatY={formatY}
          formatX={formatX}
          onPointClick={onPointClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

LineChart.displayName = 'LineChart'

// ── Inner ─────────────────────────────────────────────────────────────────

function LineChartInner({
  dims,
  series,
  timeAxis,
  showDots,
  showArea,
  curved,
  formatY,
  formatX,
  onPointClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  series: SeriesData[]
  timeAxis: boolean
  showDots: boolean
  showArea: boolean
  curved: boolean
  formatY: (v: number) => string
  formatX?: (v: number | string | Date) => string
  onPointClick?: (series: string, point: DataPoint) => void
  onHover: (
    x: number,
    y: number,
    content: {
      title?: string
      items: Array<{ label: string; value: string; colorIndex?: number }>
    },
  ) => void
  onLeave: () => void
}) {
  const { margin, innerWidth, innerHeight } = dims
  const seriesColors = readSeriesColors(null)
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisColor = readToken(CHART_TOKENS.axis, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  const allPoints = series.flatMap((s) => s.data)

  const xDomain: [number, number] | [Date, Date] = timeAxis
    ? (extent(allPoints, (d) => new Date(d.x)) as [Date, Date])
    : (extent(allPoints, (d) => Number(d.x)) as [number, number])

  const yMin = Math.min(0, min(allPoints, (d) => d.y) ?? 0)
  const yMax = max(allPoints, (d) => d.y) ?? 1

  const xScale = timeAxis
    ? scaleTime()
        .domain(xDomain as [Date, Date])
        .range([0, innerWidth])
    : scaleLinear()
        .domain(xDomain as [number, number])
        .range([0, innerWidth])

  const yScale = scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]).nice()

  const yTicks = yScale.ticks(5)
  const xTicks = xScale.ticks(6)

  const curve = curved ? curveMonotoneX : undefined
  const lineGen = d3Line<DataPoint>()
    .x((d) => xScale(timeAxis ? new Date(d.x) : Number(d.x)) as number)
    .y((d) => yScale(d.y))
  if (curve) lineGen.curve(curve)

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {/* Gridlines */}
      {yTicks.map((t) => (
        <line
          key={t}
          x1={0}
          x2={innerWidth}
          y1={yScale(t)}
          y2={yScale(t)}
          stroke={gridColor}
          strokeDasharray="3 3"
        />
      ))}

      {/* Zero line */}
      {yMin < 0 && (
        <line
          x1={0}
          x2={innerWidth}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke={axisColor}
          strokeWidth={1}
        />
      )}

      {/* Area fills */}
      {showArea &&
        series.map((s, si) => {
          const color = seriesColors[(s.colorIndex ? s.colorIndex - 1 : si) % seriesColors.length]
          const areaGen = d3Line<DataPoint>()
            .x((d) => xScale(timeAxis ? new Date(d.x) : Number(d.x)) as number)
            .y((d) => yScale(d.y))
          if (curve) areaGen.curve(curve)
          // Build area path: line + bottom close
          const linePath = areaGen(s.data) ?? ''
          const firstX =
            s.data.length > 0
              ? (xScale(timeAxis ? new Date(s.data[0].x) : Number(s.data[0].x)) as number)
              : 0
          const lastX =
            s.data.length > 0
              ? (xScale(
                  timeAxis
                    ? new Date(s.data[s.data.length - 1].x)
                    : Number(s.data[s.data.length - 1].x),
                ) as number)
              : 0
          const areaPath = `${linePath} L${lastX},${innerHeight} L${firstX},${innerHeight} Z`
          return <path key={s.key} d={areaPath} fill={color} fillOpacity={0.12} stroke="none" />
        })}

      {/* Lines */}
      {series.map((s, si) => {
        const color = seriesColors[(s.colorIndex ? s.colorIndex - 1 : si) % seriesColors.length]
        const pathD = lineGen(s.data) ?? ''
        return (
          <path
            key={s.key}
            data-slot="line-chart-segment"
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )
      })}

      {/* Dots */}
      {showDots &&
        series.map((s, si) => {
          const color = seriesColors[(s.colorIndex ? s.colorIndex - 1 : si) % seriesColors.length]
          return s.data.map((d, di) => {
            const cx = xScale(timeAxis ? new Date(d.x) : Number(d.x)) as number
            const cy = yScale(d.y)
            const ci = (s.colorIndex ?? si + 1) as 1 | 2 | 3 | 4 | 5 | 6
            return (
              <circle
                key={`${s.key}-${di}`}
                cx={cx}
                cy={cy}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={1.5}
                data-chart-point={onPointClick ? '' : undefined}
                role={onPointClick ? 'button' : undefined}
                aria-label={onPointClick ? `${d.label ?? String(d.x)}: ${formatY(d.y)}` : undefined}
                className={cn(onPointClick && 'cursor-pointer')}
                onMouseEnter={(e) => {
                  const r = (
                    e.currentTarget.closest('svg') as SVGSVGElement
                  ).getBoundingClientRect()
                  onHover(e.clientX - r.left, e.clientY - r.top, {
                    title: d.label ?? String(d.x),
                    items: [{ label: s.name ?? s.key, value: formatY(d.y), colorIndex: ci }],
                  })
                }}
                onMouseLeave={onLeave}
                onClick={() => onPointClick?.(s.key, d)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onPointClick) {
                    e.preventDefault()
                    onPointClick(s.key, d)
                  }
                }}
              />
            )
          })
        })}

      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="line-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {xTicks.map((t, i) => {
          const x = xScale(t as Date & number) as number
          const label = formatX ? formatX(t as Date) : timeAxis ? String(t) : formatY(Number(t))
          return (
            <text key={i} x={x} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
              {label}
            </text>
          )
        })}
      </g>

      {/* Y-axis */}
      <g data-slot="line-chart-y-axis">
        {yTicks.map((t) => (
          <text
            key={t}
            x={-6}
            y={yScale(t) + 4}
            textAnchor="end"
            fontSize={10}
            fill={axisLabelColor}
          >
            {formatY(t)}
          </text>
        ))}
      </g>
    </g>
  )
}
