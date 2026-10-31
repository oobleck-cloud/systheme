'use client'

import { scaleBand, scaleLinear, stack } from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin, ChartDimensions } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export type BarChartVariant = 'vertical' | 'horizontal' | 'grouped' | 'stacked' | 'stacked-100'

export interface BarDataItem {
  category: string
  [key: string]: string | number
}

export interface BarChartProps {
  data: BarDataItem[]
  /** Keys from BarDataItem to visualize as bars. First key = series 1. */
  keys: string[]
  /** Series display names for legend/tooltip. Defaults to keys. */
  seriesNames?: string[]
  variant?: BarChartVariant
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  /** Show value labels on bars */
  showValues?: boolean
  /** Format function for value labels and tooltip */
  formatValue?: (v: number) => string
  className?: string
  onBarClick?: (category: string, key: string, value: number) => void
}

export function BarChart({
  data,
  keys,
  seriesNames,
  variant = 'vertical',
  title,
  description,
  height = 300,
  margin,
  showValues = false,
  formatValue = compactFormat,
  className,
  onBarClick,
}: BarChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  const legendItems: ChartLegendItem[] = keys.map((key, i) => ({
    key,
    label: seriesNames?.[i] ?? key,
    colorIndex: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }))

  const isMultiSeries = keys.length > 1

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      legendItems={isMultiSeries ? legendItems : undefined}
      tooltip={tooltip}
      empty={data.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <BarChartInner
          dims={dims}
          data={data}
          keys={keys}
          seriesNames={seriesNames}
          variant={variant}
          showValues={showValues}
          formatValue={formatValue}
          onBarClick={onBarClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
          svgRef={svgRef}
        />
      )}
    </ChartFrame>
  )
}

BarChart.displayName = 'BarChart'

// ── Inner render component ─────────────────────────────────────────────────

interface InnerProps {
  dims: ChartDimensions
  data: BarDataItem[]
  keys: string[]
  seriesNames?: string[]
  variant: BarChartVariant
  showValues: boolean
  formatValue: (v: number) => string
  onBarClick?: (category: string, key: string, value: number) => void
  onHover: (
    x: number,
    y: number,
    content: {
      title?: string
      items: Array<{ label: string; value: string; colorIndex?: number }>
    },
  ) => void
  onLeave: () => void
  svgRef: React.RefObject<SVGSVGElement | null>
}

function BarChartInner({
  dims,
  data,
  keys,
  seriesNames,
  variant,
  showValues,
  formatValue,
  onBarClick,
  onHover,
  onLeave,
}: InnerProps) {
  const { margin, innerWidth, innerHeight } = dims
  const el = null

  const seriesColors = readSeriesColors(el)
  const gridColor = readToken(CHART_TOKENS.grid, el)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, el)
  const axisColor = readToken(CHART_TOKENS.axis, el)

  const categories = data.map((d) => d.category)

  if (variant === 'horizontal') {
    return (
      <HorizontalBars
        dims={dims}
        data={data}
        keys={keys}
        seriesNames={seriesNames}
        formatValue={formatValue}
        showValues={showValues}
        seriesColors={seriesColors}
        gridColor={gridColor}
        axisLabelColor={axisLabelColor}
        axisColor={axisColor}
        onBarClick={onBarClick}
        onHover={onHover}
        onLeave={onLeave}
      />
    )
  }

  if (variant === 'stacked' || variant === 'stacked-100') {
    return (
      <StackedBars
        dims={dims}
        data={data}
        keys={keys}
        seriesNames={seriesNames}
        formatValue={formatValue}
        showValues={showValues}
        normalized={variant === 'stacked-100'}
        seriesColors={seriesColors}
        gridColor={gridColor}
        axisLabelColor={axisLabelColor}
        axisColor={axisColor}
        onBarClick={onBarClick}
        onHover={onHover}
        onLeave={onLeave}
      />
    )
  }

  if (variant === 'grouped') {
    return (
      <GroupedBars
        dims={dims}
        data={data}
        keys={keys}
        seriesNames={seriesNames}
        formatValue={formatValue}
        showValues={showValues}
        seriesColors={seriesColors}
        gridColor={gridColor}
        axisLabelColor={axisLabelColor}
        axisColor={axisColor}
        onBarClick={onBarClick}
        onHover={onHover}
        onLeave={onLeave}
      />
    )
  }

  // vertical (single-series)
  const maxVal = Math.max(0, ...data.map((d) => Number(d[keys[0]] ?? 0)))
  const xScale = scaleBand()
    .domain(categories)
    .range([0, innerWidth])
    .paddingInner(0.2)
    .paddingOuter(0.1)
  const yScale = scaleLinear().domain([0, maxVal]).range([innerHeight, 0]).nice()

  const ticks = yScale.ticks(5)
  const bandW = xScale.bandwidth()

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {/* Gridlines */}
      {ticks.map((t) => (
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
      {/* Bars */}
      {data.map((d) => {
        const val = Number(d[keys[0]] ?? 0)
        const x = xScale(d.category) ?? 0
        const y = yScale(val)
        const barH = innerHeight - y
        return (
          <g key={d.category} data-slot="bar-chart-segment">
            <rect
              x={x}
              y={y}
              width={bandW}
              height={Math.max(0, barH)}
              fill={seriesColors[0]}
              rx={2}
              data-chart-point={onBarClick ? '' : undefined}
              role={onBarClick ? 'button' : undefined}
              aria-label={onBarClick ? `${d.category}: ${formatValue(val)}` : undefined}
              onMouseEnter={(e) => {
                const rect = (
                  e.currentTarget.closest('svg') as SVGSVGElement
                ).getBoundingClientRect()
                const svgX = e.clientX - rect.left
                const svgY = e.clientY - rect.top
                onHover(svgX, svgY, {
                  title: d.category,
                  items: [{ label: keys[0], value: formatValue(val), colorIndex: 1 }],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onBarClick?.(d.category, keys[0], val)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                  e.preventDefault()
                  onBarClick(d.category, keys[0], val)
                }
              }}
              className={cn(onBarClick && 'cursor-pointer')}
            />
            {showValues && barH > 16 && (
              <text
                x={x + bandW / 2}
                y={y + 12}
                textAnchor="middle"
                fontSize={10}
                fill={axisLabelColor}
              >
                {formatValue(val)}
              </text>
            )}
          </g>
        )
      })}
      {/* X-axis */}
      <g transform={`translate(0,${innerHeight})`} data-slot="bar-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {categories.map((cat) => {
          const x = (xScale(cat) ?? 0) + bandW / 2
          return (
            <text key={cat} x={x} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
              {cat}
            </text>
          )
        })}
      </g>
      {/* Y-axis */}
      <g data-slot="bar-chart-y-axis">
        {ticks.map((t) => (
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

// ── Horizontal bars ─────────────────────────────────────────────────────────

interface SharedBarProps {
  dims: ChartDimensions
  data: BarDataItem[]
  keys: string[]
  seriesNames?: string[]
  formatValue: (v: number) => string
  showValues: boolean
  seriesColors: string[]
  gridColor: string
  axisLabelColor: string
  axisColor: string
  onBarClick?: (category: string, key: string, value: number) => void
  onHover: (
    x: number,
    y: number,
    content: {
      title?: string
      items: Array<{ label: string; value: string; colorIndex?: number }>
    },
  ) => void
  onLeave: () => void
}

function HorizontalBars({
  dims,
  data,
  keys,
  formatValue,
  showValues,
  seriesColors,
  gridColor,
  axisLabelColor,
  axisColor,
  onBarClick,
  onHover,
  onLeave,
}: SharedBarProps) {
  const { margin, innerWidth, innerHeight } = dims
  const categories = data.map((d) => d.category)
  const maxVal = Math.max(0, ...data.map((d) => Number(d[keys[0]] ?? 0)))

  const yScale = scaleBand()
    .domain(categories)
    .range([0, innerHeight])
    .paddingInner(0.2)
    .paddingOuter(0.1)
  const xScale = scaleLinear().domain([0, maxVal]).range([0, innerWidth]).nice()
  const ticks = xScale.ticks(5)
  const bandH = yScale.bandwidth()

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {ticks.map((t) => (
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
      {data.map((d) => {
        const val = Number(d[keys[0]] ?? 0)
        const y = yScale(d.category) ?? 0
        const barW = xScale(val)
        return (
          <g key={d.category} data-slot="bar-chart-segment">
            <rect
              x={0}
              y={y}
              width={Math.max(0, barW)}
              height={bandH}
              fill={seriesColors[0]}
              rx={2}
              data-chart-point={onBarClick ? '' : undefined}
              role={onBarClick ? 'button' : undefined}
              aria-label={onBarClick ? `${d.category}: ${formatValue(val)}` : undefined}
              className={cn(onBarClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: d.category,
                  items: [{ label: keys[0], value: formatValue(val), colorIndex: 1 }],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onBarClick?.(d.category, keys[0], val)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                  e.preventDefault()
                  onBarClick(d.category, keys[0], val)
                }
              }}
            />
            {showValues && barW > 24 && (
              <text
                x={barW - 4}
                y={y + bandH / 2 + 4}
                textAnchor="end"
                fontSize={10}
                fill={axisLabelColor}
              >
                {formatValue(val)}
              </text>
            )}
          </g>
        )
      })}
      <g transform={`translate(0,${innerHeight})`} data-slot="bar-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {ticks.map((t) => (
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
      <g data-slot="bar-chart-y-axis">
        {categories.map((cat) => {
          const y = (yScale(cat) ?? 0) + bandH / 2
          return (
            <text key={cat} x={-6} y={y + 4} textAnchor="end" fontSize={10} fill={axisLabelColor}>
              {cat}
            </text>
          )
        })}
      </g>
    </g>
  )
}

// ── Grouped bars ─────────────────────────────────────────────────────────────

function GroupedBars({
  dims,
  data,
  keys,
  seriesNames,
  formatValue,
  showValues,
  seriesColors,
  gridColor,
  axisLabelColor,
  axisColor,
  onBarClick,
  onHover,
  onLeave,
}: SharedBarProps) {
  const { margin, innerWidth, innerHeight } = dims
  const categories = data.map((d) => d.category)
  const maxVal = Math.max(0, ...data.flatMap((d) => keys.map((k) => Number(d[k] ?? 0))))

  const xScale = scaleBand()
    .domain(categories)
    .range([0, innerWidth])
    .paddingInner(0.15)
    .paddingOuter(0.1)
  const xInner = scaleBand().domain(keys).range([0, xScale.bandwidth()]).padding(0.05)
  const yScale = scaleLinear().domain([0, maxVal]).range([innerHeight, 0]).nice()
  const ticks = yScale.ticks(5)

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {ticks.map((t) => (
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
      {data.map((d) => {
        const gx = xScale(d.category) ?? 0
        return (
          <g key={d.category} transform={`translate(${gx},0)`} data-slot="bar-chart-segment">
            {keys.map((k, ki) => {
              const val = Number(d[k] ?? 0)
              const bx = xInner(k) ?? 0
              const y = yScale(val)
              const bh = innerHeight - y
              const ci = ((ki % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
              return (
                <rect
                  key={k}
                  x={bx}
                  y={y}
                  width={xInner.bandwidth()}
                  height={Math.max(0, bh)}
                  fill={seriesColors[ki % seriesColors.length]}
                  rx={2}
                  data-chart-point={onBarClick ? '' : undefined}
                  role={onBarClick ? 'button' : undefined}
                  aria-label={
                    onBarClick
                      ? `${d.category}, ${seriesNames?.[ki] ?? k}: ${formatValue(val)}`
                      : undefined
                  }
                  className={cn(onBarClick && 'cursor-pointer')}
                  onMouseEnter={(e) => {
                    const r = (
                      e.currentTarget.closest('svg') as SVGSVGElement
                    ).getBoundingClientRect()
                    onHover(e.clientX - r.left, e.clientY - r.top, {
                      title: d.category,
                      items: [
                        { label: seriesNames?.[ki] ?? k, value: formatValue(val), colorIndex: ci },
                      ],
                    })
                  }}
                  onMouseLeave={onLeave}
                  onClick={() => onBarClick?.(d.category, k, val)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                      e.preventDefault()
                      onBarClick(d.category, k, val)
                    }
                  }}
                />
              )
            })}
          </g>
        )
      })}
      <g transform={`translate(0,${innerHeight})`} data-slot="bar-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {categories.map((cat) => {
          const bw = xScale.bandwidth()
          const x = (xScale(cat) ?? 0) + bw / 2
          return (
            <text key={cat} x={x} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
              {cat}
            </text>
          )
        })}
      </g>
      <g data-slot="bar-chart-y-axis">
        {ticks.map((t) => (
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

// ── Stacked bars ─────────────────────────────────────────────────────────────

interface StackedBarProps extends SharedBarProps {
  normalized: boolean
}

function StackedBars({
  dims,
  data,
  keys,
  seriesNames,
  formatValue,
  normalized,
  seriesColors,
  gridColor,
  axisLabelColor,
  axisColor,
  onBarClick,
  onHover,
  onLeave,
}: StackedBarProps) {
  const { margin, innerWidth, innerHeight } = dims
  const categories = data.map((d) => d.category)

  const processedData = React.useMemo(() => {
    if (!normalized) return data
    return data.map((d) => {
      const total = keys.reduce((s, k) => s + Number(d[k] ?? 0), 0)
      const row: BarDataItem = { category: d.category }
      keys.forEach((k) => {
        row[k] = total > 0 ? Number(d[k] ?? 0) / total : 0
      })
      return row
    })
  }, [data, keys, normalized])

  const stackGen = stack<BarDataItem>().keys(keys)
  const layers = stackGen(processedData)
  const maxVal = normalized
    ? 1
    : Math.max(0, ...processedData.map((d) => keys.reduce((s, k) => s + Number(d[k] ?? 0), 0)))

  const xScale = scaleBand()
    .domain(categories)
    .range([0, innerWidth])
    .paddingInner(0.2)
    .paddingOuter(0.1)
  const yScale = scaleLinear().domain([0, maxVal]).range([innerHeight, 0]).nice()
  const ticks = yScale.ticks(5)
  const fmt = normalized ? (v: number) => `${(v * 100).toFixed(0)}%` : formatValue

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {ticks.map((t) => (
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
      {layers.map((layer, li) => (
        <g
          key={layer.key}
          data-slot="bar-chart-segment"
          fill={seriesColors[li % seriesColors.length]}
        >
          {layer.map((d, di) => {
            const x = xScale(categories[di]) ?? 0
            const y0 = yScale(d[1])
            const y1 = yScale(d[0])
            const bh = Math.max(0, y1 - y0)
            const val = d[1] - d[0]
            return (
              <rect
                key={categories[di]}
                x={x}
                y={y0}
                width={xScale.bandwidth()}
                height={bh}
                rx={li === layers.length - 1 ? 2 : 0}
                data-chart-point={onBarClick ? '' : undefined}
                role={onBarClick ? 'button' : undefined}
                aria-label={
                  onBarClick
                    ? `${categories[di]}, ${seriesNames?.[li] ?? layer.key}: ${fmt(val)}`
                    : undefined
                }
                className={cn(onBarClick && 'cursor-pointer')}
                onMouseEnter={(e) => {
                  const r = (
                    e.currentTarget.closest('svg') as SVGSVGElement
                  ).getBoundingClientRect()
                  const ci = ((li % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
                  onHover(e.clientX - r.left, e.clientY - r.top, {
                    title: categories[di],
                    items: [
                      { label: seriesNames?.[li] ?? layer.key, value: fmt(val), colorIndex: ci },
                    ],
                  })
                }}
                onMouseLeave={onLeave}
                onClick={() => onBarClick?.(categories[di], layer.key, val)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && onBarClick) {
                    e.preventDefault()
                    onBarClick(categories[di], layer.key, val)
                  }
                }}
              />
            )
          })}
        </g>
      ))}
      <g transform={`translate(0,${innerHeight})`} data-slot="bar-chart-x-axis">
        <line x1={0} x2={innerWidth} stroke={axisColor} />
        {categories.map((cat) => {
          const bw = xScale.bandwidth()
          const x = (xScale(cat) ?? 0) + bw / 2
          return (
            <text key={cat} x={x} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
              {cat}
            </text>
          )
        })}
      </g>
      <g data-slot="bar-chart-y-axis">
        {ticks.map((t) => (
          <text
            key={t}
            x={-6}
            y={yScale(t) + 4}
            textAnchor="end"
            fontSize={10}
            fill={axisLabelColor}
          >
            {fmt(t)}
          </text>
        ))}
      </g>
    </g>
  )
}
