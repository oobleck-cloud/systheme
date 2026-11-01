'use client'

import { cva } from 'class-variance-authority'
import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useDismissOnEscape, usePointerDownOutside } from '@/primitives/anchorPopover'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
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

/**
 * Full level 0–5 scales per primary hue — DS 팔레트 단계(`bg-palette-*`, 시안의 palette/green-50·200…600).
 * amber 는 DS 팔레트에 없어 Tailwind amber 그대로다.
 */
export const contributionGraphPrimaryScales: Record<
  ContributionGraphPrimary,
  ContributionGraphColorScale
> = {
  green: {
    0: 'bg-palette-green-50',
    1: 'bg-palette-green-200 text-white',
    2: 'bg-palette-green-300 text-white',
    3: 'bg-palette-green-400 text-white',
    4: 'bg-palette-green-500 text-white',
    5: 'bg-palette-green-600 text-white',
  },
  red: {
    0: 'bg-palette-red-50',
    1: 'bg-palette-red-200 text-white',
    2: 'bg-palette-red-300 text-white',
    3: 'bg-palette-red-400 text-white',
    4: 'bg-palette-red-500 text-white',
    5: 'bg-palette-red-600 text-white',
  },
  blue: {
    0: 'bg-palette-blue-50',
    1: 'bg-palette-blue-200 text-white',
    2: 'bg-palette-blue-300 text-white',
    3: 'bg-palette-blue-400 text-white',
    4: 'bg-palette-blue-500 text-white',
    5: 'bg-palette-blue-600 text-white',
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
  /**
   * 판 폭을 채운다 — 열이 남는 폭을 나눠 갖고(최소 `cellSize`), 칸은 높이 `cellSize` 의 가로 직사각형.
   * 기본(false)은 정사각 칸을 왼쪽부터 놓아 오른쪽이 빈다.
   */
  fill?: boolean
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
  /**
   * 행 라벨 열의 최대 폭(px). 넘는 라벨은 말줄임하고 title 에 전체를 둔다.
   * 생략하면 가장 긴 라벨에 맞춘다(말줄임 없음) — 데이터가 긴 이름을 줄 수 있으면 지정한다.
   */
  yLabelMaxWidth?: number
  /** 행 라벨의 title(툴팁) — 라벨을 줄여 보일 때 전체 이름. 기본은 라벨 그대로. */
  getYLabelTitle?: (rowLabel: string) => string
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

/**
 * 열 머리를 몇 칸마다 적나. 날짜 숫자처럼 두 글자 이하면 칸마다 다 적는다(「1 2 3 … 31」 — 띄엄띄엄
 * 적으면 몇 일인지 세어야 한다). 긴 라벨(주·월 이름)은 칸보다 넓어 겹치니 처음·끝·5칸마다.
 */
function shouldShowXLabel(index: number, labels: readonly string[]): boolean {
  const total = labels.length
  if (total <= 14 || labels.every((l) => l.length <= 2)) return true
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
  yLabelMaxWidth,
  getYLabelTitle,
  fill = false,
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
      // fit-content: 짧은 라벨은 그 폭만, 긴 라벨은 최대 폭에서 말줄임.
      gridTemplateColumns: `${yLabelMaxWidth === undefined ? 'max-content' : `fit-content(${String(yLabelMaxWidth)}px)`} repeat(${xLabels.length}, ${fill ? `minmax(${String(cellSize)}px, 1fr)` : `${String(cellSize)}px`})`,
    }),
    [cellSize, cellGap, xLabels.length, yLabelMaxWidth, fill],
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
      className={cn(fill ? 'flex w-full flex-col' : 'inline-flex max-w-full flex-col', className)}
      style={layoutStyle}
      {...props}
    >
      <div className="overflow-x-auto">
        <div
          role="grid"
          tabIndex={0}
          aria-label="Contribution graph"
          className={cn(fill ? 'grid w-full' : 'inline-grid', 'leading-none')}
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
                'flex items-center justify-center',
                fill ? 'h-[var(--ds-graph-cell-size)] w-full' : 'size-[var(--ds-graph-cell-size)]',
                // 칸이 좁으면(18px 미만) 두 자리 숫자가 칸을 넘지 않게 작은 글자로.
                cellSize < 18 && 'text-[length:var(--ds-font-size-2xs,0.625rem)]',
              )}
            >
              {shouldShowXLabel(index, xLabels) ? label : null}
            </div>
          ))}

          {yLabels.map((rowLabel) => (
            <div key={rowLabel} role="row" className="contents">
              <div
                role="rowheader"
                data-slot="contribution-graph-y-label"
                className={cn(graphYLabelVariants({ density, stickyTone }), 'min-w-0')}
                title={getYLabelTitle?.(rowLabel) ?? rowLabel}
              >
                <span className="min-w-0 truncate">{rowLabel}</span>
              </div>
              {xLabels.map((colLabel) => {
                const value = valueByKey.get(`${rowLabel}__${colLabel}`) ?? 0
                const cell: GraphCell = { x: colLabel, y: rowLabel, value }
                return (
                  <div
                    key={`${rowLabel}-${colLabel}`}
                    role="gridcell"
                    className={
                      fill
                        ? 'h-[var(--ds-graph-cell-size)] w-full'
                        : 'size-[var(--ds-graph-cell-size)]'
                    }
                  >
                    <GraphCellButton
                      fill={fill}
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
  /** 판 폭 채우기 — 칸 너비를 셀 칸에 맡긴다 */
  fill: boolean
  cell: GraphCell
  level: GraphLevel
  displayValue: string
  tooltipContent: React.ReactNode
  density: GraphDensity
  colorScale: ContributionGraphColorScale
  onCellClick?: (cell: GraphCell) => void
}

function GraphCellButton({
  fill,
  cell,
  level,
  displayValue,
  tooltipContent,
  density,
  colorScale,
  onCellClick,
}: GraphCellButtonProps) {
  const portalRoot = usePortalRoot()
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
    width: fill ? '100%' : 'var(--ds-graph-cell-size)',
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
            portalRoot,
          )
        : null}
    </div>
  )
}

ContributionGraph.displayName = 'ContributionGraph'

export { ContributionGraph }
