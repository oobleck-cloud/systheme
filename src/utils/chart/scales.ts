import {
  scaleLinear,
  scaleBand,
  scaleTime,
  scaleOrdinal,
  scaleSqrt,
  scaleSequential,
  interpolateRgb,
} from 'd3'

import type { ChartDimensions } from './types'

export type { ScaleLinear, ScaleBand, ScaleTime, ScaleOrdinal } from 'd3'

/** Linear scale for continuous numeric axes (Y axis typically). */
export function createLinearScale(
  domain: [number, number],
  range: [number, number],
  { nice = true }: { nice?: boolean } = {},
) {
  const s = scaleLinear().domain(domain).range(range)
  return nice ? s.nice() : s
}

/**
 * Band scale for categorical axes (X axis in vertical bar charts).
 * Returns inner padding of 0.2 by default for readable bar gaps.
 */
export function createBandScale(
  categories: string[],
  range: [number, number],
  { paddingInner = 0.2, paddingOuter = 0.1 }: { paddingInner?: number; paddingOuter?: number } = {},
) {
  return scaleBand()
    .domain(categories)
    .range(range)
    .paddingInner(paddingInner)
    .paddingOuter(paddingOuter)
}

/** Time scale for date-based X axes. */
export function createTimeScale(domain: [Date, Date], range: [number, number]) {
  return scaleTime().domain(domain).range(range)
}

/** Ordinal color scale mapping series keys → chart series CSS variable values. */
export function createOrdinalColorScale(keys: string[], colors: string[]) {
  return scaleOrdinal<string, string>().domain(keys).range(colors)
}

/**
 * Square-root scale for bubble radius (area ∝ value, not radius).
 * Maps value domain to pixel radius range.
 */
export function createSqrtScale(domain: [number, number], range: [number, number]) {
  return scaleSqrt().domain(domain).range(range)
}

/** Sequential color scale for heatmaps (single-hue gradient). */
export function createSequentialScale(
  domain: [number, number],
  lowColor: string,
  highColor: string,
) {
  return scaleSequential().domain(domain).interpolator(interpolateRgb(lowColor, highColor))
}

/** Derive [min, max] y-domain from multiple series, extending to 0. */
export function yDomainFromSeries(
  seriesData: Array<Array<{ y: number }>>,
  { startAtZero = true } = {},
): [number, number] {
  let min = Infinity
  let max = -Infinity
  for (const series of seriesData) {
    for (const d of series) {
      if (d.y < min) min = d.y
      if (d.y > max) max = d.y
    }
  }
  if (startAtZero) min = Math.min(0, min)
  return [min, max]
}

/** Standard margin → inner dimensions calculation. */
export function innerDimensions(dims: ChartDimensions): {
  x: number
  y: number
  w: number
  h: number
} {
  return {
    x: dims.margin.left,
    y: dims.margin.top,
    w: dims.innerWidth,
    h: dims.innerHeight,
  }
}
