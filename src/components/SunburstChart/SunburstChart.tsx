'use client'

import { hierarchy, partition, arc } from 'd3'
import * as React from 'react'

import type { ChartMargin, HierarchyDatum } from '@/utils/chart/types'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface SunburstChartProps {
  data: HierarchyDatum
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  /** Maximum depth to render (0 = all) */
  maxDepth?: number
  className?: string
  onNodeClick?: (node: HierarchyDatum, path: string[]) => void
}

export function SunburstChart({
  data,
  title,
  description,
  height = 400,
  margin = { top: 8, right: 8, bottom: 8, left: 8 },
  formatValue = compactFormat,
  maxDepth = 0,
  className,
  onNodeClick,
}: SunburstChartProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  const isEmpty = !data.children || data.children.length === 0

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      tooltip={tooltip}
      empty={isEmpty}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <SunburstInner
          dims={dims}
          data={data}
          formatValue={formatValue}
          maxDepth={maxDepth}
          onNodeClick={onNodeClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

SunburstChart.displayName = 'SunburstChart'

function SunburstInner({
  dims,
  data,
  formatValue,
  maxDepth,
  onNodeClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: HierarchyDatum
  formatValue: (v: number) => string
  maxDepth: number
  onNodeClick?: (node: HierarchyDatum, path: string[]) => void
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

  const root = hierarchy<HierarchyDatum>(data)
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  const partitionLayout = partition<HierarchyDatum>().size([2 * Math.PI, outerR])
  partitionLayout(root)

  const maxD = maxDepth > 0 ? maxDepth : root.height

  const arcGen = arc<ReturnType<typeof root.descendants>[0]>()
    .startAngle((d) => (d as any).x0)
    .endAngle((d) => (d as any).x1)
    .innerRadius((d) => (d as any).y0)
    .outerRadius((d) => (d as any).y1 - 1)
    .padAngle(0.005)
    .padRadius(outerR / 3)

  function getPath(node: ReturnType<typeof root.descendants>[0]): string[] {
    const path: string[] = []
    let cur: typeof node | null = node
    while (cur) {
      path.unshift(cur.data.name)
      cur = cur.parent
    }
    return path
  }

  const descendants = root.descendants().filter((d) => d.depth <= maxD && d.depth > 0)

  // Assign colors by top-level parent
  const topChildren = root.children ?? []
  const colorByName = new Map(
    topChildren.map((c, i) => [c.data.name, seriesColors[i % seriesColors.length]]),
  )

  function getColor(node: ReturnType<typeof root.descendants>[0]): string {
    let cur: typeof node | null = node
    while (cur) {
      if (colorByName.has(cur.data.name)) return colorByName.get(cur.data.name)!
      cur = cur.parent
    }
    return seriesColors[0]
  }

  return (
    <g transform={`translate(${cx},${cy})`}>
      {descendants.map((node, i) => {
        const color = getColor(node)
        const depthOpacity = 1 - node.depth * 0.15
        const path = getPath(node)
        const ci = ((topChildren.findIndex((c) => c.data.name === path[1]) % 6) + 1) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6

        const x0 = (node as any).x0
        const x1 = (node as any).x1
        const midAngle = (x0 + x1) / 2 - Math.PI / 2
        const y0 = (node as any).y0
        const y1 = (node as any).y1
        const midR = (y0 + y1) / 2
        const arcW = x1 - x0
        const arcH = y1 - y0
        const showLabel = arcW * midR > 30 && arcH > 12

        return (
          <g key={i} data-slot="sunburst-chart-segment">
            <path
              d={arcGen(node as any) ?? ''}
              fill={color}
              fillOpacity={depthOpacity * 0.85}
              stroke="white"
              strokeWidth={1}
              data-chart-point={onNodeClick ? '' : undefined}
              role={onNodeClick ? 'button' : undefined}
              aria-label={
                onNodeClick ? `${node.data.name}: ${formatValue(node.value ?? 0)}` : undefined
              }
              className={cn(onNodeClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: node.data.name,
                  items: [
                    { label: '값', value: formatValue(node.value ?? 0), colorIndex: ci },
                    { label: '경로', value: path.slice(1).join(' > ') },
                  ],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onNodeClick?.(node.data, path)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onNodeClick) {
                  e.preventDefault()
                  onNodeClick(node.data, path)
                }
              }}
            />
            {showLabel && (
              <text
                transform={`rotate(${(midAngle * 180) / Math.PI}) translate(${midR},0) rotate(${midAngle > Math.PI / 2 ? 180 : 0})`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={Math.min(11, arcH * 0.6)}
                fill="white"
                style={{ pointerEvents: 'none' }}
              >
                {node.data.name}
              </text>
            )}
          </g>
        )
      })}

      {/* Center label */}
      <text textAnchor="middle" y={4} fontSize={13} fontWeight={500} fill={axisLabelColor}>
        {data.name}
      </text>
    </g>
  )
}
