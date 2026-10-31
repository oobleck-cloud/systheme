import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode
  message: React.ReactNode
  illustration?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryAction?: React.ReactNode
}

function EmptyState({
  className,
  title,
  message,
  illustration,
  primaryAction,
  secondaryAction,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        'flex w-full max-w-md flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {illustration != null && illustration !== false ? (
        <div data-slot="empty-state-illustration" className="text-fg-muted [&_svg]:size-12">
          {illustration}
        </div>
      ) : null}
      <div data-slot="empty-state-title" className="text-lg font-semibold text-fg">
        {title}
      </div>
      <div data-slot="empty-state-message" className="text-sm text-fg-muted">
        {message}
      </div>
      {(secondaryAction != null && secondaryAction !== false) ||
      (primaryAction != null && primaryAction !== false) ? (
        <Stack direction="horizontal" gap={3} className="mt-2 flex-wrap justify-center">
          {secondaryAction != null && secondaryAction !== false ? secondaryAction : null}
          {primaryAction != null && primaryAction !== false ? primaryAction : null}
        </Stack>
      ) : null}
    </div>
  )
}

export { EmptyState }
export type { EmptyStateProps }
