import { forwardRef } from 'react'

import { surfaceVariants, type SurfaceVariantProps } from './surfaceVariants'

import { cn } from '@/utils/cn'

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> &
  SurfaceVariantProps & {
    header?: React.ReactNode
    footer?: React.ReactNode
  }

const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  (
    {
      className,
      kind = 'section',
      variant,
      density,
      connectedSize,
      calloutSeverity,
      header,
      footer,
      children,
      ...props
    },
    ref,
  ) => {
    const isSection = kind === 'section' || kind == null

    return (
      <div
        ref={ref}
        data-slot="surface-root"
        data-surface-kind={kind ?? 'section'}
        className={cn(
          surfaceVariants({
            kind: kind ?? 'section',
            variant,
            density,
            connectedSize,
            calloutSeverity,
          }),
          isSection && 'flex flex-col',
          className,
        )}
        {...props}
      >
        {isSection && header != null && header !== false && (
          <div
            data-slot="surface-header"
            className="shrink-0 border-b border-border [&:empty]:hidden"
          >
            {header}
          </div>
        )}
        {isSection ? (
          <div data-slot="surface-body" className="min-h-0 flex-1">
            {children}
          </div>
        ) : (
          children
        )}
        {isSection && footer != null && footer !== false && (
          <div
            data-slot="surface-footer"
            className="shrink-0 border-t border-border [&:empty]:hidden"
          >
            {footer}
          </div>
        )}
      </div>
    )
  },
)

Surface.displayName = 'Surface'

export { Surface }
export type { SurfaceProps }
