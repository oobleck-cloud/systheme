import { TimelineItemBoxed, type TimelineItemBoxedProps } from './TimelineItemBoxed'
import { TimelineItemInline, type TimelineItemInlineProps } from './TimelineItemInline'

const TimelineItem = {
  Inline: TimelineItemInline,
  Boxed: TimelineItemBoxed,
}

export { TimelineItem }
/** @internal DS 내부 구현 — public API는 `TimelineItem.Inline` 사용 */
export { TimelineItemInline }
/** @internal DS 내부 구현 — public API는 `TimelineItem.Boxed` 사용 */
export { TimelineItemBoxed }
export type { TimelineItemInlineProps, TimelineItemBoxedProps }

export { resolveTimelineDensity, markerSizeForDensity } from './timeline-density'
