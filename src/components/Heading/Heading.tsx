'use client'

import { forwardRef } from 'react'

import { textVariants, type TextProps } from '../Text/Text'

import { cn } from '@/utils/cn'

// Heading — 섹션/페이지 제목의 단일 진입점.
// level(1~6)이 태그와 기본 크기/굵기를 정하고, size/weight/tone 으로 개별 오버라이드 가능.
// 스타일은 Text 와 동일한 DS 토큰(textVariants)에 바인딩된다.

type HeadingSize = NonNullable<TextProps['size']>
type HeadingWeight = NonNullable<TextProps['weight']>

const levelDefaults: Record<1 | 2 | 3 | 4 | 5 | 6, { size: HeadingSize; weight: HeadingWeight }> = {
  1: { size: 'xl', weight: 'bold' },
  2: { size: 'lg', weight: 'semibold' },
  3: { size: 'md', weight: 'semibold' },
  4: { size: 'sm', weight: 'semibold' },
  5: { size: 'sm', weight: 'medium' },
  6: { size: 'xs', weight: 'semibold' },
}

type HeadingProps = Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'> &
  Pick<TextProps, 'size' | 'weight' | 'tone' | 'family' | 'align' | 'truncate'> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6
    /** 기본 태그(h{level})를 바꾸고 싶을 때. */
    as?: React.ElementType
  }

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(function Heading(
  { level = 2, as, size, weight, tone, family, align, truncate, className, ...props },
  ref,
) {
  const Tag = (as ?? `h${level}`) as React.ElementType
  const d = levelDefaults[level]
  return (
    <Tag
      ref={ref}
      data-slot="heading-root"
      className={cn(
        textVariants({
          size: size ?? d.size,
          weight: weight ?? d.weight,
          tone,
          family,
          align,
          truncate,
        }),
        className,
      )}
      {...props}
    />
  )
})

export { Heading }
export type { HeadingProps }
