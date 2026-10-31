'use client'

import { scaleBand, scaleSequential, interpolateRgb, min, max } from 'd3'
import * as React from 'react'

import type { ChartMargin, HeatCell } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface HeatmapChartProps {
  data: HeatCell[]
  /** Unique x-axis labels (column headers) */
  xLabels: string[]
  /** Unique y-axis labels (row headers) */
  yLabels: string[]
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  /** Show cell value text */
  showValues?: boolean
  className?: string
  onCellClick?: (cell: HeatCell) => void
}

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  title,
  description,
  height = 360,
  margin = { top: 8, right: 8, bottom: 48, left: 64 },
  formatValue = compactFormat,
  showValues = false,
  className,
  onCellClick,
}: HeatmapChartProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      tooltip={tooltip}
      empty={data.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <HeatmapInner
          dims={dims}
          data={data}
          xLabels={xLabels}
          yLabels={yLabels}
          formatValue={formatValue}
          showValues={showValues}
          onCellClick={onCellClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

HeatmapChart.displayName = 'HeatmapChart'

function HeatmapInner({
  dims,
  data,
  xLabels,
  yLabels,
  formatValue,
  showValues,
  onCellClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: HeatCell[]
  xLabels: string[]
  yLabels: string[]
  formatValue: (v: number) => string
  showValues: boolean
  onCellClick?: (cell: HeatCell) => void
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

  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)
  const seqLow = readToken(CHART_TOKENS.seqLow, null)
  const seqHigh = readToken(CHART_TOKENS.seqHigh, null)

  const values = data.map((d) => d.value)
  const vMin = min(values) ?? 0
  const vMax = max(values) ?? 1

  const xScale = scaleBand().domain(xLabels).range([0, innerWidth]).padding(0.05)
  const yScale = scaleBand().domain(yLabels).range([0, innerHeight]).padding(0.05)
  const colorScale = scaleSequential()
    .domain([vMin, vMax])
    .interpolator(interpolateRgb(seqLow || '#dbeafe', seqHigh || '#1e40af'))

  const cellMap = new Map(data.map((d) => [`${d.x}|${d.y}`, d]))

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {xLabels.map((xl) =>
        yLabels.map((yl) => {
          const cell = cellMap.get(`${xl}|${yl}`)
          const val = cell?.value ?? 0
          const color = colorScale(val)
          const cx = xScale(xl) ?? 0
          const cy = yScale(yl) ?? 0
          const cw = xScale.bandwidth()
          const ch = yScale.bandwidth()
          const textColor = val > (vMin + vMax) / 2 ? 'white' : axisLabelColor

          return (
            <g key={`${xl}|${yl}`} data-slot="heatmap-chart-segment">
              <rect
                x={cx}
                y={cy}
                width={cw}
                height={ch}
                fill={color}
                rx={2}
                data-chart-point={onCellClick ? '' : undefined}
                role={onCellClick ? 'button' : undefined}
                aria-label={onCellClick ? `${xl} / ${yl}: ${formatValue(val)}` : undefined}
                className={cn(onCellClick && 'cursor-pointer')}
                onMouseEnter={(e) => {
                  const r = (
                    e.currentTarget.closest('svg') as SVGSVGElement
                  ).getBoundingClientRect()
                  onHover(e.clientX - r.left, e.clientY - r.top, {
                    title: `${xl} / ${yl}`,
                    items: [{ label: '값', value: formatValue(val) }],
                  })
                }}
                onMouseLeave={onLeave}
                onClick={() => cell && onCellClick?.(cell)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onCellClick && cell) {
                    e.preventDefault()
                    onCellClick(cell)
                  }
                }}
              />
              {showValues && cw > 24 && ch > 16 && (
                <text
                  x={cx + cw / 2}
                  y={cy + ch / 2 + 4}
                  textAnchor="middle"
                  fontSize={Math.min(10, cw / 4)}
                  fill={textColor}
                >
                  {formatValue(val)}
                </text>
              )}
            </g>
          )
        }),
      )}

      {/* X-axis labels */}
      <g transform={`translate(0,${innerHeight})`} data-slot="heatmap-chart-x-axis">
        {xLabels.map((xl) => {
          const x = (xScale(xl) ?? 0) + xScale.bandwidth() / 2
          return (
            <text key={xl} x={x} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
              {xl}
            </text>
          )
        })}
      </g>

      {/* Y-axis labels */}
      <g data-slot="heatmap-chart-y-axis">
        {yLabels.map((yl) => {
          const y = (yScale(yl) ?? 0) + yScale.bandwidth() / 2
          return (
            <text key={yl} x={-6} y={y + 4} textAnchor="end" fontSize={10} fill={axisLabelColor}>
              {yl}
            </text>
          )
        })}
      </g>
    </g>
  )
}
