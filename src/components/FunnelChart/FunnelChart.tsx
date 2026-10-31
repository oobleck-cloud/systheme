'use client'

import { scaleLinear } from 'd3'
import * as React from 'react'

import type { ChartMargin, CategoryValue } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface FunnelChartProps {
  data: CategoryValue[]
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  /** Show conversion rate between stages */
  showConversionRate?: boolean
  className?: string
  onStageClick?: (item: CategoryValue, index: number) => void
}

export function FunnelChart({
  data,
  title,
  description,
  height = 360,
  margin = { top: 16, right: 80, bottom: 16, left: 80 },
  formatValue = compactFormat,
  showConversionRate = true,
  className,
  onStageClick,
}: FunnelChartProps) {
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
        <FunnelChartInner
          dims={dims}
          data={data}
          formatValue={formatValue}
          showConversionRate={showConversionRate}
          onStageClick={onStageClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

FunnelChart.displayName = 'FunnelChart'

function FunnelChartInner({
  dims,
  data,
  formatValue,
  showConversionRate,
  onStageClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: CategoryValue[]
  formatValue: (v: number) => string
  showConversionRate: boolean
  onStageClick?: (item: CategoryValue, index: number) => void
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
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  const n = data.length
  if (n === 0) return null

  const maxVal = data[0].value
  const rScale = scaleLinear().domain([0, maxVal]).range([0, innerWidth])
  const rowH = innerHeight / n

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {data.map((item, i) => {
        const topW = rScale(item.value)
        const botW = i < n - 1 ? rScale(data[i + 1].value) : topW
        const gap = rowH * 0.1
        const y = i * rowH
        const h = rowH - gap

        const topX = (innerWidth - topW) / 2
        const botX = (innerWidth - botW) / 2

        // Trapezoid path
        const path = `M${topX},${y} L${topX + topW},${y} L${botX + botW},${y + h} L${botX},${y + h} Z`
        const ci = ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
        const color = seriesColors[i % seriesColors.length]
        const convRate = i > 0 ? ((item.value / data[i - 1].value) * 100).toFixed(1) : null

        return (
          <g key={item.category} data-slot="funnel-chart-segment">
            <path
              d={path}
              fill={color}
              fillOpacity={0.85}
              stroke="white"
              strokeWidth={1}
              data-chart-point={onStageClick ? '' : undefined}
              role={onStageClick ? 'button' : undefined}
              aria-label={
                onStageClick
                  ? `${item.label ?? item.category}: ${formatValue(item.value)}`
                  : undefined
              }
              className={cn(onStageClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: item.label ?? item.category,
                  items: [
                    { label: '값', value: formatValue(item.value), colorIndex: ci },
                    ...(convRate ? [{ label: '전환율', value: `${convRate}%` }] : []),
                  ],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onStageClick?.(item, i)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onStageClick) {
                  e.preventDefault()
                  onStageClick(item, i)
                }
              }}
            />
            {/* Stage label */}
            <text
              x={innerWidth / 2}
              y={y + h / 2 + 4}
              textAnchor="middle"
              fontSize={11}
              fontWeight={500}
              fill="white"
              pointerEvents="none"
            >
              {item.label ?? item.category}
            </text>
            {/* Value */}
            <text
              x={innerWidth + 8}
              y={y + h / 2 + 4}
              textAnchor="start"
              fontSize={11}
              fill={axisLabelColor}
            >
              {formatValue(item.value)}
            </text>
            {/* Conversion rate */}
            {showConversionRate && convRate && (
              <text
                x={-8}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill={axisLabelColor}
                opacity={0.7}
              >
                {convRate}%
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}
