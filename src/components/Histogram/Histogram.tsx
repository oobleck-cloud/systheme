'use client'

import { scaleLinear, bin, max } from 'd3'
import * as React from 'react'

import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface HistogramProps {
  /** Raw numeric values to bin */
  data: number[]
  /** Number of bins. If omitted, d3 auto-selects using Sturges' rule */
  bins?: number
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  /** Color index 1-6 */
  colorIndex?: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
  onBinClick?: (min: number, max: number, count: number) => void
}

export function Histogram({
  data,
  bins,
  title,
  description,
  height = 300,
  margin,
  formatValue = compactFormat,
  colorIndex = 1,
  className,
  onBinClick,
}: HistogramProps) {
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
        <HistogramInner
          dims={dims}
          data={data}
          bins={bins}
          formatValue={formatValue}
          colorIndex={colorIndex}
          onBinClick={onBinClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

Histogram.displayName = 'Histogram'

function HistogramInner({
  dims,
  data,
  bins,
  formatValue,
  colorIndex,
  onBinClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: number[]
  bins?: number
  formatValue: (v: number) => string
  colorIndex: 1 | 2 | 3 | 4 | 5 | 6
  onBinClick?: (min: number, max: number, count: number) => void
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
  const color = seriesColors[colorIndex - 1]
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisColor = readToken(CHART_TOKENS.axis, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  const xScale = scaleLinear()
    .domain([Math.min(...data), Math.max(...data)])
    .range([0, innerWidth])
    .nice()

  const binGen = bin<number, number>().domain(xScale.domain() as [number, number])
  if (bins != null) {
    binGen.thresholds(bins)
  } else {
    binGen.thresholds(xScale.ticks(20))
  }
  const buckets = binGen(data)

  const yMax = max(buckets, (b) => b.length) ?? 1
  const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice()
  const yTicks = yScale.ticks(5)

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

      {buckets.map((bucket, i) => {
        const x0 = xScale(bucket.x0 ?? 0)
        const x1 = xScale(bucket.x1 ?? 0)
        const bw = Math.max(0, x1 - x0 - 1)
        const bh = Math.max(0, innerHeight - yScale(bucket.length))
        return (
          <rect
            key={i}
            data-slot="histogram-segment"
            x={x0}
            y={yScale(bucket.length)}
            width={bw}
            height={bh}
            fill={color}
            fillOpacity={0.85}
            stroke="white"
            strokeWidth={0.5}
            data-chart-point={onBinClick ? '' : undefined}
            role={onBinClick ? 'button' : undefined}
            aria-label={
              onBinClick
                ? `${formatValue(bucket.x0 ?? 0)} – ${formatValue(bucket.x1 ?? 0)}: ${bucket.length}`
                : undefined
            }
            className={cn(onBinClick && 'cursor-pointer')}
            onMouseEnter={(e) => {
              const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - r.left, e.clientY - r.top, {
                title: `${formatValue(bucket.x0 ?? 0)} – ${formatValue(bucket.x1 ?? 0)}`,
                items: [{ label: '빈도', value: String(bucket.length), colorIndex }],
              })
            }}
            onMouseLeave={onLeave}
            onClick={() => onBinClick?.(bucket.x0 ?? 0, bucket.x1 ?? 0, bucket.length)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onBinClick) {
                e.preventDefault()
                onBinClick(bucket.x0 ?? 0, bucket.x1 ?? 0, bucket.length)
              }
            }}
          />
        )
      })}

      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="histogram-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {xScale.ticks(8).map((t) => (
          <text
            key={t}
            x={xScale(t)}
            y={14}
            textAnchor="middle"
            fontSize={10}
            fill={axisLabelColor}
          >
            {formatValue(t)}
          </text>
        ))}
      </g>

      {/* Y-axis */}
      <g data-slot="histogram-y-axis">
        {yTicks.map((t) => (
          <text
            key={t}
            x={-6}
            y={yScale(t) + 4}
            textAnchor="end"
            fontSize={10}
            fill={axisLabelColor}
          >
            {t}
          </text>
        ))}
      </g>
    </g>
  )
}
