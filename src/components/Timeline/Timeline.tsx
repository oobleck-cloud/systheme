'use client'

import { Children, isValidElement } from 'react'

import { TimelineMetaContext, type TimelineDensity } from './timeline-context'

import { cn } from '@/utils/cn'

type TimelineProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Passed to each row when not overridden on `TimelineItem` */
  density?: TimelineDensity
}

function Timeline({ className, density, children, ...props }: TimelineProps) {
  const items = Children.toArray(children).filter((c) => isValidElement(c)) as React.ReactElement[]
  const count = items.length

  return (
    <div className={cn('flex min-w-0 flex-col', className)} role="list" {...props}>
      {items.map((child, index) => (
        <TimelineMetaContext.Provider key={child.key ?? index} value={{ index, count, density }}>
          {child}
        </TimelineMetaContext.Provider>
      ))}
    </div>
  )
}

export { Timeline }
export type { TimelineProps }
