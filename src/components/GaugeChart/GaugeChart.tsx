'use client'

import { arc, scaleLinear } from 'd3'
import * as React from 'react'

import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { cn } from '@/utils/cn'

export type GaugeStatus = 'positive' | 'negative' | 'warning' | 'neutral'

export interface GaugeThreshold {
  value: number
  status: GaugeStatus
}

export interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  /** Threshold breakpoints for color zones */
  thresholds?: GaugeThreshold[]
  title?: string
  description?: string
  /** Label shown below the value */
  valueLabel?: string
  /** Sub-label (e.g. unit) */
  unit?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  className?: string
}

const DEFAULT_THRESHOLDS: GaugeThreshold[] = [
  { value: 0.33, status: 'negative' },
  { value: 0.66, status: 'warning' },
  { value: 1, status: 'positive' },
]

export function GaugeChart({
  value,
  min = 0,
  max = 100,
  thresholds = DEFAULT_THRESHOLDS,
  title,
  description,
  valueLabel,
  unit,
  height = 220,
  margin = { top: 16, right: 16, bottom: 16, left: 16 },
  formatValue = (v) => String(Math.round(v)),
  className,
}: GaugeChartProps) {
  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      empty={false}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <GaugeInner
          dims={dims}
          value={value}
          min={min}
          max={max}
          thresholds={thresholds}
          valueLabel={valueLabel}
          unit={unit}
          formatValue={formatValue}
        />
      )}
    </ChartFrame>
  )
}

GaugeChart.displayName = 'GaugeChart'

function GaugeInner({
  dims,
  value,
  min,
  max,
  thresholds,
  valueLabel,
  unit,
  formatValue,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  value: number
  min: number
  max: number
  thresholds: GaugeThreshold[]
  valueLabel?: string
  unit?: string
  formatValue: (v: number) => string
}) {
  const { margin, innerWidth, innerHeight } = dims

  const positiveColor = readToken(CHART_TOKENS.statusPositive, null)
  const negativeColor = readToken(CHART_TOKENS.statusNegative, null)
  const warningColor = readToken(CHART_TOKENS.statusWarning, null)
  const neutralColor = readToken(CHART_TOKENS.statusNeutral, null)
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)
  const axisTitleColor = readToken(CHART_TOKENS.axisTitle, null)

  function statusColor(status: GaugeStatus) {
    switch (status) {
      case 'positive':
        return positiveColor
      case 'negative':
        return negativeColor
      case 'warning':
        return warningColor
      default:
        return neutralColor
    }
  }

  const cx = margin.left + innerWidth / 2
  const cy = margin.top + innerHeight * 0.8
  const r = Math.min(innerWidth, innerHeight * 2) / 2 - 8
  const innerR = r * 0.65

  // Gauge spans from -π to 0 (half circle)
  const START_ANGLE = -Math.PI
  const END_ANGLE = 0

  const valueScale = scaleLinear().domain([min, max]).range([START_ANGLE, END_ANGLE]).clamp(true)
  const clampedValue = Math.min(max, Math.max(min, value))
  const valueAngle = valueScale(clampedValue)

  // Determine current status color
  const ratio = (clampedValue - min) / (max - min)
  const currentStatus =
    thresholds.find((t) => ratio <= t.value)?.status ??
    thresholds[thresholds.length - 1]?.status ??
    'neutral'
  const currentColor = statusColor(currentStatus)

  // Background arc
  const bgArc = arc<void>()
    .innerRadius(innerR)
    .outerRadius(r)
    .startAngle(START_ANGLE)
    .endAngle(END_ANGLE)

  // Value arc
  const valArc = arc<void>()
    .innerRadius(innerR)
    .outerRadius(r)
    .startAngle(START_ANGLE)
    .endAngle(valueAngle)
    .cornerRadius(2)

  // Needle
  const needleAngle = valueAngle + Math.PI / 2
  const needleLen = r - 4
  const needleX = Math.cos(valueAngle) * (needleLen - 8)
  const needleY = Math.sin(valueAngle) * (needleLen - 8)

  // Threshold zone arcs
  const zoneArcs = thresholds.map((t, i) => {
    const prevRatio = i > 0 ? thresholds[i - 1].value : 0
    const startA = START_ANGLE + (END_ANGLE - START_ANGLE) * prevRatio
    const endA = START_ANGLE + (END_ANGLE - START_ANGLE) * t.value
    const zoneArc = arc<void>()
      .innerRadius(r - 4)
      .outerRadius(r)
      .startAngle(startA)
      .endAngle(endA)
    return { arc: zoneArc, color: statusColor(t.status) }
  })

  return (
    <g transform={`translate(${cx},${cy})`}>
      {/* Background track */}
      <path d={bgArc() ?? ''} fill={gridColor} />

      {/* Threshold color zones */}
      {zoneArcs.map((z, i) => (
        <path key={i} d={z.arc() ?? ''} fill={z.color} opacity={0.6} />
      ))}

      {/* Value fill */}
      <path d={valArc() ?? ''} fill={currentColor} data-slot="gauge-chart-segment" />

      {/* Needle */}
      <line
        x1={0}
        y1={0}
        x2={needleX}
        y2={needleY}
        stroke={axisLabelColor}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={0} cy={0} r={5} fill={axisLabelColor} />

      {/* Value text */}
      <text
        y={-innerR * 0.25}
        textAnchor="middle"
        fontSize={28}
        fontWeight={600}
        fill={currentColor}
      >
        {formatValue(clampedValue)}
        {unit && (
          <tspan fontSize={14} opacity={0.7}>
            {unit}
          </tspan>
        )}
      </text>

      {valueLabel && (
        <text y={innerR * 0.1} textAnchor="middle" fontSize={12} fill={axisTitleColor}>
          {valueLabel}
        </text>
      )}

      {/* Min/max labels */}
      <text x={-r} y={16} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
        {formatValue(min)}
      </text>
      <text x={r} y={16} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
        {formatValue(max)}
      </text>
    </g>
  )
}
