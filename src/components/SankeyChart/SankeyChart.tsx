'use client'

import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import * as React from 'react'

import type { ChartMargin, SankeyNode, SankeyLink } from '@/utils/chart/types'
import type { SankeyNode as D3SankeyNode, SankeyLink as D3SankeyLink } from 'd3-sankey'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { compactFormat } from '@/utils/chart/axes'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface SankeyChartProps {
  nodes: SankeyNode[]
  links: SankeyLink[]
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  formatValue?: (v: number) => string
  nodeWidth?: number
  nodePadding?: number
  className?: string
  onNodeClick?: (node: SankeyNode) => void
  onLinkClick?: (link: SankeyLink) => void
}

export function SankeyChart({
  nodes,
  links,
  title,
  description,
  height = 400,
  margin = { top: 16, right: 16, bottom: 16, left: 16 },
  formatValue = compactFormat,
  nodeWidth = 20,
  nodePadding = 12,
  className,
  onNodeClick,
  onLinkClick,
}: SankeyChartProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      tooltip={tooltip}
      empty={nodes.length === 0 || links.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <SankeyInner
          dims={dims}
          nodes={nodes}
          links={links}
          formatValue={formatValue}
          nodeWidth={nodeWidth}
          nodePadding={nodePadding}
          onNodeClick={onNodeClick}
          onLinkClick={onLinkClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

SankeyChart.displayName = 'SankeyChart'

function SankeyInner({
  dims,
  nodes,
  links,
  formatValue,
  nodeWidth,
  nodePadding,
  onNodeClick,
  onLinkClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  nodes: SankeyNode[]
  links: SankeyLink[]
  formatValue: (v: number) => string
  nodeWidth: number
  nodePadding: number
  onNodeClick?: (node: SankeyNode) => void
  onLinkClick?: (link: SankeyLink) => void
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

  const nodeIdMap = new Map(nodes.map((n, i) => [n.id, i]))

  const sankeyLinks = links.map((l) => ({
    source: nodeIdMap.get(l.source) ?? 0,
    target: nodeIdMap.get(l.target) ?? 0,
    value: l.value,
    _originalLink: l,
  }))

  type SNode = D3SankeyNode<
    { name: string; id: string; _originalNode: SankeyNode },
    { _originalLink: SankeyLink }
  >
  type SLink = D3SankeyLink<
    { name: string; id: string; _originalNode: SankeyNode },
    { _originalLink: SankeyLink }
  >

  const sankeyGen = sankey<
    { name: string; id: string; _originalNode: SankeyNode },
    { _originalLink: SankeyLink }
  >()
    .nodeWidth(nodeWidth)
    .nodePadding(nodePadding)
    .extent([
      [0, 0],
      [innerWidth, innerHeight],
    ])

  const graph = sankeyGen({
    nodes: nodes.map((n) => ({ name: n.name, id: n.id, _originalNode: n })),
    links: sankeyLinks as any,
  })

  const linkPath = sankeyLinkHorizontal()

  return (
    <g transform={`translate(${margin.left},${margin.top})`}>
      {/* Links */}
      {graph.links.map((link, i) => {
        const d = linkPath(link as any) ?? ''
        const sourceIndex = (link.source as SNode).index ?? 0
        const color = seriesColors[sourceIndex % seriesColors.length]
        const orig = (link as any)._originalLink as SankeyLink
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={color}
            strokeOpacity={0.35}
            strokeWidth={Math.max(1, link.width ?? 1)}
            data-chart-point={onLinkClick ? '' : undefined}
            role={onLinkClick ? 'button' : undefined}
            aria-label={
              onLinkClick
                ? `${orig.source} → ${orig.target}: ${formatValue(orig.value)}`
                : undefined
            }
            className={cn(onLinkClick && 'cursor-pointer', 'hover:stroke-opacity-60')}
            onMouseEnter={(e) => {
              const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - r.left, e.clientY - r.top, {
                title: `${orig.source} → ${orig.target}`,
                items: [{ label: '값', value: formatValue(orig.value) }],
              })
            }}
            onMouseLeave={onLeave}
            onClick={() => onLinkClick?.(orig)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && onLinkClick) {
                e.preventDefault()
                onLinkClick(orig)
              }
            }}
          />
        )
      })}

      {/* Nodes */}
      {graph.nodes.map((node, i) => {
        const color = seriesColors[i % seriesColors.length]
        const orig = (node as any)._originalNode as SankeyNode
        const x0 = node.x0 ?? 0
        const y0 = node.y0 ?? 0
        const x1 = node.x1 ?? 0
        const y1 = node.y1 ?? 0
        const nodeH = y1 - y0
        const ci = ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
        return (
          <g key={node.id ?? i} data-slot="sankey-chart-segment">
            <rect
              x={x0}
              y={y0}
              width={x1 - x0}
              height={Math.max(2, nodeH)}
              fill={color}
              rx={2}
              data-chart-point={onNodeClick ? '' : undefined}
              role={onNodeClick ? 'button' : undefined}
              aria-label={onNodeClick ? `${orig.name}: ${formatValue(node.value ?? 0)}` : undefined}
              className={cn(onNodeClick && 'cursor-pointer')}
              onMouseEnter={(e) => {
                const r = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
                const total = node.value ?? 0
                onHover(e.clientX - r.left, e.clientY - r.top, {
                  title: orig.name,
                  items: [{ label: '총 흐름', value: formatValue(total), colorIndex: ci }],
                })
              }}
              onMouseLeave={onLeave}
              onClick={() => onNodeClick?.(orig)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onNodeClick) {
                  e.preventDefault()
                  onNodeClick(orig)
                }
              }}
            />
            <text
              x={x0 < innerWidth / 2 ? x1 + 6 : x0 - 6}
              y={y0 + nodeH / 2 + 4}
              textAnchor={x0 < innerWidth / 2 ? 'start' : 'end'}
              fontSize={11}
              fill={axisLabelColor}
            >
              {orig.name}
            </text>
          </g>
        )
      })}
    </g>
  )
}
