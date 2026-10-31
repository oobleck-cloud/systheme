/**
 * CSS variable reader for chart tokens.
 * D3 cannot consume Tailwind utilities directly — read computed CSS vars instead.
 * Always pass the chart root element so density/theme overrides in subtrees are respected.
 */

/**
 * Read a single CSS custom property from the element (falls back to :root).
 */
export function readToken(name: string, el?: Element | null): string {
  const target = el ?? (typeof document !== 'undefined' ? document.documentElement : null)
  if (!target) return ''
  return getComputedStyle(target).getPropertyValue(name).trim()
}

/** Returns the 6 categorical series colors in order. */
export function readSeriesColors(el?: Element | null): string[] {
  return [1, 2, 3, 4, 5, 6].map((i) => readToken(`--ds-chart-series-${i}`, el))
}

/** Returns a single series color by 1-based index. */
export function readSeriesColor(index: 1 | 2 | 3 | 4 | 5 | 6, el?: Element | null): string {
  return readToken(`--ds-chart-series-${index}`, el)
}

/** Returns the subtle (light background) variant of a series color. */
export function readSeriesColorSubtle(index: 1 | 2 | 3 | 4 | 5 | 6, el?: Element | null): string {
  return readToken(`--ds-chart-series-${index}-subtle`, el)
}

export const CHART_TOKENS = {
  grid: '--ds-chart-grid',
  gridStrong: '--ds-chart-grid-strong',
  axis: '--ds-chart-axis',
  axisLabel: '--ds-chart-axis-label',
  axisTitle: '--ds-chart-axis-title',
  crosshair: '--ds-chart-crosshair',
  tooltipBg: '--ds-chart-tooltip-bg',
  tooltipFg: '--ds-chart-tooltip-fg',
  tooltipBorder: '--ds-chart-tooltip-border',
  legendFg: '--ds-chart-legend-fg',
  seqLow: '--ds-chart-seq-low',
  seqMid: '--ds-chart-seq-mid',
  seqHigh: '--ds-chart-seq-high',
  divLow: '--ds-chart-div-low',
  divMid: '--ds-chart-div-mid',
  divHigh: '--ds-chart-div-high',
  statusPositive: '--ds-chart-status-positive',
  statusNegative: '--ds-chart-status-negative',
  statusNeutral: '--ds-chart-status-neutral',
  statusWarning: '--ds-chart-status-warning',
} as const
