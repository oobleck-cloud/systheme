'use client'

import { pie, arc } from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin, CategoryValue } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip, formatTooltipValue } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface PieChartProps {
  data: CategoryValue[]
  /** 'donut' renders with a center hole */
  variant?: 'pie' | 'donut'
  /** Donut inner radius ratio (0-1, relative to outer). Default 0.55 */
  innerRadiusRatio?: number
  title?: string
  description?: string
  /** Center label shown in donut variant */
  centerLabel?: string
  /** Center sublabel shown in donut variant */
  centerSublabel?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  className?: string
  onSliceClick?: (item: CategoryValue) => void
}

export function PieChart({
  data,
  variant = 'pie',
  innerRadiusRatio = 0.55,
  title,
  description,
  centerLabel,
  centerSublabel,
  height = 300,
  margin = { top: 8, right: 8, bottom: 8, left: 8 },
  formatValue = (v) => formatTooltipValue(v),
  className,
  onSliceClick,
}: PieChartProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  const legendItems: ChartLegendItem[] = data.map((d, i) => ({
    key: d.category,
    label: d.label ?? d.category,
    colorIndex: (d.colorIndex ?? (i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }))

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      legendItems={legendItems}
      tooltip={tooltip}
      empty={data.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <PieChartInner
          dims={dims}
          data={data}
          variant={variant}
          innerRadiusRatio={innerRadiusRatio}
          centerLabel={centerLabel}
          centerSublabel={centerSublabel}
          formatValue={formatValue}
          onSliceClick={onSliceClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

PieChart.displayName = 'PieChart'

function PieChartInner({
  dims,
  data,
  variant,
  innerRadiusRatio,
  centerLabel,
  centerSublabel,
  formatValue,
  onSliceClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: CategoryValue[]
  variant: 'pie' | 'donut'
  innerRadiusRatio: number
  centerLabel?: string
  centerSublabel?: string
  formatValue: (v: number) => string
  onSliceClick?: (item: CategoryValue) => void
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

  const cx = margin.left + innerWidth / 2
  const cy = margin.top + innerHeight / 2
  const outerR = Math.min(innerWidth, innerHeight) / 2
  const innerR = variant === 'donut' ? outerR * innerRadiusRatio : 0

  const pieGen = pie<CategoryValue>()
    .value((d) => d.value)
    .sort(null)
  const arcGen = arc<ReturnType<typeof pieGen>[0]>().innerRadius(innerR).outerRadius(outerR)
  const arcHover = arc<ReturnType<typeof pieGen>[0]>()
    .innerRadius(innerR)
    .outerRadius(outerR + 6)

  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  const slices = pieGen(data)
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <g>
      <g transform={`translate(${cx},${cy})`}>
        {slices.map((slice, i) => {
          const color =
            seriesColors[(data[i].colorIndex ? data[i].colorIndex! - 1 : i) % seriesColors.length]
          const isHovered = hoveredIndex === i
          const ci = (data[i].colorIndex ?? i + 1) as 1 | 2 | 3 | 4 | 5 | 6
          const pathD = isHovered ? arcHover(slice) : arcGen(slice)
          return (
            <path
              key={data[i].category}
              data-slot="pie-chart-segment"
              d={pathD ?? ''}
              fill={color}
              stroke="white"
              strokeWidth={2}
              data-chart-point={onSliceClick ? '' : undefined}
              role={onSliceClick ? 'button' : undefined}
              aria-label={
                onSliceClick
                  ? `${data[i].label ?? data[i].category}: ${formatValue(data[i].value)}`
                  : undefined
              }
              className={cn('transition-all duration-150', onSliceClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                setHoveredIndex(i)
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                const pct = total > 0 ? ((data[i].value / total) * 100).toFixed(1) : '0'
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: data[i].label ?? data[i].category,
                  items: [
                    { label: '값', value: formatValue(data[i].value), colorIndex: ci },
                    { label: '비율', value: `${pct}%` },
                  ],
                })
              }}
              onMouseLeave={() => {
                setHoveredIndex(null)
                onLeave()
              }}
              onClick={() => onSliceClick?.(data[i])}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSliceClick) {
                  e.preventDefault()
                  onSliceClick(data[i])
                }
              }}
            />
          )
        })}

        {variant === 'donut' && (centerLabel ?? centerSublabel) && (
          <g textAnchor="middle">
            {centerLabel && (
              <text y={-6} fontSize={16} fontWeight={600} fill={axisLabelColor}>
                {centerLabel}
              </text>
            )}
            {centerSublabel && (
              <text y={14} fontSize={11} fill={axisLabelColor} opacity={0.7}>
                {centerSublabel}
              </text>
            )}
          </g>
        )}
      </g>
    </g>
  )
}
