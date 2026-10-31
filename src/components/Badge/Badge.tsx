'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'motion/react'

import { cn } from '@/utils/cn'

const badgeVariants = cva(
  'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium',
  {
    variants: {
      variant: {
        default: 'border border-border bg-background text-fg',
        primary: 'bg-brand-50 text-primary',
        success: 'bg-success-subtle text-success-text',
        warning: 'bg-warning-subtle text-warning-text',
        error: 'bg-error-subtle text-error-text',
        info: 'bg-info-subtle text-info-text',
        outline: 'border border-border bg-transparent text-fg',
        'outline-primary': 'border border-primary bg-transparent text-primary',
        'outline-success': 'border border-success-border bg-transparent text-success-text',
        'outline-warning': 'border border-warning-border bg-transparent text-warning-text',
        'outline-error': 'border border-error-border bg-transparent text-error-text',
        'outline-info': 'border border-info-border bg-transparent text-info-text',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

/* dot은 variant별로 vibrant primary 색상 사용 */
const dotColorMap: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-fg-muted',
  primary: 'bg-primary',
  success: 'bg-success-primary',
  warning: 'bg-warning-primary',
  error: 'bg-error-primary',
  info: 'bg-info-primary',
  outline: 'bg-fg-muted',
  'outline-primary': 'bg-primary',
  'outline-success': 'bg-success-primary',
  'outline-warning': 'bg-warning-primary',
  'outline-error': 'bg-error-primary',
  'outline-info': 'bg-info-primary',
}

/* variant와 독립적인 상태 점 — "중립 배지 + 상태 색 점" 조합용 */
const dotColorOverrideMap: Record<BadgeDotColor, string> = {
  success: 'bg-success-primary',
  warning: 'bg-warning-primary',
  error: 'bg-error-primary',
  info: 'bg-info-primary',
}

type BadgeDotColor = 'success' | 'warning' | 'error' | 'info'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & {
    dot?: boolean
    /** 지정 시 dot을 강제 표시하고 variant 색 대신 이 상태 색을 쓴다 */
    dotColor?: BadgeDotColor
  }

function Badge({
  className,
  variant = 'default',
  size,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  return (
    <motion.span
      layout="size"
      className={cn(badgeVariants({ variant, size }), className)}
      {...(props as any)}
    >
      {(dot || dotColor) && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            dotColor ? dotColorOverrideMap[dotColor] : dotColorMap[variant ?? 'default'],
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </motion.span>
  )
}

export { Badge, badgeVariants }
export type { BadgeProps, BadgeDotColor }
