'use client'

import { hierarchy, treemap, treemapSquarify } from 'd3'
import * as React from 'react'

import type { ChartMargin, HierarchyDatum } from '@/utils/chart/types'
import type { HierarchyRectangularNode } from 'd3'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface TreemapChartProps {
  data: HierarchyDatum
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  /** Minimum cell area in px² to show label */
  labelThreshold?: number
  className?: string
  onCellClick?: (node: HierarchyDatum, path: string[]) => void
}

export function TreemapChart({
  data,
  title,
  description,
  height = 400,
  margin = { top: 8, right: 8, bottom: 8, left: 8 },
  formatValue = compactFormat,
  labelThreshold = 1200,
  className,
  onCellClick,
}: TreemapChartProps) {
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
        <TreemapInner
          dims={dims}
          data={data}
          formatValue={formatValue}
          labelThreshold={labelThreshold}
          onCellClick={onCellClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

TreemapChart.displayName = 'TreemapChart'

function TreemapInner({
  dims,
  data,
  formatValue,
  labelThreshold,
  onCellClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  data: HierarchyDatum
  formatValue: (v: number) => string
  labelThreshold: number
  onCellClick?: (node: HierarchyDatum, path: string[]) => void
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

  const root = hierarchy<HierarchyDatum>(data)
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  const treemapLayout = treemap<HierarchyDatum>()
    .size([innerWidth, innerHeight])
    .tile(treemapSquarify)
    .paddingOuter(4)
    .paddingInner(2)
    .round(true)

  treemapLayout(root as HierarchyRectangularNode<HierarchyDatum>)

  type RectNode = HierarchyRectangularNode<HierarchyDatum>

  // Color by top-level category
  const topLevelChildren = (root as RectNode).children ?? []
  const colorByName = new Map(
    topLevelChildren.map((c, i) => [c.data.name, seriesColors[i % seriesColors.length]]),
  )

  const leaves = (root as RectNode).leaves()

  function getColor(node: RectNode): string {
    let cur: RectNode | null = node
    while (cur) {
      if (colorByName.has(cur.data.name)) return colorByName.get(cur.data.name)!
      cur = cur.parent as RectNode | null
    }
    return seriesColors[0]
  }

  function getPath(node: RectNode): string[] {
    const path: string[] = []
    let cur: RectNode | null = node
    while (cur) {
      path.unshift(cur.data.name)
      cur = cur.parent as RectNode | null
    }
    return path
  }

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {leaves.map((leaf, i) => {
        const x = leaf.x0
        const y = leaf.y0
        const w = leaf.x1 - leaf.x0
        const h = leaf.y1 - leaf.y0
        const area = w * h
        const color = getColor(leaf as RectNode)
        const ci = ((topLevelChildren.findIndex(
          (c) => c.data.name === (leaf.parent?.data.name ?? leaf.data.name),
        ) %
          6) +
          1) as 1 | 2 | 3 | 4 | 5 | 6
        const path = getPath(leaf as RectNode)

        return (
          <g key={i} data-slot="treemap-chart-segment">
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              fillOpacity={0.8}
              stroke="white"
              strokeWidth={1}
              rx={2}
              data-chart-point={onCellClick ? '' : undefined}
              role={onCellClick ? 'button' : undefined}
              aria-label={
                onCellClick ? `${leaf.data.name}: ${formatValue(leaf.value ?? 0)}` : undefined
              }
              className={cn(onCellClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: leaf.data.name,
                  items: [
                    { label: '값', value: formatValue(leaf.value ?? 0), colorIndex: ci },
                    { label: '경로', value: path.slice(1).join(' > ') },
                  ],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onCellClick?.(leaf.data, path)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onCellClick) {
                  e.preventDefault()
                  onCellClick(leaf.data, path)
                }
              }}
            />
            {area >= labelThreshold && (
              <>
                <text
                  x={x + w / 2}
                  y={y + h / 2 - 4}
                  textAnchor="middle"
                  fontSize={Math.min(12, w / 5)}
                  fill="white"
                  fontWeight={500}
                  style={{ pointerEvents: 'none' }}
                >
                  {leaf.data.name.length > Math.floor(w / 7)
                    ? leaf.data.name.slice(0, Math.floor(w / 7)) + '…'
                    : leaf.data.name}
                </text>
                <text
                  x={x + w / 2}
                  y={y + h / 2 + 12}
                  textAnchor="middle"
                  fontSize={Math.min(10, w / 6)}
                  fill="white"
                  opacity={0.85}
                  style={{ pointerEvents: 'none' }}
                >
                  {formatValue(leaf.value ?? 0)}
                </text>
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}
