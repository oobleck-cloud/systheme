'use client'

import {
  scaleLinear,
  scaleBand,
  area as d3Area,
  line as d3Line,
  curveMonotoneX,
  stack,
  min,
  max,
} from 'd3'
import * as React from 'react'

import type { ChartLegendItem } from '@/components/ChartFrame/ChartFrame'
import type { ChartMargin } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface AreaDataPoint {
  x: number | string
  [key: string]: number | string
}

export interface AreaChartProps {
  data: AreaDataPoint[]
  /** Keys to render as separate area layers */
  keys: string[]
  seriesNames?: string[]
  /** 'stacked' stacks areas; 'standard' overlaps them */
  variant?: 'standard' | 'stacked'
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatY?: (v: number) => string
  className?: string
  onAreaClick?: (key: string, x: string | number) => void
  /**
   * 계열 색을 토큰 이름(CSS 변수)으로 — `keys` 와 같은 순서. 주지 않으면 범주 팔레트(series-1~6).
   * 계열이 깔때기(참여 ⊇ 노출 ⊇ 계약)처럼 위계가 있으면 `--ds-chart-status-neutral` → `--ds-chart-seq-mid`
   * → `--ds-chart-seq-high` 처럼 결과에 가까울수록 진하게 준다. 범주색은 서로 다른 것을 말할 때만.
   */
  seriesTokens?: string[]
  /**
   * 오른쪽 축 막대 계열(standard 전용). 크기가 한 자릿수 다른 계열(예: 참여 300 · 계약 30)을 한 그래프에서
   * 읽게 한다 — 같은 축에 두면 작은 계열이 바닥에 붙는다. 범례에 「(오른쪽 축)」이 붙는다.
   */
  bars?: Array<{ key: string; name?: string; token?: string }>
}

export function AreaChart({
  data,
  keys,
  seriesNames,
  variant = 'standard',
  title,
  description,
  height = 300,
  margin,
  formatY = compactFormat,
  className,
  onAreaClick,
  seriesTokens,
  bars = [],
}: AreaChartProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()
  const barSeries = variant === 'standard' ? bars : []

  const legendItems: ChartLegendItem[] = [
    ...keys.map((key, i) => ({
      key,
      label: seriesNames?.[i] ?? key,
      colorIndex: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
      ...(seriesTokens?.[i] ? { colorToken: seriesTokens[i] } : {}),
    })),
    ...barSeries.map((b, i) => ({
      key: b.key,
      label: `${b.name ?? b.key} (오른쪽 축)`,
      colorIndex: (((keys.length + i) % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
      ...(b.token ? { colorToken: b.token } : {}),
    })),
  ]

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={barSeries.length > 0 ? { right: 36, ...margin } : margin}
      legendItems={legendItems.length > 1 ? legendItems : undefined}
      tooltip={tooltip}
      empty={data.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <AreaChartInner
          dims={dims}
          data={data}
          keys={keys}
          seriesNames={seriesNames}
          variant={variant}
          formatY={formatY}
          onAreaClick={onAreaClick}
          seriesTokens={seriesTokens}
          bars={barSeries}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

AreaChart.displayName = 'AreaChart'

function AreaChartInner({
  dims,
  data,
  keys,
  seriesNames,
  variant,
  formatY,
  onAreaClick,
  seriesTokens,
  bars,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: AreaDataPoint[]
  keys: string[]
  seriesNames?: string[]
  variant: 'standard' | 'stacked'
  formatY: (v: number) => string
  onAreaClick?: (key: string, x: string | number) => void
  seriesTokens?: string[]
  bars: Array<{ key: string; name?: string; token?: string }>
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
  const categorical = readSeriesColors(null)
  const seriesColors = keys.map(
    (_, i) =>
      (seriesTokens?.[i] ? readToken(seriesTokens[i], null) : '') ||
      categorical[i % categorical.length]!,
  )
  const barColor = (b: { token?: string }, i: number) =>
    (b.token ? readToken(b.token, null) : '') ||
    categorical[(keys.length + i) % categorical.length]!
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisColor = readToken(CHART_TOKENS.axis, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  const xValues = data.map((d) => d.x)
  const xScale = scaleLinear()
    .domain([0, data.length - 1])
    .range([0, innerWidth])

  let yMax: number
  let yMin = 0

  if (variant === 'stacked') {
    const stackGen = stack<AreaDataPoint>().keys(keys)
    const layers = stackGen(data)
    yMax = max(layers, (layer) => max(layer, (d: number[]) => d[1])) ?? 1

    const yScale = scaleLinear().domain([0, yMax]).range([innerHeight, 0]).nice()
    const yTicks = yScale.ticks(5)

    const areaGen = d3Area<[number, number]>()
      .x((_: [number, number], i: number) => xScale(i))
      .y0((d: [number, number]) => yScale(d[0]))
      .y1((d: [number, number]) => yScale(d[1]))
      .curve(curveMonotoneX)

    return (
      <g transform={`translate(${margin.left},${margin.top})`}>
        {yTicks.map((t: number) => (
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
        {layers.map((layer, li: number) => {
          const color = seriesColors[li % seriesColors.length]
          const pathD = areaGen(layer.map((d) => [d[0], d[1]] as [number, number])) ?? ''
          return (
            <path
              key={layer.key}
              data-slot="area-chart-segment"
              d={pathD}
              fill={color}
              fillOpacity={0.7}
              stroke={color}
              strokeWidth={1.5}
            />
          )
        })}
        <XAxis
          xValues={xValues}
          xScale={xScale}
          innerHeight={innerHeight}
          axisColor={axisColor}
          axisLabelColor={axisLabelColor}
        />
        <YAxis yScale={yScale} yTicks={yTicks} formatY={formatY} axisLabelColor={axisLabelColor} />
      </g>
    )
  }

  // standard — overlapping areas
  // 막대가 있으면 x 를 칸 가운데에 둔다 — 면의 꼭짓점과 막대가 같은 날 위에 선다.
  const band = scaleBand<number>()
    .domain(data.map((_, i) => i))
    .range([0, innerWidth])
    .padding(0.72)
  const xAt = (i: number) =>
    bars.length > 0 ? (band(i) ?? 0) + band.bandwidth() / 2 : (xScale(i) as number)
  const yRight = scaleLinear()
    // 막대는 아래 절반 남짓만 쓴다 — 면과 겹쳐도 선이 가리지 않게.
    .domain([0, (max(data.flatMap((d) => bars.map((b) => Number(d[b.key] ?? 0)))) ?? 1) * 2])
    .range([innerHeight, 0])
    .nice()
  const allVals = data.flatMap((d) => keys.map((k) => Number(d[k] ?? 0)))
  yMin = Math.min(0, min(allVals) ?? 0)
  yMax = max(allVals) ?? 1
  const yScale = scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]).nice()
  const yTicks = yScale.ticks(5)

  const areaGen = d3Area<number>()
    .x((_: number, i: number) => xAt(i))
    .y0(yScale(0))
    .y1((d: number) => yScale(d))
    .curve(curveMonotoneX)

  const lineGen = d3Line<number>()
    .x((_: number, i: number) => xAt(i))
    .y((d: number) => yScale(d))
    .curve(curveMonotoneX)

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {yTicks.map((t: number) => (
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
      {[...keys].reverse().map((key, ri) => {
        const ki = keys.length - 1 - ri
        const color = seriesColors[ki % seriesColors.length]
        const vals = data.map((d) => Number(d[key] ?? 0))
        return (
          <g key={key} data-slot="area-chart-segment">
            <path d={areaGen(vals) ?? ''} fill={color} fillOpacity={0.15} stroke="none" />
            <path
              d={lineGen(vals) ?? ''}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        )
      })}
      {bars.map((b, bi) =>
        data.map((d, i) => {
          const v = Number(d[b.key] ?? 0)
          const w = band.bandwidth() / bars.length
          return (
            <rect
              key={`${b.key}-${String(i)}`}
              data-slot="area-chart-bar"
              x={(band(i) ?? 0) + bi * w}
              y={yRight(v) as number}
              width={w}
              height={innerHeight - (yRight(v) as number)}
              rx={3}
              fill={barColor(b, bi)}
            />
          )
        }),
      )}
      <XAxis
        xValues={xValues}
        xAt={xAt}
        innerHeight={innerHeight}
        axisColor={axisColor}
        axisLabelColor={axisLabelColor}
        width={innerWidth}
      />
      <YAxis yScale={yScale} yTicks={yTicks} formatY={formatY} axisLabelColor={axisLabelColor} />
      {bars.length > 0 ? (
        <g data-slot="area-chart-y-axis-right">
          {/* 막대는 건수다 — 0.5 같은 눈금은 뜻이 없다 */}
          {yRight
            .ticks(5)
            .filter((t: number) => Number.isInteger(t))
            .map((t: number) => (
              <text
                key={t}
                x={innerWidth + 6}
                y={(yRight(t) as number) + 4}
                textAnchor="start"
                fontSize={10}
                fill={barColor(bars[0]!, 0)}
              >
                {formatY(t)}
              </text>
            ))}
        </g>
      ) : null}
    </g>
  )
}

function XAxis({
  xValues,
  xScale,
  xAt,
  innerHeight,
  axisColor,
  axisLabelColor,
  width,
}: {
  xValues: (string | number)[]
  xScale?: ReturnType<typeof scaleLinear>
  /** 칸 가운데 정렬처럼 선형이 아닌 x 자리 — 주면 xScale 대신 쓴다. */
  xAt?: (i: number) => number
  innerHeight: number
  axisColor: string
  axisLabelColor: string
  width?: number
}) {
  const at = (i: number) => (xAt ? xAt(i) : (xScale!(i) as number))
  const step = Math.max(1, Math.floor(xValues.length / 7))
  const shown = xValues.filter(
    (_v: string | number, i: number) => i % step === 0 || i === xValues.length - 1,
  )
  return (
    <g transform={`translate(0,${innerHeight})`} data-slot="area-chart-x-axis">
      <line x1={0} x2={width ?? at(xValues.length - 1)} stroke={axisColor} />
      {shown.map((v, i) => {
        const idx = xValues.indexOf(v)
        return (
          <text key={i} x={at(idx)} y={14} textAnchor="middle" fontSize={10} fill={axisLabelColor}>
            {String(v)}
          </text>
        )
      })}
    </g>
  )
}

function YAxis({
  yScale,
  yTicks,
  formatY,
  axisLabelColor,
}: {
  yScale: ReturnType<typeof scaleLinear>
  yTicks: number[]
  formatY: (v: number) => string
  axisLabelColor: string
}) {
  return (
    <g data-slot="area-chart-y-axis">
      {yTicks.map((t: number) => (
        <text
          key={t}
          x={-6}
          y={(yScale(t) as number) + 4}
          textAnchor="end"
          fontSize={10}
          fill={axisLabelColor}
        >
          {formatY(t)}
        </text>
      ))}
    </g>
  )
}
