import type { TimelineDensity } from '@/components/Timeline/timeline-context'

export function resolveTimelineDensity(
  explicit: TimelineDensity | null | undefined,
  metaDensity: TimelineDensity | null | undefined,
): TimelineDensity {
  const v = explicit ?? metaDensity
  if (v === 'compact' || v === 'loose' || v === 'default') return v
  return 'default'
}

export const trackWidth: Record<TimelineDensity, string> = {
  compact: 'w-7',
  default: 'w-10',
  loose: 'w-14',
}

export const spineMinHeight: Record<TimelineDensity, string> = {
  compact: 'min-h-2',
  default: 'min-h-3',
  loose: 'min-h-4',
}

export const spineMarginTop: Record<TimelineDensity, string> = {
  compact: 'mt-1',
  default: 'mt-1.5',
  loose: 'mt-2',
}

/** Nudge dot toward first-line baseline */
export const inlineMarkerNudge: Record<TimelineDensity, string> = {
  compact: 'mt-0.5',
  default: 'mt-1',
  loose: 'mt-1.5',
}

export function markerSizeForDensity(d: TimelineDensity): 'sm' | 'md' | 'lg' {
  if (d === 'compact') return 'sm'
  if (d === 'loose') return 'lg'
  return 'md'
}
