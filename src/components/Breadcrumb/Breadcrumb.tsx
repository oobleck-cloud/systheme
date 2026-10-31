import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

export type BreadcrumbItem = {
  label: React.ReactNode
  href?: string
  onClick?: React.MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
}

type BreadcrumbProps = React.HTMLAttributes<HTMLElement> & {
  items: BreadcrumbItem[]
  separator?: React.ReactNode
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3 shrink-0 text-fg-muted"
      aria-hidden
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}

const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ className, items, separator, ...props }, ref) => {
    const sep = separator ?? <ChevronRight />

    return (
      <nav
        ref={ref}
        aria-label="breadcrumb"
        data-slot="breadcrumb-root"
        className={cn('flex items-center', className)}
        {...props}
      >
        <ol className="flex flex-wrap items-center gap-1 text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1

            return (
              <li key={index} className="flex items-center gap-1" data-slot="breadcrumb-crumb">
                {isLast ? (
                  <span
                    aria-current="page"
                    data-slot="breadcrumb-current"
                    className="max-w-[12rem] truncate font-medium text-fg"
                  >
                    {item.label}
                  </span>
                ) : item.href ? (
                  <a
                    href={item.href}
                    onClick={item.onClick as React.MouseEventHandler<HTMLAnchorElement>}
                    data-slot="breadcrumb-link"
                    className={cn(
                      'max-w-[12rem] truncate text-fg-subtle',
                      'transition-colors hover:text-fg',
                      'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    )}
                  >
                    {item.label}
                  </a>
                ) : (
                  // anatomy의 routing-link intent를 button element로 구현하는 케이스 —
                  // intent는 같으므로 data-slot은 link로 통일.
                  <button
                    type="button"
                    onClick={item.onClick as React.MouseEventHandler<HTMLButtonElement>}
                    data-slot="breadcrumb-link"
                    className={cn(
                      'max-w-[12rem] truncate text-fg-subtle',
                      'transition-colors hover:text-fg',
                      'focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    )}
                  >
                    {item.label}
                  </button>
                )}
                {!isLast && (
                  <span
                    aria-hidden
                    data-slot="breadcrumb-separator"
                    className="flex shrink-0 items-center text-fg-muted"
                  >
                    {sep}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    )
  },
)

Breadcrumb.displayName = 'Breadcrumb'

export { Breadcrumb }
export type { BreadcrumbProps }
