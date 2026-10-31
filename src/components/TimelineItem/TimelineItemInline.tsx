'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import {
  inlineMarkerNudge,
  resolveTimelineDensity,
  spineMarginTop,
  spineMinHeight,
  trackWidth,
} from './timeline-density'

import { useTimelineMeta } from '@/components/Timeline/timeline-context'
import { cn } from '@/utils/cn'

/*
 * L2 — TimelineItem.Inline
 * Single-row entry: [track: marker+spine] [content] [timestamp right-aligned]
 */

const inlineItemVariants = cva('flex w-full min-w-0 items-start', {
  variants: {
    density: {
      compact: 'gap-1.5 pb-2 last:pb-0',
      default: 'gap-2.5 pb-4 last:pb-0',
      loose: 'gap-3.5 pb-6 last:pb-0',
    },
  },
  defaultVariants: { density: 'default' },
})

const inlineContentVariants = cva('min-w-0 flex-1 leading-snug text-fg', {
  variants: {
    density: {
      compact: 'pt-px text-xs',
      default: 'pt-[0.1875rem] text-sm',
      loose: 'pt-1 text-base',
    },
  },
  defaultVariants: { density: 'default' },
})

const inlineTimestampVariants = cva(
  'shrink-0 text-right leading-snug font-normal text-fg-subtle tabular-nums',
  {
    variants: {
      density: {
        compact: 'pt-px text-[0.625rem]',
        default: 'pt-[0.1875rem] text-xs',
        loose: 'pt-1 text-sm',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

type TimelineItemInlineProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof inlineItemVariants> & {
    timestamp: React.ReactNode
    marker?: React.ReactNode
  }

function TimelineItemInline({
  className,
  density,
  timestamp,
  marker,
  children,
  ...props
}: TimelineItemInlineProps) {
  const meta = useTimelineMeta()
  const d = resolveTimelineDensity(density, meta?.density)
  const isLast = meta == null || meta.index === meta.count - 1

  return (
    <div role="listitem" className={cn(inlineItemVariants({ density: d }), className)} {...props}>
      <div
        className={cn('flex shrink-0 flex-col items-center self-stretch', trackWidth[d])}
        data-slot="track"
      >
        <div
          className={cn('relative z-[1] flex items-center justify-center', inlineMarkerNudge[d])}
        >
          {marker}
        </div>
        {!isLast && (
          <div className={cn('w-px flex-1 bg-border', spineMarginTop[d], spineMinHeight[d])} />
        )}
      </div>

      <div className={cn(inlineContentVariants({ density: d }))} data-part="content">
        {children}
      </div>

      <div className={cn(inlineTimestampVariants({ density: d }))} data-part="timestamp">
        {timestamp}
      </div>
    </div>
  )
}

export { TimelineItemInline }
export type { TimelineItemInlineProps }
