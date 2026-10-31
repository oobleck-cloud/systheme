'use client'

import { scaleLinear, scaleSqrt, extent } from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface BubblePoint {
  x: number
  y: number
  /** Bubble size value (mapped to area, not radius) */
  size: number
  label?: string
}

export interface BubbleSeries {
  key: string
  name?: string
  data: BubblePoint[]
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface BubbleChartProps {
  series: BubbleSeries[]
  xLabel?: string
  yLabel?: string
  sizeLabel?: string
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  /** Max bubble radius in px */
  maxRadius?: number
  formatX?: (v: number) => string
  formatY?: (v: number) => string
  formatSize?: (v: number) => string
  className?: string
  onBubbleClick?: (series: string, point: BubblePoint) => void
}

export function BubbleChart({
  series,
  xLabel,
  yLabel,
  sizeLabel = '크기',
  title,
  description,
  height = 400,
  margin = { top: 16, right: 24, bottom: 48, left: 56 },
  maxRadius = 40,
  formatX = compactFormat,
  formatY = compactFormat,
  formatSize = compactFormat,
  className,
  onBubbleClick,
}: BubbleChartProps) {
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
        <BubbleChartInner
          dims={dims}
          series={series}
          xLabel={xLabel}
          yLabel={yLabel}
          sizeLabel={sizeLabel}
          maxRadius={maxRadius}
          formatX={formatX}
          formatY={formatY}
          formatSize={formatSize}
          onBubbleClick={onBubbleClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

BubbleChart.displayName = 'BubbleChart'

function BubbleChartInner({
  dims,
  series,
  xLabel,
  yLabel,
  sizeLabel,
  maxRadius,
  formatX,
  formatY,
  formatSize,
  onBubbleClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  series: BubbleSeries[]
  xLabel?: string
  yLabel?: string
  sizeLabel: string
  maxRadius: number
  formatX: (v: number) => string
  formatY: (v: number) => string
  formatSize: (v: number) => string
  onBubbleClick?: (series: string, point: BubblePoint) => void
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
  const axisTitleColor = readToken(CHART_TOKENS.axisTitle, null)

  const allPoints = series.flatMap((s) => s.data)
  const xExtent = extent(allPoints, (d) => d.x) as [number, number]
  const yExtent = extent(allPoints, (d) => d.y) as [number, number]
  const sizeExtent = extent(allPoints, (d) => d.size) as [number, number]

  const pad = 0.06
  const xRange = xExtent[1] - xExtent[0] || 1
  const yRange = yExtent[1] - yExtent[0] || 1

  const xScale = scaleLinear()
    .domain([xExtent[0] - xRange * pad, xExtent[1] + xRange * pad])
    .range([0, innerWidth])
  const yScale = scaleLinear()
    .domain([yExtent[0] - yRange * pad, yExtent[1] + yRange * pad])
    .range([innerHeight, 0])
  const rScale = scaleSqrt().domain([0, sizeExtent[1]]).range([3, maxRadius])

  const xTicks = xScale.ticks(6)
  const yTicks = yScale.ticks(5)

  // Sort by size desc so small bubbles render on top
  const sortedSeries = series.map((s) => ({
    ...s,
    data: [...s.data].sort((a, b) => b.size - a.size),
  }))

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
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
      {xTicks.map((t) => (
        <line
          key={t}
          x1={xScale(t)}
          x2={xScale(t)}
          y1={0}
          y2={innerHeight}
          stroke={gridColor}
          strokeDasharray="3 3"
        />
      ))}

      {sortedSeries.map((s, si) => {
        const color = seriesColors[(s.colorIndex ? s.colorIndex - 1 : si) % seriesColors.length]
        const ci = (s.colorIndex ?? si + 1) as 1 | 2 | 3 | 4 | 5 | 6
        return s.data.map((point, pi) => (
          <circle
            key={`${s.key}-${pi}`}
            data-slot="bubble-chart-segment"
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r={rScale(point.size)}
            fill={color}
            fillOpacity={0.5}
            stroke={color}
            strokeWidth={1.5}
            data-chart-point={onBubbleClick ? '' : undefined}
            role={onBubbleClick ? 'button' : undefined}
            aria-label={
              onBubbleClick
                ? `${point.label ?? s.name ?? s.key}: x=${formatX(point.x)}, y=${formatY(point.y)}`
                : undefined
            }
            className={cn(onBubbleClick && 'cursor-pointer', 'transition-opacity hover:opacity-90')}
            onMouseEnter={(e) => {
              const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - r.left, e.clientY - r.top, {
                title: point.label ?? s.name ?? s.key,
                items: [
                  { label: xLabel ?? 'X', value: formatX(point.x), colorIndex: ci },
                  { label: yLabel ?? 'Y', value: formatY(point.y) },
                  { label: sizeLabel, value: formatSize(point.size) },
                ],
              })
            }}
            onMouseLeave={onLeave}
            onClick={() => onBubbleClick?.(s.key, point)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onBubbleClick) {
                e.preventDefault()
                onBubbleClick(s.key, point)
              }
            }}
          />
        ))
      })}

      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="bubble-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {xTicks.map((t) => (
          <text
            key={t}
            x={xScale(t)}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fill={axisLabelColor}
          >
            {formatX(t)}
          </text>
        ))}
        {xLabel && (
          <text x={innerWidth / 2} y={32} textAnchor="middle" fontSize={11} fill={axisTitleColor}>
            {xLabel}
          </text>
        )}
      </g>

      {/* Y-axis */}
      <g data-slot="bubble-chart-y-axis">
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
        {yLabel && (
          <text
            transform={`rotate(-90) translate(${-innerHeight / 2}, -40)`}
            textAnchor="middle"
            fontSize={11}
            fill={axisTitleColor}
          >
            {yLabel}
          </text>
        )}
      </g>
    </g>
  )
}
