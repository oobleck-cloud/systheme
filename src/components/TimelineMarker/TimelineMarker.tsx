import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const timelineMarkerVariants = cva('relative inline-flex shrink-0 items-center justify-center', {
  variants: {
    appearance: {
      /** Small dot on the vertical spine (log / status line) */
      dot: '',
      /** Larger ring + optional glyph; optional phase badge */
      milestone: '',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
    density: {
      compact: '',
      default: '',
      loose: '',
    },
  },
  compoundVariants: [
    { appearance: 'milestone', size: 'sm', density: 'compact', class: 'h-7 w-7' },
    { appearance: 'milestone', size: 'sm', density: 'default', class: 'h-8 w-8' },
    { appearance: 'milestone', size: 'sm', density: 'loose', class: 'h-9 w-9' },
    { appearance: 'milestone', size: 'md', density: 'compact', class: 'h-9 w-9' },
    { appearance: 'milestone', size: 'md', density: 'default', class: 'h-10 w-10' },
    { appearance: 'milestone', size: 'md', density: 'loose', class: 'h-11 w-11' },
    { appearance: 'milestone', size: 'lg', density: 'compact', class: 'h-10 w-10' },
    { appearance: 'milestone', size: 'lg', density: 'default', class: 'h-12 w-12' },
    { appearance: 'milestone', size: 'lg', density: 'loose', class: 'h-14 w-14' },
    { appearance: 'dot', size: 'sm', class: 'h-2 w-2' },
    { appearance: 'dot', size: 'md', class: 'h-2.5 w-2.5' },
    { appearance: 'dot', size: 'lg', class: 'h-3 w-3' },
  ],
  defaultVariants: {
    appearance: 'milestone',
    size: 'md',
    density: 'default',
  },
})

const phaseDotVariants = cva(
  'absolute right-0 bottom-0 z-[1] box-border h-2.5 w-2.5 rounded-full border-2 border-background',
  {
    variants: {
      phase: {
        pending: 'bg-disabled-primary',
        active: 'bg-primary',
        complete: 'bg-success-primary',
        neutral: 'bg-border-strong',
      },
    },
    defaultVariants: {
      phase: 'neutral',
    },
  },
)

const dotFillVariants = cva('rounded-full border border-background shadow-sm', {
  variants: {
    phase: {
      pending: 'bg-disabled-primary',
      active: 'bg-primary',
      complete: 'bg-success-primary',
      neutral: 'bg-border-strong',
    },
  },
  defaultVariants: {
    phase: 'neutral',
  },
})

type TimelinePhase = 'pending' | 'active' | 'complete' | 'neutral'

type TimelineMarkerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof timelineMarkerVariants> & {
    phase?: TimelinePhase
    /** Slot: icon or glyph inside milestone ring */
    glyph?: React.ReactNode
    /** Milestone: show small phase indicator dot */
    showPhaseDot?: boolean
  }

function TimelineMarker({
  className,
  appearance,
  size,
  density,
  phase = 'neutral',
  glyph,
  children,
  showPhaseDot = true,
  ...props
}: TimelineMarkerProps) {
  const resolvedAppearance = appearance ?? 'milestone'

  if (resolvedAppearance === 'dot') {
    return (
      <div
        className={cn(
          timelineMarkerVariants({ appearance: 'dot', size, density }),
          'box-border ring-2 ring-background',
          className,
        )}
        data-appearance="dot"
        data-phase={phase}
        {...props}
      >
        <span className={cn('block h-full w-full', dotFillVariants({ phase }))} data-part="dot" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        timelineMarkerVariants({ appearance: 'milestone', size, density }),
        'rounded-full border-2 border-border bg-background text-fg-muted',
        phase === 'active' && 'border-primary text-primary',
        phase === 'complete' && 'border-success-border text-success-text',
        className,
      )}
      data-appearance="milestone"
      data-phase={phase}
      {...props}
    >
      <span className="flex items-center justify-center [&:empty]:hidden" data-part="glyph">
        {glyph ?? children}
      </span>
      {showPhaseDot && (
        <span className={cn(phaseDotVariants({ phase }))} data-part="status-dot" aria-hidden />
      )}
    </div>
  )
}

export { TimelineMarker, timelineMarkerVariants, phaseDotVariants, dotFillVariants }
export type { TimelineMarkerProps, TimelinePhase }
