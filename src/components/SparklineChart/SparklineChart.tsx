'use client'

import { forwardRef, useMemo, useState } from 'react'

import { cn } from '@/utils/cn'

export type SparklineSegment = { id: string; value: number }

export type AxisTick = { id: string; label: string }

export type SparklineChartProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  segments: SparklineSegment[]
  ticks: AxisTick[]
  onPointSelect?: (segmentId: string) => void
}

const SparklineChart = forwardRef<HTMLDivElement, SparklineChartProps>(
  ({ className, segments, ticks, onPointSelect, ...props }, ref) => {
    const n = Math.max(1, segments.length)
    // Roving tabindex: keep a single segment in the tab order, Arrow keys move focus.
    const [focusedIdx, setFocusedIdx] = useState(0)
    const tabStopIdx = Math.min(focusedIdx, segments.length - 1)

    function handleSegmentsKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if (!onPointSelect) return
      const key = e.key
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return
      e.preventDefault()
      let next = tabStopIdx
      if (key === 'ArrowRight') next = Math.min(tabStopIdx + 1, segments.length - 1)
      else if (key === 'ArrowLeft') next = Math.max(tabStopIdx - 1, 0)
      else if (key === 'Home') next = 0
      else if (key === 'End') next = segments.length - 1
      setFocusedIdx(next)
      const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[data-slot="sparkline-chart-point-hit"]',
      )
      buttons[next]?.focus()
    }
    const polyline = useMemo(() => {
      const values = segments.map((s) => s.value)
      const min = Math.min(...values, 0)
      const max = Math.max(...values, 1)
      const span = max - min || 1
      const w = 120
      const h = 36
      return segments
        .map((s, i) => {
          const x = n === 1 ? w / 2 : (i / (n - 1)) * w
          const y = h - ((s.value - min) / span) * h
          return `${x},${y}`
        })
        .join(' ')
    }, [segments, n])

    return (
      <div
        ref={ref}
        data-slot="sparkline-chart-root"
        className={cn('inline-flex flex-col gap-1', className)}
        {...props}
      >
        <div data-slot="sparkline-chart-series" className="relative h-9 w-32">
          <svg
            className="absolute inset-0 text-primary"
            viewBox="0 0 120 36"
            preserveAspectRatio="none"
            aria-hidden
          >
            {segments.length > 1 ? (
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                points={polyline}
              />
            ) : segments.length === 1 ? (
              <circle cx={60} cy={18} r={3} fill="currentColor" />
            ) : null}
          </svg>
          <div
            className="absolute inset-0 flex"
            role={onPointSelect ? 'group' : undefined}
            aria-label={onPointSelect ? '데이터 포인트' : undefined}
            onKeyDown={handleSegmentsKeyDown}
          >
            {segments.map((seg, i) => (
              <span
                key={seg.id}
                data-slot="sparkline-chart-segment"
                className="flex min-w-0 flex-1 justify-center"
              >
                <button
                  type="button"
                  data-slot="sparkline-chart-point-hit"
                  className="h-full w-full max-w-6 bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Point ${seg.id}`}
                  disabled={!onPointSelect}
                  tabIndex={onPointSelect && i !== tabStopIdx ? -1 : undefined}
                  onFocus={() => setFocusedIdx(i)}
                  onClick={() => onPointSelect?.(seg.id)}
                />
              </span>
            ))}
          </div>
        </div>
        <div data-slot="sparkline-chart-axis" className="flex w-32 justify-between gap-1">
          {ticks.map((tick) => (
            <span
              key={tick.id}
              data-slot="sparkline-chart-tick-label"
              className="text-xs text-fg-muted"
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>
    )
  },
)

SparklineChart.displayName = 'SparklineChart'

export { SparklineChart }
