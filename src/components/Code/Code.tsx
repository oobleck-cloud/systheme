'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

// Code — 인라인 모노스페이스 식별자/코드 칩(예: api_call, 키, ID).
// 레거시의 `rounded bg-overlay px-1 py-0.5 font-mono text-xs` 패턴을 대체한다.
const codeVariants = cva('font-mono', {
  variants: {
    variant: {
      /** 배경 칩 — 식별자/키를 본문 속에서 구분. */
      chip: 'inline-flex items-center rounded bg-surface px-1.5 py-0.5 text-fg-subtle',
      /** 칩 없이 모노 텍스트만. */
      bare: 'text-fg',
    },
    size: {
      xs: 'text-xs',
      sm: 'text-sm',
    },
    truncate: { true: 'truncate', false: '' },
  },
  defaultVariants: {
    variant: 'chip',
    size: 'xs',
  },
})

type CodeProps = React.HTMLAttributes<HTMLElement> & VariantProps<typeof codeVariants>

const Code = forwardRef<HTMLElement, CodeProps>(function Code(
  { className, variant, size, truncate, ...props },
  ref,
) {
  return (
    <code
      ref={ref}
      data-slot="code-root"
      className={cn(codeVariants({ variant, size, truncate }), className)}
      {...props}
    />
  )
})

export { Code, codeVariants }
export type { CodeProps }
