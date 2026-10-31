'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

const tabListVariants = cva('flex min-h-0 min-w-0 items-stretch text-fg', {
  variants: {
    density: {
      compact: 'gap-0.5',
      default: 'gap-1',
      loose: 'gap-1.5',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      between: 'justify-between',
      end: 'justify-end',
    },
    scrollable: {
      true: '[scrollbar-width:thin] flex-nowrap overflow-x-auto',
      false: 'w-full flex-wrap',
    },
    bordered: {
      true: 'border-b border-border',
      false: 'border-b-0',
    },
  },
  defaultVariants: {
    density: 'default',
    justify: 'start',
    scrollable: false,
    bordered: true,
  },
})

type TabListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> &
  VariantProps<typeof tabListVariants> & {
    /** Fallback when `aria-label` is not passed */
    tabListLabel?: string
  }

const TabList = forwardRef<HTMLDivElement, TabListProps>(
  (
    {
      className,
      density,
      justify,
      scrollable,
      bordered,
      tabListLabel = 'Tabs',
      'aria-label': ariaLabel,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        role="tablist"
        aria-label={ariaLabel ?? tabListLabel}
        data-part="tablist"
        className={cn(tabListVariants({ density, justify, scrollable, bordered }), className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

TabList.displayName = 'TabList'

export { TabList, tabListVariants }
export type { TabListProps }
