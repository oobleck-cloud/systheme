'use client'

import * as React from 'react'

import type { ChartMargin, ChartDimensions, TooltipState } from '@/utils/chart/types'

import { Panel } from '@/primitives/panel'
import { readToken } from '@/utils/chart/readToken'
import { useChartDimensions } from '@/utils/chart/useChartDimensions'
import { useSvgRovingPoints } from '@/utils/chart/useSvgRovingPoints'
import { cn } from '@/utils/cn'

export interface ChartLegendItem {
  key: string
  label: string
  colorIndex: 1 | 2 | 3 | 4 | 5 | 6
  /** 색 토큰(CSS 변수 이름) — 주면 colorIndex 대신 이 색. 위계 팔레트(`--ds-chart-seq-*`)를 쓰는 차트용. */
  colorToken?: string
  inactive?: boolean
}

/**
 * @internal DS-internal chart shell. Do not import directly from apps — use a
 * specific chart component (BarChart, LineChart, …) instead.
 */
export interface ChartFrameProps {
  /** Accessible title for the chart (also rendered as visible heading when provided) */
  title?: string
  /** Screen-reader description of what the chart shows */
  description?: string
  /** Fixed outer height. If omitted, defaults to 300px via CSS. */
  height?: number
  /** Margin between SVG edge and the plot area. Defaults to DEFAULT_MARGIN. */
  margin?: Partial<ChartMargin>
  /** Legend items to render below the chart. Omit to hide legend. */
  legendItems?: ChartLegendItem[]
  /** Callback when a legend item is clicked (for toggling series visibility) */
  onLegendItemClick?: (key: string) => void
  /** Loading state renders a skeleton overlay */
  loading?: boolean
  /** Empty state shown when there is no data */
  empty?: boolean
  /** Custom empty state content */
  emptyContent?: React.ReactNode
  className?: string
  /** Render prop receiving computed dimensions for child chart content */
  children: (dims: ChartDimensions) => React.ReactNode
  /** Tooltip state managed by the parent chart component */
  tooltip?: TooltipState
}

const SERIES_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
  'bg-chart-6',
] as const

export function ChartFrame({
  title,
  description,
  height = 300,
  margin,
  legendItems,
  onLegendItemClick,
  loading = false,
  empty = false,
  emptyContent,
  className,
  children,
  tooltip,
}: ChartFrameProps) {
  const titleId = React.useId()
  const descId = React.useId()
  const svgRef = React.useRef<SVGSVGElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)

  const { onKeyDown: onPointsKeyDown } = useSvgRovingPoints(svgRef)

  const [containerRef, dims] = useChartDimensions({ margin })

  const ariaProps: React.SVGAttributes<SVGSVGElement> = {
    role: 'img',
    ...(title ? { 'aria-labelledby': titleId } : {}),
    ...(description ? { 'aria-describedby': descId } : {}),
  }

  return (
    <div
      ref={rootRef}
      data-slot="chart-frame-root"
      className={cn('relative flex flex-col gap-2', className)}
    >
      {title && (
        <p id={titleId} data-slot="chart-frame-title" className="text-sm font-medium text-fg">
          {title}
        </p>
      )}
      {description && (
        <span id={descId} className="sr-only">
          {description}
        </span>
      )}

      <div
        ref={containerRef as React.RefCallback<HTMLDivElement>}
        data-slot="chart-frame-canvas"
        className="relative w-full"
        style={{ height }}
      >
        {!loading && !empty && (
          <svg
            ref={svgRef}
            width={dims.width}
            height={dims.height}
            className="overflow-visible"
            onKeyDown={onPointsKeyDown}
            {...ariaProps}
          >
            {children(dims)}
          </svg>
        )}

        {loading && (
          <div
            data-slot="chart-frame-loading"
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-surface"
            aria-busy="true"
            aria-label="차트 데이터 로딩 중"
          >
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        )}

        {!loading && empty && (
          <div
            data-slot="chart-frame-empty"
            className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-border"
          >
            {emptyContent ?? <p className="text-sm text-fg-muted">표시할 데이터가 없습니다</p>}
          </div>
        )}

        {tooltip?.visible && <ChartTooltip tooltip={tooltip} containerRef={rootRef} />}
      </div>

      {legendItems && legendItems.length > 0 && (
        <div data-slot="chart-frame-legend" className="flex flex-wrap gap-x-4 gap-y-1">
          {legendItems.map((item) => (
            <button
              key={item.key}
              data-slot="chart-frame-legend-item"
              type="button"
              onClick={() => onLegendItemClick?.(item.key)}
              className={cn(
                'inline-flex items-center gap-1.5 text-xs transition-opacity',
                item.inactive ? 'text-fg-muted opacity-50' : 'text-fg-subtle hover:text-fg',
                onLegendItemClick ? 'cursor-pointer' : 'cursor-default',
              )}
            >
              <span
                aria-hidden
                className={cn(
                  'inline-block h-2 w-2 shrink-0 rounded-full',
                  !item.colorToken && SERIES_COLORS[(item.colorIndex - 1) % SERIES_COLORS.length],
                )}
                // eslint-disable-next-line design-system/no-inline-style -- 토큰 이름으로 받은 계열 색
                style={item.colorToken ? { backgroundColor: `var(${item.colorToken})` } : undefined}
              />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

ChartFrame.displayName = 'ChartFrame'

// ── Internal tooltip overlay ──────────────────────────────────────────────

interface ChartTooltipProps {
  tooltip: TooltipState
  containerRef: React.RefObject<HTMLDivElement | null>
}

function ChartTooltip({ tooltip, containerRef }: ChartTooltipProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ left: 0, top: 0 })

  React.useLayoutEffect(() => {
    if (!ref.current || !containerRef.current) return
    const container = containerRef.current.getBoundingClientRect()
    const tip = ref.current.getBoundingClientRect()
    const offset = 12

    let left = tooltip.x + offset
    let top = tooltip.y - tip.height / 2

    if (left + tip.width > container.width) left = tooltip.x - tip.width - offset
    if (top < 0) top = 0
    if (top + tip.height > container.height) top = container.height - tip.height

    setPos({ left, top })
  }, [tooltip.x, tooltip.y, containerRef])

  return (
    <Panel
      ref={ref}
      data-slot="chart-frame-tooltip"
      role="tooltip"
      appearance="solid"
      shape="compact"
      position="absolute"
      offset="none"
      scrollHint={false}
      className="z-10 min-w-32 border-border bg-inverse px-3 py-2 text-fg-inverse"
      // eslint-disable-next-line design-system/no-inline-style -- chart pointer position
      style={{ left: pos.left, top: pos.top }}
    >
      {tooltip.title && <p className="mb-1 text-xs font-medium text-fg-inverse">{tooltip.title}</p>}
      <ul className="flex flex-col gap-0.5">
        {tooltip.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-fg-inverse">
            {item.colorIndex != null && (
              <span
                aria-hidden
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: readToken(`--ds-chart-series-${item.colorIndex}`),
                }}
              />
            )}
            <span className="opacity-70">{item.label}</span>
            <span className="ml-auto font-medium">{item.value}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}
