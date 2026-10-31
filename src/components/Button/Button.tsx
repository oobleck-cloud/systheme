'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'
import { forwardRef } from 'react'

import { spring } from '@/foundations/motionTokens'
import { buttonColorVariants } from '@/utils/buttonColors'
import { cn } from '@/utils/cn'
import { pressScale } from '@/utils/interactionUtils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap',
    'transition-colors duration-effects-default ease-standard',
    pressScale,
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: buttonColorVariants,
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-md',
        icon: 'text-sm',
      },
      density: {
        compact: '',
        default: '',
        loose: '',
      },
      round: {
        none: 'rounded-none',
        // 토큰 문서의 선언을 따른다: --ds-radius-md(8px) = input, button, tag.
        // 종전 rounded-lg(12px)는 sm 높이(32px)의 37.5%로 사실상 캡슐로 읽혀,
        // 밀도 높은 운영 화면의 도구적 인상을 캐주얼하게 무너뜨렸고 같은 높이의
        // 입력(8px) 옆에서 곡률이 어긋났다. 카드(lg)·모달(xl)·배지(full)는 그대로다 —
        // 곡률 위계가 있어야 형태가 의미를 실어 나른다.
        default: 'rounded-md',
        full: 'rounded-full',
      },
    },
    compoundVariants: [
      // size=sm
      { size: 'sm', density: 'compact', class: 'h-7 px-2' },
      { size: 'sm', density: 'default', class: 'h-8 px-3' },
      { size: 'sm', density: 'loose', class: 'h-9 px-4' },
      // size=md
      { size: 'md', density: 'compact', class: 'h-9 px-3' },
      { size: 'md', density: 'default', class: 'h-10 px-4' },
      { size: 'md', density: 'loose', class: 'h-11 px-5' },
      // size=lg
      { size: 'lg', density: 'compact', class: 'h-11 px-5' },
      { size: 'lg', density: 'default', class: 'h-12 px-6' },
      { size: 'lg', density: 'loose', class: 'h-14 px-8' },
      // size=icon
      { size: 'icon', density: 'compact', class: 'h-8 w-8' },
      { size: 'icon', density: 'default', class: 'h-10 w-10' },
      { size: 'icon', density: 'loose', class: 'h-12 w-12' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      density: 'default',
      round: 'default',
    },
  },
)

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean
  }

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, density, round, isLoading = false, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, density, round }), className)}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        {...props}
      >
        <AnimatePresence>
          {isLoading && (
            <motion.span
              key="spinner"
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1, transition: spring.snappy }}
              exit={{ opacity: 0, scale: 0.7, transition: spring.snappy }}
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
        </AnimatePresence>
        {isLoading && <span className="sr-only">Loading</span>}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
export type { ButtonProps }
