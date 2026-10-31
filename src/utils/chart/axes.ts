import { timeFormat, format } from 'd3'

import type { ChartMargin } from './types'
import type { ScaleLinear, ScaleBand, ScaleTime } from 'd3'

export type AnyScale = ScaleLinear<number, number> | ScaleBand<string> | ScaleTime<number, number>

export interface AxisTick {
  value: string | number | Date
  offset: number
  label: string
}

/** Generate tick descriptors from a linear scale. */
export function linearTicks(
  scale: ScaleLinear<number, number>,
  count = 5,
  fmt?: (v: number) => string,
): AxisTick[] {
  const formatter = fmt ?? format(',~s')
  return scale.ticks(count).map((v) => ({
    value: v,
    offset: scale(v),
    label: formatter(v),
  }))
}

/** Generate tick descriptors from a band scale. */
export function bandTicks(scale: ScaleBand<string>): AxisTick[] {
  const bw = scale.bandwidth()
  return scale.domain().map((v) => ({
    value: v,
    offset: (scale(v) ?? 0) + bw / 2,
    label: v,
  }))
}

/** Generate tick descriptors from a time scale. */
export function timeTicks(scale: ScaleTime<number, number>, count = 6, fmt = '%b %d'): AxisTick[] {
  const formatter = timeFormat(fmt)
  return scale.ticks(count).map((v) => ({
    value: v,
    offset: scale(v),
    label: formatter(v),
  }))
}

/**
 * Gridline y-positions for a linear scale.
 * Returns pixel offsets for horizontal grid lines.
 */
export function gridLines(scale: ScaleLinear<number, number>, count = 5): number[] {
  return scale.ticks(count).map((v) => scale(v))
}

/** Standard bottom-axis SVG transform string. */
export function axisTransform(margin: ChartMargin, innerHeight: number): string {
  return `translate(${margin.left},${margin.top + innerHeight})`
}

/** Standard left-axis SVG transform string. */
export function leftAxisTransform(margin: ChartMargin): string {
  return `translate(${margin.left},${margin.top})`
}

/** Compact number formatter for axis labels (e.g. 1.2k, 3.4M). */
export const compactFormat = format(',~s')

/** Percentage formatter. */
export const percentFormat = format('.0%')

/** Fixed decimal formatter. */
export function fixedFormat(decimals = 1) {
  return format(`,.${decimals}f`)
}
