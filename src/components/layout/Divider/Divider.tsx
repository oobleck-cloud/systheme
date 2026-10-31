import { cn } from '@/utils/cn'

type DividerProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical'
  label?: string
}

function Divider({ orientation = 'horizontal', label, className, ...props }: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('w-px shrink-0 self-stretch bg-border', className)}
        {...props}
      />
    )
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-label={label}
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-fg-muted">{label}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    )
  }

  return <hr className={cn('border-0 border-t border-border', className)} {...props} />
}

export { Divider }
export type { DividerProps }
