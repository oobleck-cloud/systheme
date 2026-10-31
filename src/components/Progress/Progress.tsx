import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

const progressFillVariants = cva(
  'h-full rounded-full transition-[width] duration-spatial-default ease-standard',
  {
    variants: {
      variant: {
        default: 'bg-primary',
        success: 'bg-success-primary',
        warning: 'bg-warning-primary',
        error: 'bg-error-primary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

const progressTrackVariants = cva(
  'relative w-full overflow-hidden rounded-full border border-border bg-surface',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-1.5',
        lg: 'h-2',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

/* M3E wave — 활성 트랙을 사인 근사(쿼드라틱 8주기)로 그린다.
 * 트랙과의 사이에 gap, 트랙 끝에 stop indicator 를 두는 M3E 리니어 인디케이터 해부를 따른다. */
const WAVE_PATH = (() => {
  const waves = 8
  const seg: string[] = []
  for (let i = 0; i < waves * 2; i += 1) {
    const x = (i + 1) * (100 / (waves * 2))
    const y = i % 2 === 0 ? 1.5 : 8.5
    seg.push(`Q ${x - 100 / (waves * 4)} ${y} ${x} 5`)
  }
  return `M 0 5 ${seg.join(' ')}`
})()

const waveStrokeVariants: Record<'default' | 'success' | 'warning' | 'error', string> = {
  default: 'stroke-primary',
  success: 'stroke-success-primary',
  warning: 'stroke-warning-primary',
  error: 'stroke-error-primary',
}

const waveDotVariants: Record<'default' | 'success' | 'warning' | 'error', string> = {
  default: 'bg-primary',
  success: 'bg-success-primary',
  warning: 'bg-warning-primary',
  error: 'bg-error-primary',
}

const waveHeightBySize: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
}

type ProgressProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof progressFillVariants> &
  VariantProps<typeof progressTrackVariants> & {
    value?: number
    max?: number
    label?: string
    showValue?: boolean
    /** 'wave' = M3E 리니어 인디케이터(웨이브 활성 트랙 + gap + stop indicator).
     *  indeterminate 는 bar 로 폴백한다. */
    shape?: 'bar' | 'wave'
  }

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      variant,
      size,
      value,
      max = 100,
      label,
      showValue = false,
      shape = 'bar',
      ...props
    },
    ref,
  ) => {
    const isIndeterminate = value === undefined || value === null
    const pct = isIndeterminate ? 0 : Math.min(100, Math.max(0, (value / max) * 100))

    return (
      <div className={cn('flex flex-col gap-1.5', className)} {...props}>
        {(label != null || showValue) && (
          <div className="flex items-center justify-between gap-2">
            {label != null && <span className="text-sm font-medium text-fg">{label}</span>}
            {showValue && !isIndeterminate && (
              <span className="text-xs text-fg-subtle tabular-nums">{Math.round(pct)}%</span>
            )}
          </div>
        )}
        {shape === 'wave' && !isIndeterminate ? (
          <div
            ref={ref}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label}
            data-slot="progress-root"
            className={cn('flex items-center gap-1', waveHeightBySize[size ?? 'md'])}
          >
            <svg
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              data-slot="progress-fill"
              className={cn('h-full shrink-0', waveStrokeVariants[variant ?? 'default'])}
              style={{ width: `${pct}%` }}
            >
              <path
                d={WAVE_PATH}
                fill="none"
                strokeWidth={3}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span
              data-slot="progress-track"
              className="h-1 min-w-0 flex-1 rounded-full bg-container-high"
            />
            <span
              aria-hidden
              data-slot="progress-stop"
              className={cn('size-1 shrink-0 rounded-full', waveDotVariants[variant ?? 'default'])}
            />
          </div>
        ) : (
          <div
            ref={ref}
            role="progressbar"
            aria-valuenow={isIndeterminate ? undefined : value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={label}
            aria-busy={isIndeterminate}
            data-slot="progress-root"
            className={cn(progressTrackVariants({ size }))}
          >
            <div
              data-slot="progress-fill"
              className={cn(
                progressFillVariants({ variant }),
                isIndeterminate ? 'w-1/3 animate-pulse' : 'w-[var(--ds-progress-pct)]',
              )}
              style={{ '--ds-progress-pct': `${pct}%` }}
            />
          </div>
        )}
      </div>
    )
  },
)

Progress.displayName = 'Progress'

export { Progress, progressFillVariants, progressTrackVariants }
export type { ProgressProps }
