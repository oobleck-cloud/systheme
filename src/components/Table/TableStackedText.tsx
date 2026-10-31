import { cn } from '@/utils/cn'

type TableStackedTextProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 주 라벨 (예: 날짜) */
  primary: React.ReactNode
  /** 보조 라벨 (예: 시간) — 더 작고 muted */
  secondary?: React.ReactNode
}

function TableStackedText({ className, primary, secondary, ...props }: TableStackedTextProps) {
  return (
    <div
      data-slot="table-stacked-text"
      className={cn('flex min-w-0 flex-col gap-0.5 text-left', className)}
      {...props}
    >
      <span className="text-sm leading-snug font-normal text-fg">{primary}</span>
      {secondary != null && secondary !== false ? (
        <span className="text-xs leading-snug text-fg-muted">{secondary}</span>
      ) : null}
    </div>
  )
}

export { TableStackedText }
export type { TableStackedTextProps }
