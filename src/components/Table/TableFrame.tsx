'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { useTableChrome } from './TableChromeContext'

import { cn } from '@/utils/cn'

const tableFrameVariants = cva('w-full caption-top border-collapse text-sm text-fg', {
  variants: {
    chrome: {
      panel: '',
      flush: 'rounded-none',
    },
    /** 홀수/짝수 행 배경 교차. 기본은 비활성화. */
    striped: {
      true: '',
      false: '',
    },
    layout: {
      auto: 'table-auto',
      fixed: 'table-fixed',
    },
  },
  compoundVariants: [
    {
      chrome: 'panel',
      striped: true,
      class: '[&_tbody_tr:nth-child(even)]:bg-surface [&_tbody_tr:nth-child(odd)]:bg-background',
    },
    {
      chrome: 'flush',
      striped: true,
      class: '[&_tbody_tr:nth-child(even)]:bg-surface/60',
    },
  ],
  defaultVariants: {
    chrome: 'panel',
    striped: false,
    layout: 'auto',
  },
})

type TableFrameProps = Omit<React.TableHTMLAttributes<HTMLTableElement>, 'data-table-chrome'> &
  Omit<VariantProps<typeof tableFrameVariants>, 'chrome'>

const TableFrame = forwardRef<HTMLTableElement, TableFrameProps>(
  ({ className, striped, layout, ...props }, ref) => {
    const ctxChrome = useTableChrome()
    return (
      <table
        ref={ref}
        data-slot="table-frame"
        data-table-chrome={ctxChrome}
        data-table-striped={striped ? 'true' : 'false'}
        className={cn(tableFrameVariants({ chrome: ctxChrome, striped, layout }), className)}
        {...props}
      />
    )
  },
)

TableFrame.displayName = 'TableFrame'

export { TableFrame, tableFrameVariants }
export type { TableFrameProps }
