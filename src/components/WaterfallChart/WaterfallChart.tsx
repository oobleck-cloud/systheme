'use client'

import { scaleBand, scaleLinear } from 'd3'
import * as React from 'react'

import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface WaterfallItem {
  category: string
  value: number
  /** 'total' renders a summary bar from zero (e.g., net result) */
  type?: 'increase' | 'decrease' | 'total'
}

export interface WaterfallChartProps {
  data: WaterfallItem[]
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  className?: string
  onBarClick?: (item: WaterfallItem, index: number) => void
}

export function WaterfallChart({
  data,
  title,
  description,
  height = 320,
  margin,
  formatValue = compactFormat,
  className,
  onBarClick,
}: WaterfallChartProps) {
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
        <WaterfallInner
          dims={dims}
          data={data}
          formatValue={formatValue}
          onBarClick={onBarClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

WaterfallChart.displayName = 'WaterfallChart'

function WaterfallInner({
  dims,
  data,
  formatValue,
  onBarClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: WaterfallItem[]
  formatValue: (v: number) => string
  onBarClick?: (item: WaterfallItem, index: number) => void
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

  const positiveColor = readToken(CHART_TOKENS.statusPositive, null)
  const negativeColor = readToken(CHART_TOKENS.statusNegative, null)
  const neutralColor = readToken(CHART_TOKENS.statusNeutral, null)
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisColor = readToken(CHART_TOKENS.axis, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  // Compute running totals
  interface Bar {
    item: WaterfallItem
    base: number
    top: number
    color: string
  }
  const bars: Bar[] = []
  let running = 0

  for (const item of data) {
    if (item.type === 'total') {
      const total = running + item.value
      bars.push({ item, base: 0, top: total, color: neutralColor })
    } else {
      const base = running
      running += item.value
      const isPos = item.value >= 0
      bars.push({ item, base, top: running, color: isPos ? positiveColor : negativeColor })
    }
  }

  const allY = bars.flatMap((b) => [b.base, b.top])
  const yMin = Math.min(0, ...allY)
  const yMax = Math.max(0, ...allY)

  const categories = data.map((d) => d.category)
  const xScale = scaleBand()
    .domain(categories)
    .range([0, innerWidth])
    .paddingInner(0.3)
    .paddingOuter(0.1)
  const yScale = scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]).nice()
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
      <line
        x1={0}
        x2={innerWidth}
        y1={yScale(0)}
        y2={yScale(0)}
        stroke={axisColor}
        strokeWidth={1}
      />

      {/* Connectors between bars */}
      {bars.slice(0, -1).map((bar, i) => {
        const nextBar = bars[i + 1]
        const x1 = (xScale(bar.item.category) ?? 0) + bw
        const x2 = xScale(nextBar.item.category) ?? 0
        const connectY = yScale(bar.top)
        return (
          <line
            key={i}
            x1={x1}
            x2={x2}
            y1={connectY}
            y2={connectY}
            stroke={gridColor}
            strokeWidth={1}
            strokeDasharray="3 2"
          />
        )
      })}

      {bars.map((bar, i) => {
        const x = xScale(bar.item.category) ?? 0
        const y = yScale(Math.max(bar.base, bar.top))
        const h = Math.abs(yScale(bar.base) - yScale(bar.top))
        return (
          <g key={bar.item.category} data-slot="waterfall-chart-segment">
            <rect
              x={x}
              y={y}
              width={bw}
              height={Math.max(2, h)}
              fill={bar.color}
              rx={2}
              data-chart-point={onBarClick ? '' : undefined}
              role={onBarClick ? 'button' : undefined}
              aria-label={
                onBarClick ? `${bar.item.category}: ${formatValue(bar.item.value)}` : undefined
              }
              className={cn(onBarClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: bar.item.category,
                  items: [{ label: '변화', value: formatValue(bar.item.value) }],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onBarClick?.(bar.item, i)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                  e.preventDefault()
                  onBarClick(bar.item, i)
                }
              }}
            />
          </g>
        )
      })}

      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="waterfall-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {categories.map((cat) => {
          const x = (xScale(cat) ?? 0) + bw / 2
          return (
            <text key={cat} x={x} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
              {cat}
            </text>
          )
        })}
      </g>

      {/* Y-axis */}
      <g data-slot="waterfall-chart-y-axis">
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
