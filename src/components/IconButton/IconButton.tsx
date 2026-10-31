'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { buttonColorVariants } from '@/utils/buttonColors'
import { cn } from '@/utils/cn'
import { pressScale } from '@/utils/interactionUtils'

const iconButtonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center',
    'transition-colors duration-effects-default ease-standard',
    pressScale,
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: buttonColorVariants,
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-14 w-14 text-lg',
      },
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-md',
        square: 'rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'ghost',
      size: 'md',
      shape: 'rounded',
    },
  },
)

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & {
    isLoading?: boolean
    'aria-label': string
  }

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, shape, isLoading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(iconButtonVariants({ variant, size, shape }), className)}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              aria-hidden="true"
              className="h-[45%] w-[45%] animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            <span className="sr-only">Loading</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'

export { IconButton, iconButtonVariants }
export type { IconButtonProps }
