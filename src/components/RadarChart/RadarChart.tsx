'use client'

import { scaleLinear } from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface RadarDataItem {
  [axis: string]: number
}

export interface RadarSeries {
  key: string
  name?: string
  data: RadarDataItem
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface RadarChartProps {
  series: RadarSeries[]
  /** Axes to show, in angular order */
  axes: string[]
  /** Axis display labels (defaults to axes) */
  axisLabels?: string[]
  /** Max value for all axes (defaults to auto from data) */
  maxValue?: number
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  /** Number of concentric gridline rings */
  gridLevels?: number
  className?: string
}

export function RadarChart({
  series,
  axes,
  axisLabels,
  maxValue,
  title,
  description,
  height = 360,
  margin = { top: 32, right: 32, bottom: 32, left: 32 },
  gridLevels = 5,
  className,
}: RadarChartProps) {
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
      empty={series.length === 0 || axes.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <RadarChartInner
          dims={dims}
          series={series}
          axes={axes}
          axisLabels={axisLabels}
          maxValue={maxValue}
          gridLevels={gridLevels}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

RadarChart.displayName = 'RadarChart'

function RadarChartInner({
  dims,
  series,
  axes,
  axisLabels,
  maxValue,
  gridLevels,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  series: RadarSeries[]
  axes: string[]
  axisLabels?: string[]
  maxValue?: number
  gridLevels: number
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

  const cx = margin.left + innerWidth / 2
  const cy = margin.top + innerHeight / 2
  const radius = Math.min(innerWidth, innerHeight) / 2 - 20

  const autoMax = maxValue ?? Math.max(1, ...series.flatMap((s) => axes.map((a) => s.data[a] ?? 0)))
  const rScale = scaleLinear().domain([0, autoMax]).range([0, radius])

  const n = axes.length
  const angleStep = (2 * Math.PI) / n
  const startAngle = -Math.PI / 2

  function angleFor(i: number) {
    return startAngle + i * angleStep
  }

  function polarToXY(angle: number, r: number) {
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r }
  }

  function seriesPath(s: RadarSeries): string {
    const pts = axes.map((a, i) => {
      const val = s.data[a] ?? 0
      const r = rScale(val)
      const { x, y } = polarToXY(angleFor(i), r)
      return `${x},${y}`
    })
    return `M ${pts.join(' L ')} Z`
  }

  // Concentric grid
  const gridPolygon = (level: number) => {
    const r = (radius * level) / gridLevels
    const pts = axes.map((_, i) => {
      const { x, y } = polarToXY(angleFor(i), r)
      return `${x},${y}`
    })
    return `M ${pts.join(' L ')} Z`
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Grid rings */}
      {Array.from({ length: gridLevels }, (_, li) => (
        <path key={li} d={gridPolygon(li + 1)} fill="none" stroke={gridColor} strokeWidth={1} />
      ))}

      {/* Axis spokes */}
      {axes.map((axis, i) => {
        const { x, y } = polarToXY(angleFor(i), radius)
        const labelR = radius + 16
        const { x: lx, y: ly } = polarToXY(angleFor(i), labelR)
        const label = axisLabels?.[i] ?? axis
        const anchor = Math.abs(lx) < 2 ? 'middle' : lx > 0 ? 'start' : 'end'
        return (
          <g key={axis} data-slot="radar-chart-x-axis">
            <line x1={0} y1={0} x2={x} y2={y} stroke={axisColor} strokeWidth={1} />
            <text x={lx} y={ly + 4} textAnchor={anchor} fontSize={11} fill={axisLabelColor}>
              {label}
            </text>
          </g>
        )
      })}

      {/* Series */}
      {series.map((s, si) => {
        const color = seriesColors[(s.colorIndex ? s.colorIndex - 1 : si) % seriesColors.length]
        const ci = (s.colorIndex ?? si + 1) as 1 | 2 | 3 | 4 | 5 | 6
        return (
          <g key={s.key} data-slot="radar-chart-segment">
            <path
              d={seriesPath(s)}
              fill={color}
              fillOpacity={0.15}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: s.name ?? s.key,
                  items: axes.map((a) => ({
                    label: axisLabels?.[axes.indexOf(a)] ?? a,
                    value: String(s.data[a] ?? 0),
                    colorIndex: ci,
                  })),
                })
              }}
              onMouseLeave={onLeave}
            />
            {/* Dots at each axis intersection */}
            {axes.map((a, i) => {
              const val = s.data[a] ?? 0
              const r = rScale(val)
              const { x, y } = polarToXY(angleFor(i), r)
              return (
                <circle key={a} cx={x} cy={y} r={3} fill={color} stroke="white" strokeWidth={1} />
              )
            })}
          </g>
        )
      })}
    </g>
  )
}
