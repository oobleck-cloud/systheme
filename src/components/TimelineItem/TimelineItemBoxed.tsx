'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import {
  resolveTimelineDensity,
  spineMarginTop,
  spineMinHeight,
  trackWidth,
} from './timeline-density'

import { useTimelineMeta } from '@/components/Timeline/timeline-context'
import { cn } from '@/utils/cn'

/*
 * L2 — TimelineItem.Boxed
 * Timestamp above card; track + spine on the left.
 */

const boxedItemVariants = cva('flex w-full min-w-0 items-start', {
  variants: {
    density: {
      compact: 'gap-1.5 pb-4 last:pb-0',
      default: 'gap-2.5 pb-7 last:pb-0',
      loose: 'gap-3.5 pb-10 last:pb-0',
    },
  },
  defaultVariants: { density: 'default' },
})

const boxedTimestampVariants = cva('leading-snug font-normal text-fg-subtle tabular-nums', {
  variants: {
    density: {
      compact: 'text-[0.625rem]',
      default: 'text-xs',
      loose: 'text-sm',
    },
  },
  defaultVariants: { density: 'default' },
})

const boxedGapVariants = {
  compact: 'mt-1',
  default: 'mt-2',
  loose: 'mt-3',
} as const

type TimelineItemBoxedProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof boxedItemVariants> & {
    timestamp: React.ReactNode
    marker?: React.ReactNode
  }

function TimelineItemBoxed({
  className,
  density,
  timestamp,
  marker,
  children,
  ...props
}: TimelineItemBoxedProps) {
  const meta = useTimelineMeta()
  const d = resolveTimelineDensity(density, meta?.density)
  const isLast = meta == null || meta.index === meta.count - 1

  return (
    <div role="listitem" className={cn(boxedItemVariants({ density: d }), className)} {...props}>
      <div
        className={cn('flex shrink-0 flex-col items-center self-stretch', trackWidth[d])}
        data-slot="track"
      >
        <div className="relative z-[1] flex items-center justify-center">{marker}</div>
        {!isLast && (
          <div className={cn('w-px flex-1 bg-border', spineMarginTop[d], spineMinHeight[d])} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn(boxedTimestampVariants({ density: d }))} data-part="timestamp">
          {timestamp}
        </div>
        <div className={cn('min-w-0', boxedGapVariants[d])} data-part="content">
          {children}
        </div>
      </div>
    </div>
  )
}

export { TimelineItemBoxed }
export type { TimelineItemBoxedProps }
