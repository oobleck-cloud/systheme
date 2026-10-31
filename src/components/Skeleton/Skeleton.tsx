import { cn } from '@/utils/cn'

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** anatomy `blocks` 반복 — 가로 막대 개수 */
  lines?: number
  /** 각 막대 높이 (Tailwind 높이 클래스 등) */
  lineClassName?: string
}

function Skeleton({ className, lines = 3, lineClassName = 'h-3', ...props }: SkeletonProps) {
  return (
    <div
      data-slot="skeleton-root"
      className={cn('flex w-full flex-col gap-2', className)}
      {...props}
    >
      {Array.from({ length: Math.max(0, lines) }).map((_, i) => (
        <div
          key={i}
          data-slot="skeleton-pulse"
          className={cn(
            'w-full animate-pulse rounded-md bg-surface',
            lineClassName,
            i === lines - 1 && lines > 1 && 'w-4/5',
          )}
        />
      ))}
    </div>
  )
}

export { Skeleton }
export type { SkeletonProps }
