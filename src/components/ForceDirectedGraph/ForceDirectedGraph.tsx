'use client'

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  scaleSqrt,
  extent,
} from 'd3'
import * as React from 'react'

import type { ChartMargin, GraphNode, GraphEdge } from '@/utils/chart/types'
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3'

import { ChartFrame } from '@/components/ChartFrame/ChartFrame'
import { readSeriesColors, readToken, CHART_TOKENS } from '@/utils/chart/readToken'
import { useChartTooltip } from '@/utils/chart/tooltip'
import { cn } from '@/utils/cn'

export interface ForceDirectedGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  title?: string
  description?: string
  height?: number
  margin?: Partial<ChartMargin>
  nodeRadius?: number
  /** How many ticks to run before first render (pre-warm) */
  tickCount?: number
  className?: string
  onNodeClick?: (node: GraphNode) => void
}

interface SimNode extends SimulationNodeDatum {
  id: string
  label?: string
  group?: string | number
  value?: number
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  value?: number
}

export function ForceDirectedGraph({
  nodes,
  edges,
  title,
  description,
  height = 480,
  margin = { top: 8, right: 8, bottom: 8, left: 8 },
  nodeRadius = 8,
  tickCount = 200,
  className,
  onNodeClick,
}: ForceDirectedGraphProps) {
  const { tooltip, showTooltip, hideTooltip } = useChartTooltip()

  return (
    <ChartFrame
      title={title}
      description={description}
      height={height}
      margin={margin}
      tooltip={tooltip}
      empty={nodes.length === 0}
      className={cn('w-full', className)}
    >
      {(dims) => (
        <ForceGraphInner
          dims={dims}
          nodes={nodes}
          edges={edges}
          nodeRadius={nodeRadius}
          tickCount={tickCount}
          onNodeClick={onNodeClick}
          onHover={showTooltip}
          onLeave={hideTooltip}
        />
      )}
    </ChartFrame>
  )
}

ForceDirectedGraph.displayName = 'ForceDirectedGraph'

function ForceGraphInner({
  dims,
  nodes,
  edges,
  nodeRadius,
  tickCount,
  onNodeClick,
  onHover,
  onLeave,
}: {
  dims: ReturnType<typeof import('../../utils/chart/useChartDimensions').useChartDimensions>[1]
  nodes: GraphNode[]
  edges: GraphEdge[]
  nodeRadius: number
  tickCount: number
  onNodeClick?: (node: GraphNode) => void
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
  const cx = margin.left + innerWidth / 2
  const cy = margin.top + innerHeight / 2

  const seriesColors = readSeriesColors(null)
  const gridColor = readToken(CHART_TOKENS.grid, null)
  const axisLabelColor = readToken(CHART_TOKENS.axisLabel, null)

  const [positions, setPositions] = React.useState<Map<string, { x: number; y: number }>>(new Map())

  const valueExtent = extent(nodes, (n) => n.value ?? 1) as [number, number]
  const rScale = scaleSqrt()
    .domain([valueExtent[0] ?? 1, valueExtent[1] ?? 1])
    .range([nodeRadius * 0.6, nodeRadius * 2])

  React.useEffect(() => {
    if (nodes.length === 0) return

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n, x: innerWidth / 2, y: innerHeight / 2 }))
    const nodeMap = new Map(simNodes.map((n) => [n.id, n]))

    const simEdges: SimEdge[] = edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => ({
        source: nodeMap.get(e.source)!,
        target: nodeMap.get(e.target)!,
        value: e.value,
      }))

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          .distance(60),
      )
      .force('charge', forceManyBody().strength(-120))
      .force('center', forceCenter(innerWidth / 2, innerHeight / 2))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => rScale(d.value ?? 1) + 4),
      )
      .stop()

    sim.tick(tickCount)

    const pos = new Map<string, { x: number; y: number }>()
    for (const n of simNodes) {
      pos.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 })
    }
    setPositions(pos)
  }, [nodes, edges, innerWidth, innerHeight, tickCount])

  const groups = [...new Set(nodes.map((n) => String(n.group ?? 'default')))]
  const groupColorMap = new Map(groups.map((g, i) => [g, seriesColors[i % seriesColors.length]]))

  return (
    <g
      role="list"
      aria-label="Force directed graph"
      transform={`translate(${margin.left},${margin.top})`}
    >
      {/* Edges */}
      {edges.map((edge, i) => {
        const s = positions.get(edge.source)
        const t = positions.get(edge.target)
        if (!s || !t) return null
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke={gridColor}
            strokeWidth={edge.value ? Math.min(4, Math.max(1, edge.value / 10)) : 1}
            strokeOpacity={0.6}
          />
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const pos = positions.get(node.id)
        if (!pos) return null
        const color = groupColorMap.get(String(node.group ?? 'default')) ?? seriesColors[0]
        const r = rScale(node.value ?? 1)
        const ci = ((groups.indexOf(String(node.group ?? 'default')) % 6) + 1) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6

        return (
          <g
            key={node.id}
            role={onNodeClick ? 'button' : undefined}
            data-chart-point={onNodeClick ? '' : undefined}
            aria-label={onNodeClick ? (node.label ?? node.id) : undefined}
            data-slot="force-graph-segment"
            className={cn(onNodeClick && 'cursor-pointer outline-none')}
            onKeyDown={(e) => {
              if (!onNodeClick) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNodeClick(node)
              }
            }}
            onMouseEnter={(e) => {
              const rect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect()
              onHover(e.clientX - rect.left, e.clientY - rect.top, {
                title: node.label ?? node.id,
                items: [
                  ...(node.group != null
                    ? [{ label: '그룹', value: String(node.group), colorIndex: ci }]
                    : []),
                  ...(node.value != null ? [{ label: '값', value: String(node.value) }] : []),
                ],
              })
            }}
            onMouseLeave={onLeave}
            onClick={() => onNodeClick?.(node)}
          >
            <circle
              cx={pos.x}
              cy={pos.y}
              r={r}
              fill={color}
              fillOpacity={0.8}
              stroke="white"
              strokeWidth={1.5}
              className="transition-opacity hover:opacity-100"
              aria-hidden="true"
            />
            {r > 10 && (
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize={Math.min(10, r)}
                fill="white"
                style={{ pointerEvents: 'none' }}
                aria-hidden="true"
              >
                {(node.label ?? node.id).slice(0, 6)}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}
