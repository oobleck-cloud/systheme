'use client'

import { scaleLinear, scaleBand, quantile, min, max } from 'd3'
import * as React from 'react'

import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface BoxPlotGroup {
  label: string
  values: number[]
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
}

export interface BoxStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
}

function computeBoxStats(values: number[]): BoxStats {
  const sorted = [...values].sort((a, b) => a - b)
  const q1 = quantile(sorted, 0.25) ?? 0
  const median = quantile(sorted, 0.5) ?? 0
  const q3 = quantile(sorted, 0.75) ?? 0
  const iqr = q3 - q1
  const fence = 1.5 * iqr
  const whiskerLow = Math.max(sorted[0], q1 - fence)
  const whiskerHigh = Math.min(sorted[sorted.length - 1], q3 + fence)
  const outliers = sorted.filter((v) => v < whiskerLow || v > whiskerHigh)
  return { min: whiskerLow, q1, median, q3, max: whiskerHigh, outliers }
}

export interface BoxPlotProps {
  data: BoxPlotGroup[]
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  className?: string
}

export function BoxPlot({
  data,
  title,
  description,
  height = 320,
  margin,
  formatValue = compactFormat,
  className,
}: BoxPlotProps) {
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
        <BoxPlotInner
          dims={dims}
          data={data}
          formatValue={formatValue}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

BoxPlot.displayName = 'BoxPlot'

function BoxPlotInner({
  dims,
  data,
  formatValue,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: BoxPlotGroup[]
  formatValue: (v: number) => string
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

  const statsPerGroup = data.map((g) => ({
    label: g.label,
    stats: computeBoxStats(g.values),
    colorIndex: g.colorIndex,
  }))

  const allVals = data.flatMap((g) => g.values)
  const globalMin = min(allVals) ?? 0
  const globalMax = max(allVals) ?? 1

  const xScale = scaleBand()
    .domain(data.map((g) => g.label))
    .range([0, innerWidth])
    .paddingInner(0.4)
    .paddingOuter(0.2)
  const yScale = scaleLinear().domain([globalMin, globalMax]).range([innerHeight, 0]).nice()
  const yTicks = yScale.ticks(6)
  const bw = xScale.bandwidth()

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

      {statsPerGroup.map(({ label, stats, colorIndex }, i) => {
        const x = xScale(label) ?? 0
        const cx = x + bw / 2
        const color = seriesColors[(colorIndex ? colorIndex - 1 : i) % seriesColors.length]
        const ci = (colorIndex ?? i + 1) as 1 | 2 | 3 | 4 | 5 | 6

        const yQ1 = yScale(stats.q1)
        const yQ3 = yScale(stats.q3)
        const yMedian = yScale(stats.median)
        const yMin = yScale(stats.min)
        const yMax = yScale(stats.max)

        return (
          <g
            key={label}
            data-slot="box-plot-segment"
            onMouseEnter={(e) => {
              const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - r.left, e.clientY - r.top, {
                title: label,
                items: [
                  { label: '최대', value: formatValue(stats.max), colorIndex: ci },
                  { label: 'Q3', value: formatValue(stats.q3) },
                  { label: '중앙값', value: formatValue(stats.median) },
                  { label: 'Q1', value: formatValue(stats.q1) },
                  { label: '최소', value: formatValue(stats.min) },
                ],
              })
            }}
            onMouseLeave={onLeave}
          >
            {/* Whisker lines */}
            <line
              x1={cx}
              x2={cx}
              y1={yMin}
              y2={yQ1}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
            <line
              x1={cx}
              x2={cx}
              y1={yQ3}
              y2={yMax}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
            {/* Whisker caps */}
            <line
              x1={cx - bw * 0.25}
              x2={cx + bw * 0.25}
              y1={yMin}
              y2={yMin}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - bw * 0.25}
              x2={cx + bw * 0.25}
              y1={yMax}
              y2={yMax}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* IQR box */}
            <rect
              x={x}
              y={yQ3}
              width={bw}
              height={Math.max(0, yQ1 - yQ3)}
              fill={color}
              fillOpacity={0.2}
              stroke={color}
              strokeWidth={1.5}
              rx={2}
            />
            {/* Median line */}
            <line x1={x} x2={x + bw} y1={yMedian} y2={yMedian} stroke={color} strokeWidth={2.5} />
            {/* Outliers */}
            {stats.outliers.map((v, oi) => (
              <circle
                key={oi}
                cx={cx}
                cy={yScale(v)}
                r={3}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
              />
            ))}
          </g>
        )
      })}

      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="box-plot-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {data.map((g) => {
          const x = (xScale(g.label) ?? 0) + bw / 2
          return (
            <text
              key={g.label}
              x={x}
              y={14}
              textAnchor="middle"
              fontSize={10}
              fill={axisLabelColor}
            >
              {g.label}
            </text>
          )
        })}
      </g>

      {/* Y-axis */}
      <g data-slot="box-plot-y-axis">
        {yTicks.map((t) => (
          <text
            key={t}
            x={-6}
            y={yScale(t) + 4}
            textAnchor="end"
            fontSize={10}
            fill={axisLabelColor}
          >
            {formatValue(t)}
          </text>
        ))}
      </g>
    </g>
  )
}
