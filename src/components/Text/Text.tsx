'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

// Text — 인라인/본문 텍스트의 단일 진입점.
// 페이지·컴포넌트에서 인라인 타이포(text-sm·font-medium + 직접 색 토큰 지정)를 전부
// 이 프리미티브로 대체한다. 색/크기/굵기는 DS 토큰(@theme)에만 바인딩된다.
const textVariants = cva('', {
  variants: {
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-md',
      lg: 'text-lg',
      xl: 'text-xl',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    tone: {
      default: 'text-fg',
      subtle: 'text-fg-subtle',
      muted: 'text-fg-muted',
      brand: 'text-primary',
      inverse: 'text-fg-inverse',
      success: 'text-success-text',
      warning: 'text-warning-text',
      error: 'text-error-text',
      info: 'text-info-text',
    },
    family: {
      sans: 'font-sans',
      mono: 'font-mono',
    },
    align: {
      start: 'text-left',
      center: 'text-center',
      end: 'text-right',
    },
    truncate: { true: 'truncate', false: '' },
    numeric: { true: 'tabular-nums', false: '' },
    italic: { true: 'italic', false: '' },
    clamp: {
      1: 'line-clamp-1',
      2: 'line-clamp-2',
      3: 'line-clamp-3',
    },
  },
  defaultVariants: {
    size: 'sm',
    weight: 'regular',
    tone: 'default',
  },
})

type TextProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    /** 렌더 태그. 기본 p. 인라인이 필요하면 as="span". */
    as?: React.ElementType
  }

const Text = forwardRef<HTMLElement, TextProps>(function Text(
  {
    as: Tag = 'p',
    size,
    weight,
    tone,
    family,
    align,
    truncate,
    numeric,
    italic,
    className,
    ...props
  },
  ref,
) {
  return (
    <Tag
      ref={ref}
      data-slot="text-root"
      className={cn(
        textVariants({ size, weight, tone, family, align, truncate, numeric, italic }),
        className,
      )}
      {...props}
    />
  )
})

export { Text, textVariants }
export type { TextProps }
