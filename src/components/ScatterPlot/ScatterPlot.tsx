'use client'

import { scaleLinear, extent } from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface ScatterPoint {
  x: number
  y: number
  label?: string
  group?: string
}

export interface ScatterSeries {
  key: string
  name?: string
  data: ScatterPoint[]
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ScatterPlotProps {
  series: ScatterSeries[]
  xLabel?: string
  yLabel?: string
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatX?: (v: number) => string
  formatY?: (v: number) => string
  dotRadius?: number
  className?: string
  onPointClick?: (series: string, point: ScatterPoint) => void
}

export function ScatterPlot({
  series,
  xLabel,
  yLabel,
  title,
  description,
  height = 360,
  margin = { top: 16, right: 16, bottom: 48, left: 56 },
  formatX = compactFormat,
  formatY = compactFormat,
  dotRadius = 5,
  className,
  onPointClick,
}: ScatterPlotProps) {
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
        <ScatterPlotInner
          dims={dims}
          series={series}
          xLabel={xLabel}
          yLabel={yLabel}
          formatX={formatX}
          formatY={formatY}
          dotRadius={dotRadius}
          onPointClick={onPointClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

ScatterPlot.displayName = 'ScatterPlot'

function ScatterPlotInner({
  dims,
  series,
  xLabel,
  yLabel,
  formatX,
  formatY,
  dotRadius,
  onPointClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  series: ScatterSeries[]
  xLabel?: string
  yLabel?: string
  formatX: (v: number) => string
  formatY: (v: number) => string
  dotRadius: number
  onPointClick?: (series: string, point: ScatterPoint) => void
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

  const xPad = (xExtent[1] - xExtent[0]) * 0.05 || 1
  const yPad = (yExtent[1] - yExtent[0]) * 0.05 || 1

  const xScale = scaleLinear()
    .domain([xExtent[0] - xPad, xExtent[1] + xPad])
    .range([0, innerWidth])
    .nice()
  const yScale = scaleLinear()
    .domain([yExtent[0] - yPad, yExtent[1] + yPad])
    .range([innerHeight, 0])
    .nice()

  const xTicks = xScale.ticks(6)
  const yTicks = yScale.ticks(5)

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

      {/* Zero lines */}
      <line
        x1={xScale(0)}
        x2={xScale(0)}
        y1={0}
        y2={innerHeight}
        stroke={axisColor}
        strokeWidth={0.5}
      />
      <line
        x1={0}
        x2={innerWidth}
        y1={yScale(0)}
        y2={yScale(0)}
        stroke={axisColor}
        strokeWidth={0.5}
      />

      {/* Dots */}
      {series.map((s, si) => {
        const color = seriesColors[(s.colorIndex ? s.colorIndex - 1 : si) % seriesColors.length]
        const ci = (s.colorIndex ?? si + 1) as 1 | 2 | 3 | 4 | 5 | 6
        return s.data.map((point, pi) => (
          <circle
            key={`${s.key}-${pi}`}
            data-slot="scatter-plot-point"
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r={dotRadius}
            fill={color}
            fillOpacity={0.7}
            stroke="white"
            strokeWidth={1}
            data-chart-point={onPointClick ? '' : undefined}
            role={onPointClick ? 'button' : undefined}
            aria-label={
              onPointClick
                ? `${point.label ?? s.name ?? s.key}: x=${formatX(point.x)}, y=${formatY(point.y)}`
                : undefined
            }
            className={cn(onPointClick && 'cursor-pointer', 'transition-opacity hover:opacity-100')}
            onMouseEnter={(e) => {
              const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - r.left, e.clientY - r.top, {
                title: point.label ?? s.name ?? s.key,
                items: [
                  { label: xLabel ?? 'X', value: formatX(point.x), colorIndex: ci },
                  { label: yLabel ?? 'Y', value: formatY(point.y) },
                ],
              })
            }}
            onMouseLeave={onLeave}
            onClick={() => onPointClick?.(s.key, point)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onPointClick) {
                e.preventDefault()
                onPointClick(s.key, point)
              }
            }}
          />
        ))
      })}

      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="scatter-plot-x-axis">
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
      <g data-slot="scatter-plot-y-axis">
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
            transform={`rotate(-90) translate(${-innerHeight / 2}, -36)`}
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
