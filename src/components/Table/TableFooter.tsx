import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

type TableFooterProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <tfoot
        ref={ref}
        data-slot="table-footer"
        className={cn('border-t border-border bg-surface text-sm font-medium text-fg', className)}
        {...props}
      />
    )
  },
)

TableFooter.displayName = 'TableFooter'

export { TableFooter }
export type { TableFooterProps }
