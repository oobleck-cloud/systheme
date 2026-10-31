'use client'

import { cva } from 'class-variance-authority'
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useDismissOnEscape, usePointerDownOutside } from '@/primitives/anchorPopover'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

const TOOLTIP_ANCHOR_GAP_PX = 6
const TOOLTIP_ESTIMATED_HEIGHT_PX = 56

function getOverflowScrollAncestors(start: HTMLElement | null): HTMLElement[] {
  const list: HTMLElement[] = []
  let cur = start?.parentElement ?? null
  while (cur) {
    const s = getComputedStyle(cur)
    if (/(auto|scroll|overlay)/.test(`${s.overflowX}${s.overflowY}`)) {
      list.push(cur)
    }
    cur = cur.parentElement
  }
  return list
}

type TooltipPlacement = 'top' | 'bottom'

type TooltipPosition = {
  top: number
  left: number
  placement: TooltipPlacement
}

export type GraphCell = {
  /** Column key (must match an entry in `xLabels`). */
  x: string
  /** Row key (must match an entry in `yLabels`). */
  y: string
  value: number
}

export const GRAPH_LEVELS = [0, 1, 2, 3, 4, 5] as const
export type GraphLevel = (typeof GRAPH_LEVELS)[number]

/** Tailwind class strings per intensity level (0 = empty/low … 5 = max). */
export type ContributionGraphColorScale = Record<GraphLevel, string>

/** Primary hue for levels 1–5; level 0 uses the lightest step of the same hue unless overridden. */
export type ContributionGraphPrimary = 'green' | 'red' | 'blue' | 'amber'

/** Full level 0–5 scales per primary hue (Tailwind palette steps). */
export const contributionGraphPrimaryScales: Record<
  ContributionGraphPrimary,
  ContributionGraphColorScale
> = {
  green: {
    0: 'bg-green-50',
    1: 'bg-green-200 text-white',
    2: 'bg-green-300 text-white',
    3: 'bg-green-400 text-white',
    4: 'bg-green-500 text-white',
    5: 'bg-green-600 text-white',
  },
  red: {
    0: 'bg-red-50',
    1: 'bg-red-200 text-white',
    2: 'bg-red-300 text-white',
    3: 'bg-red-400 text-white',
    4: 'bg-red-500 text-white',
    5: 'bg-red-600 text-white',
  },
  blue: {
    0: 'bg-blue-50',
    1: 'bg-blue-200 text-white',
    2: 'bg-blue-300 text-white',
    3: 'bg-blue-400 text-white',
    4: 'bg-blue-500 text-white',
    5: 'bg-blue-600 text-white',
  },
  amber: {
    0: 'bg-amber-50',
    1: 'bg-amber-200 text-white',
    2: 'bg-amber-300 text-white',
    3: 'bg-amber-400 text-white',
    4: 'bg-amber-500 text-white',
    5: 'bg-amber-600 text-white',
  },
}

/** Builds a complete 0–5 scale from {@link primary}, with per-level overrides. */
export function buildContributionGraphColorScale(
  primary: ContributionGraphPrimary = 'green',
  overrides?: Partial<ContributionGraphColorScale>,
): ContributionGraphColorScale {
  const base = contributionGraphPrimaryScales[primary]
  if (overrides == null) return base
  return { ...base, ...overrides }
}

const LEGEND_LEVELS = GRAPH_LEVELS

/** `compact` = GitHub-scale grid; `comfortable` = default product density. */
export const graphDensityPresets = {
  compact: { cellSize: 14, cellGap: 3 },
  comfortable: { cellSize: 20, cellGap: 4 },
} as const

export type GraphDensity = keyof typeof graphDensityPresets

const graphXLabelVariants = cva(
  'p-0 text-center font-normal leading-none text-fg-muted tabular-nums',
  {
    variants: {
      density: {
        compact: 'h-[var(--ds-graph-cell-size)] text-[length:var(--ds-font-size-2xs,0.625rem)]',
        comfortable: 'h-[var(--ds-graph-cell-size)] text-xs',
      },
    },
    defaultVariants: { density: 'comfortable' },
  },
)

const graphStickyCornerVariants = cva('sticky left-0 z-10 p-0', {
  variants: {
    stickyTone: {
      page: 'bg-background',
      card: 'bg-surface',
    },
  },
  defaultVariants: { stickyTone: 'page' },
})

const graphYLabelVariants = cva(
  'sticky left-0 z-10 flex h-[var(--ds-graph-cell-size)] items-center whitespace-nowrap py-0 pl-0 text-left font-medium leading-none text-fg',
  {
    variants: {
      density: {
        compact: 'text-[length:var(--ds-font-size-2xs,0.625rem)]',
        comfortable: 'text-xs',
      },
      stickyTone: {
        page: 'bg-background',
        card: 'bg-surface',
      },
    },
    defaultVariants: { density: 'comfortable', stickyTone: 'page' },
  },
)

const graphFooterTextVariants = cva('text-fg-muted', {
  variants: {
    density: {
      compact: 'text-[length:var(--ds-font-size-2xs,0.625rem)]',
      comfortable: 'text-xs',
    },
  },
  defaultVariants: { density: 'comfortable' },
})

const graphCellValueVariants = cva('font-semibold leading-none tabular-nums', {
  variants: {
    density: {
      compact: 'text-[length:var(--ds-font-size-2xs,0.625rem)]',
      comfortable: 'text-xs',
    },
  },
  defaultVariants: { density: 'comfortable' },
})

export type ContributionGraphProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  data: GraphCell[]
  xLabels: string[]
  yLabels: string[]
  /** Grid rhythm. `compact` matches GitHub-scale; default is `comfortable`. */
  density?: GraphDensity
  /** Overrides {@link graphDensityPresets} for the active density. */
  cellSize?: number
  /** Overrides {@link graphDensityPresets} for the active density. */
  cellGap?: number
  /** Show numeric value inside non-empty cells. Off by default; use hover tooltip for density. */
  showCellValues?: boolean
  formatValue?: (value: number) => string
  /** Hover glass panel content. Defaults to row/column + value. */
  getTooltipContent?: (cell: GraphCell) => React.ReactNode
  onCellClick?: (cell: GraphCell) => void
  /** Footer left — e.g. activity count summary (GitHub-style). */
  summary?: React.ReactNode
  showLegend?: boolean
  legendLessLabel?: string
  legendMoreLabel?: string
  /**
   * Sticky axis label backdrop when the graph scrolls inside a card.
   * Use `card` with `bg-surface` shells (e.g. order detail panels).
   */
  stickyTone?: 'page' | 'card'
  /** Primary hue for the 1–5 intensity ramp. Default `green`. */
  primary?: ContributionGraphPrimary
  /** Override any level 0–5 (merged onto the scale from {@link primary}). */
  colorScale?: Partial<ContributionGraphColorScale>
}

export const graphCellSurfaceBase =
  'flex items-center justify-center border-0 p-0 shadow-none transition-[filter] duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'

export function graphCellSurfaceClass(
  level: GraphLevel,
  scale: ContributionGraphColorScale = contributionGraphPrimaryScales.green,
): string {
  return cn(graphCellSurfaceBase, scale[level])
}

/** @deprecated Prefer {@link graphCellSurfaceClass} + {@link contributionGraphPrimaryScales}. */
export const graphCellVariants = cva(graphCellSurfaceBase, {
  variants: {
    level: contributionGraphPrimaryScales.green,
  },
  defaultVariants: { level: 0 },
})

export function valueToLevel(value: number, max: number): GraphLevel {
  if (value <= 0 || max <= 0) return 0
  const ratio = value / max
  if (ratio <= 0.2) return 1
  if (ratio <= 0.4) return 2
  if (ratio <= 0.6) return 3
  if (ratio <= 0.8) return 4
  return 5
}

function shouldShowXLabel(index: number, total: number): boolean {
  if (total <= 14) return true
  if (index === 0 || index === total - 1) return true
  return (index + 1) % 5 === 0
}

function ContributionGraph({
  data,
  xLabels,
  yLabels,
  density = 'comfortable',
  cellSize: cellSizeProp,
  cellGap: cellGapProp,
  showCellValues = false,
  formatValue = String,
  getTooltipContent,
  onCellClick,
  summary,
  showLegend = true,
  legendLessLabel = '적음',
  legendMoreLabel = '많음',
  stickyTone = 'page',
  primary = 'green',
  colorScale: colorScaleProp,
  className,
  ...props
}: ContributionGraphProps) {
  const preset = graphDensityPresets[density]
  const cellSize = cellSizeProp ?? preset.cellSize
  const cellGap = cellGapProp ?? preset.cellGap
  const resolvedColorScale = useMemo(
    () => buildContributionGraphColorScale(primary, colorScaleProp),
    [primary, colorScaleProp],
  )
  const valueByKey = useMemo(() => {
    const map = new Map<string, number>()
    for (const cell of data) {
      map.set(`${cell.y}__${cell.x}`, cell.value)
    }
    return map
  }, [data])

  const maxValue = useMemo(() => Math.max(0, ...data.map((c) => c.value)), [data])

  const layoutStyle = useMemo(
    () =>
      ({
        '--ds-graph-cell-size': `${cellSize}px`,
        '--ds-graph-cell-gap': `${cellGap}px`,
      }) as React.CSSProperties,
    [cellSize, cellGap],
  )

  const gridStyle = useMemo(
    () => ({
      gap: `${cellGap}px`,
      gridTemplateColumns: `max-content repeat(${xLabels.length}, ${cellSize}px)`,
    }),
    [cellSize, cellGap, xLabels.length],
  )

  const showValuesInCell = showCellValues && cellSize >= 16

  function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return

    const triggers = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        '[data-slot="contribution-graph-cell-trigger"]',
      ),
    )
    const current = document.activeElement as HTMLElement
    const idx = triggers.indexOf(current)
    if (idx < 0) return

    e.preventDefault()
    const numCols = xLabels.length
    let next = idx

    if (key === 'ArrowRight') next = Math.min(idx + 1, triggers.length - 1)
    else if (key === 'ArrowLeft') next = Math.max(idx - 1, 0)
    else if (key === 'ArrowDown') next = Math.min(idx + numCols, triggers.length - 1)
    else if (key === 'ArrowUp') next = Math.max(idx - numCols, 0)
    else if (key === 'Home') next = 0
    else if (key === 'End') next = triggers.length - 1

    triggers[next]?.focus()
  }

  return (
    <div
      data-slot="contribution-graph-root"
      className={cn('inline-flex max-w-full flex-col', className)}
      style={layoutStyle}
      {...props}
    >
      <div className="overflow-x-auto">
        <div
          role="grid"
          tabIndex={0}
          aria-label="Contribution graph"
          className="inline-grid leading-none"
          style={gridStyle}
          onKeyDown={handleGridKeyDown}
        >
          <div
            role="presentation"
            className={cn(
              graphStickyCornerVariants({ stickyTone }),
              'sticky left-0 z-10 h-[var(--ds-graph-cell-size)] min-w-[var(--ds-graph-cell-size)]',
            )}
            aria-hidden
          />
          {xLabels.map((label, index) => (
            <div
              key={label}
              role="columnheader"
              data-slot="contribution-graph-x-label"
              className={cn(
                graphXLabelVariants({ density }),
                'flex size-[var(--ds-graph-cell-size)] items-center justify-center',
              )}
            >
              {shouldShowXLabel(index, xLabels.length) ? label : null}
            </div>
          ))}

          {yLabels.map((rowLabel) => (
            <div key={rowLabel} role="row" className="contents">
              <div
                role="rowheader"
                data-slot="contribution-graph-y-label"
                className={graphYLabelVariants({ density, stickyTone })}
                title={rowLabel}
              >
                {rowLabel}
              </div>
              {xLabels.map((colLabel) => {
                const value = valueByKey.get(`${rowLabel}__${colLabel}`) ?? 0
                const cell: GraphCell = { x: colLabel, y: rowLabel, value }
                return (
                  <div
                    key={`${rowLabel}-${colLabel}`}
                    role="gridcell"
                    className="size-[var(--ds-graph-cell-size)]"
                  >
                    <GraphCellButton
                      cell={cell}
                      level={valueToLevel(value, maxValue)}
                      displayValue={showValuesInCell && value > 0 ? formatValue(value) : ''}
                      tooltipContent={
                        getTooltipContent?.(cell) ?? (
                          <>
                            <span className="font-medium text-fg">{rowLabel}</span>
                            <span className="text-fg-muted"> · </span>
                            <span className="text-fg-muted">{colLabel}</span>
                            <span className="mt-0.5 block tabular-nums text-fg">
                              {formatValue(value)}
                            </span>
                          </>
                        )
                      }
                      density={density}
                      colorScale={resolvedColorScale}
                      onCellClick={onCellClick}
                    />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {showLegend || summary ? (
        <footer
          data-slot="contribution-graph-footer"
          className="mt-[var(--ds-graph-cell-gap)] flex flex-wrap items-center justify-between gap-x-3 gap-y-1"
        >
          {summary ? (
            <p
              data-slot="contribution-graph-summary"
              className={graphFooterTextVariants({ density })}
            >
              {summary}
            </p>
          ) : (
            <span className="min-w-0 flex-1" aria-hidden />
          )}

          {showLegend ? (
            <div
              data-slot="contribution-graph-legend"
              className="ml-auto flex shrink-0 items-center gap-1"
            >
              <span
                data-slot="contribution-graph-legend-less"
                className={graphFooterTextVariants({ density })}
              >
                {legendLessLabel}
              </span>
              <div
                data-slot="contribution-graph-legend-scale"
                className="flex items-center gap-[var(--ds-graph-cell-gap)]"
                aria-hidden
              >
                {LEGEND_LEVELS.map((level) => (
                  <div
                    key={level}
                    data-slot="contribution-graph-legend-swatch"
                    className={cn(
                      graphCellSurfaceClass(level, resolvedColorScale),
                      'size-[var(--ds-graph-cell-size)] shrink-0 rounded-sm',
                    )}
                  />
                ))}
              </div>
              <span
                data-slot="contribution-graph-legend-more"
                className={graphFooterTextVariants({ density })}
              >
                {legendMoreLabel}
              </span>
            </div>
          ) : null}
        </footer>
      ) : null}
    </div>
  )
}

type GraphCellButtonProps = {
  cell: GraphCell
  level: GraphLevel
  displayValue: string
  tooltipContent: React.ReactNode
  density: GraphDensity
  colorScale: ContributionGraphColorScale
  onCellClick?: (cell: GraphCell) => void
}

function GraphCellButton({
  cell,
  level,
  displayValue,
  tooltipContent,
  density,
  colorScale,
  onCellClick,
}: GraphCellButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [tipPos, setTipPos] = useState<TooltipPosition>({ top: 0, left: 0, placement: 'top' })
  const tipId = useId()

  const close = useCallback(() => setOpen(false), [])

  const updateTooltipPosition = useCallback(() => {
    const trigger = rootRef.current
    if (!trigger) return

    const rect = trigger.getBoundingClientRect()
    const tipHeight = tipRef.current?.getBoundingClientRect().height ?? TOOLTIP_ESTIMATED_HEIGHT_PX
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const needsTop = tipHeight + TOOLTIP_ANCHOR_GAP_PX
    const placement: TooltipPlacement =
      spaceAbove >= needsTop || spaceAbove >= spaceBelow ? 'top' : 'bottom'
    const top =
      placement === 'top' ? rect.top - TOOLTIP_ANCHOR_GAP_PX : rect.bottom + TOOLTIP_ANCHOR_GAP_PX

    setTipPos({
      top,
      left: rect.left + rect.width / 2,
      placement,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) return

    updateTooltipPosition()
    const raf = requestAnimationFrame(updateTooltipPosition)
    const scrollTargets = [window, ...getOverflowScrollAncestors(rootRef.current)]
    scrollTargets.forEach((target) => {
      target.addEventListener('scroll', updateTooltipPosition, { capture: true })
    })
    window.addEventListener('resize', updateTooltipPosition)

    return () => {
      cancelAnimationFrame(raf)
      scrollTargets.forEach((target) => {
        target.removeEventListener('scroll', updateTooltipPosition, { capture: true })
      })
      window.removeEventListener('resize', updateTooltipPosition)
    }
  }, [open, updateTooltipPosition])

  usePointerDownOutside({
    enabled: open,
    containerRef: rootRef,
    onPointerDownOutside: close,
  })

  useDismissOnEscape(open, close)

  const interactive = onCellClick != null
  const triggerClassName = cn(
    'flex shrink-0 rounded-sm border-0 bg-transparent p-0',
    interactive ? 'cursor-pointer' : 'cursor-default',
  )
  const triggerStyle = {
    width: 'var(--ds-graph-cell-size)',
    height: 'var(--ds-graph-cell-size)',
  } as React.CSSProperties

  const cellSurface = (
    <div
      data-slot="contribution-graph-cell-surface"
      className={cn(graphCellSurfaceClass(level, colorScale), 'h-full w-full rounded-sm')}
    >
      {displayValue ? (
        <span
          data-slot="contribution-graph-cell-value"
          className={graphCellValueVariants({ density })}
        >
          {displayValue}
        </span>
      ) : null}
    </div>
  )

  return (
    <div
      ref={rootRef}
      data-slot="contribution-graph-cell"
      className="group relative flex size-full"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          close()
        }
      }}
    >
      {interactive ? (
        <button
          type="button"
          data-slot="contribution-graph-cell-trigger"
          className={triggerClassName}
          style={triggerStyle}
          aria-describedby={open ? tipId : undefined}
          aria-label={`${cell.y} ${cell.x} ${cell.value}`}
          onClick={() => onCellClick(cell)}
        >
          {cellSurface}
        </button>
      ) : (
        <div
          role="img"
          data-slot="contribution-graph-cell-trigger"
          className={triggerClassName}
          style={triggerStyle}
          aria-describedby={open ? tipId : undefined}
          aria-label={`${cell.y} ${cell.x} ${cell.value}`}
        >
          {cellSurface}
        </div>
      )}

      {open && typeof document !== 'undefined'
        ? createPortal(
            <Panel
              ref={tipRef}
              id={tipId}
              role="tooltip"
              variant="list"
              appearance="glass"
              shape="list"
              offset="none"
              scrollHint={false}
              data-slot="contribution-graph-cell-tooltip"
              className="pointer-events-none fixed z-[100] min-w-max"
              style={{
                top: tipPos.top,
                left: tipPos.left,
                transform:
                  tipPos.placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
              }}
            >
              <div
                data-slot="contribution-graph-cell-tooltip-content"
                className="p-2.5 text-xs text-fg"
              >
                {tooltipContent}
              </div>
            </Panel>,
            document.body,
          )
        : null}
    </div>
  )
}

ContributionGraph.displayName = 'ContributionGraph'

export { ContributionGraph }
