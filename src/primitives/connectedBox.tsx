'use client'

import { type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import {
  surfaceConnectedDividerVariants,
  surfaceConnectedSegmentVariants,
  surfaceVariants,
} from '@/primitives/surface'
import { cn } from '@/utils/cn'

/** @deprecated Surface kind=`connected` — transition wrapper */
const connectedBoxVariants = surfaceVariants

/** @deprecated surfaceConnectedSegmentVariants */
const connectedBoxSegmentVariants = surfaceConnectedSegmentVariants

/** @deprecated surfaceConnectedDividerVariants */
const connectedBoxDividerVariants = surfaceConnectedDividerVariants

type ConnectedBoxProps = React.HTMLAttributes<HTMLDivElement> &
  Omit<VariantProps<typeof surfaceVariants>, 'kind' | 'connectedSize'> & {
    size?: 'sm' | 'md' | 'lg'
    orientation?: 'horizontal' | 'vertical'
  }

const ConnectedBox = forwardRef<HTMLDivElement, ConnectedBoxProps>(
  ({ className, size = 'md', orientation = 'horizontal', ...props }, ref) => (
    <div
      ref={ref}
      data-slot="connected-box-root"
      className={cn(
        surfaceVariants({ kind: 'connected', connectedSize: size }),
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className,
      )}
      {...props}
    />
  ),
)

ConnectedBox.displayName = 'ConnectedBox'

type ConnectedBoxSegmentProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceConnectedSegmentVariants>

const ConnectedBoxSegment = forwardRef<HTMLDivElement, ConnectedBoxSegmentProps>(
  ({ className, flex, density, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="connected-box-segment"
      className={cn(surfaceConnectedSegmentVariants({ flex, density }), className)}
      {...props}
    />
  ),
)

ConnectedBoxSegment.displayName = 'ConnectedBoxSegment'

type ConnectedBoxDividerProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof surfaceConnectedDividerVariants>

const ConnectedBoxDivider = forwardRef<HTMLDivElement, ConnectedBoxDividerProps>(
  ({ className, orientation, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="connected-box-divider"
      className={cn(surfaceConnectedDividerVariants({ orientation }), className)}
      {...props}
    />
  ),
)

ConnectedBoxDivider.displayName = 'ConnectedBoxDivider'

export {
  ConnectedBox,
  ConnectedBoxDivider,
  ConnectedBoxSegment,
  connectedBoxDividerVariants,
  connectedBoxSegmentVariants,
  connectedBoxVariants,
}
export type { ConnectedBoxDividerProps, ConnectedBoxProps, ConnectedBoxSegmentProps }
