import { cn } from '@/utils/cn'

type TableCaptionProps = React.HTMLAttributes<HTMLTableCaptionElement> & {
  /** anatomy `value-display` 바인딩 — `children` 이 없을 때 사용 */
  text?: string
}

function TableCaption({ className, text, children, ...props }: TableCaptionProps) {
  return (
    <caption
      data-slot="table-caption"
      className={cn('px-3 py-2 text-left text-xs text-fg-muted', className)}
      {...props}
    >
      {children ?? text}
    </caption>
  )
}

export { TableCaption }
export type { TableCaptionProps }
