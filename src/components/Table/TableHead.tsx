'use client'

import { forwardRef } from 'react'

import { useTableChrome } from './TableChromeContext'

import { cn } from '@/utils/cn'

type TableHeadProps = React.ThHTMLAttributes<HTMLTableCellElement>

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, scope = 'col', ...props }, ref) => {
    const chrome = useTableChrome()
    return (
      <th
        ref={ref}
        data-slot="table-head"
        scope={scope}
        className={cn(
          'border-b border-border bg-surface text-left align-middle font-medium whitespace-nowrap text-fg-subtle',
          'py-density-head px-density-head text-density-head',
          chrome === 'flush' && 'border-x-0',
          className,
        )}
        {...props}
      />
    )
  },
)

TableHead.displayName = 'TableHead'

export { TableHead }
export type { TableHeadProps }
