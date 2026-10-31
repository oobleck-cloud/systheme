'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

export const linkVariants = cva(
  [
    'inline-flex max-w-full min-w-0 items-center gap-1.5 font-medium transition-colors',
    'rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
  ],
  {
    variants: {
      variant: {
        default: 'text-fg-brand underline-offset-4 hover:underline',
        subtle: 'text-fg underline-offset-4 hover:text-fg-brand hover:underline',
        muted: 'text-fg-muted underline-offset-4 hover:text-fg hover:underline',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

export type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
  VariantProps<typeof linkVariants> & {
    href: string
    leading?: React.ReactNode
    trailing?: React.ReactNode
    /** When set, forces target/rel. When omitted, external links (http/https) open in a new tab. */
    external?: boolean
  }

const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant, size, href, leading, trailing, external, children, ...props }, ref) => {
    const isHttp =
      href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')
    const ext = external ?? isHttp

    return (
      <a
        ref={ref}
        href={href}
        className={cn(linkVariants({ variant, size }), className)}
        {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {leading ? <span className="inline-flex shrink-0">{leading}</span> : null}
        <span className="min-w-0 truncate">{children}</span>
        {trailing ? <span className="inline-flex shrink-0">{trailing}</span> : null}
      </a>
    )
  },
)

Link.displayName = 'Link'

export { Link }
