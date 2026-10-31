'use client'

import { forwardRef, useCallback } from 'react'

import { cn } from '@/utils/cn'

type TableBodyProps = React.HTMLAttributes<HTMLTableSectionElement>

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, onKeyDown, ...props }, ref) => {
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTableSectionElement>) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return

        const current = (document.activeElement as HTMLElement)?.closest<HTMLElement>(
          '[data-slot="table-row"]',
        )
        if (!current) return

        const rows = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>('[data-slot="table-row"]'),
        )
        const idx = rows.indexOf(current)
        if (idx < 0) return

        e.preventDefault()
        const next =
          e.key === 'ArrowDown' ? Math.min(idx + 1, rows.length - 1) : Math.max(idx - 1, 0)
        rows[next]?.focus()
      },
      [onKeyDown],
    )

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown delegated to inner interactive row elements
      <tbody
        ref={ref}
        data-slot="table-body"
        className={cn(className)}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  },
)

TableBody.displayName = 'TableBody'

export { TableBody }
export type { TableBodyProps }
