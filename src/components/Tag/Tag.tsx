import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

// 칩은 한 줄이다 — 좁은 칸에서 「성과/점검」처럼 꺾이면 칩이 아니라 문단으로 읽힌다.
const tagVariants = cva('inline-flex items-center gap-1 font-medium whitespace-nowrap', {
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
    shape: {
      rounded: 'rounded-md',
      pill: 'rounded-full',
      square: 'rounded-sm',
    },
    size: {
      sm: 'h-5 px-2 text-xs',
      md: 'h-6 px-2.5 text-xs',
      lg: 'h-7 px-3 text-sm',
    },
  },
  defaultVariants: {
    variant: 'default',
    shape: 'rounded',
    size: 'md',
  },
})

/**
 * 노션식 태그 색. `variant` 와 직교 — 지정 시 색이 배경/텍스트를 덮는다.
 *
 * 표기는 **연한 색 바탕 + 진한 점**이다. 파스텔 바탕만으로는 파랑·보라·청록이 한눈에 갈리지 않아
 * 진한 점(500)을 앞에 더했다. 바탕까지 회색으로 비운 판도 써 봤으나 색이 너무 죽어 바탕 색은 되살렸다(2026-10-02).
 *
 * 주의: 이건 **분류 색**이지 상태 색이 아니다. 조치 필요도(실패=빨강 > 경고=주황 > 완료=초록)를
 * 뜻하는 자리에는 `variant` 를 쓴다. 여기서 red 는 그냥 "빨간 라벨"이다.
 */
export type TagColor = 'gray' | 'red' | 'orange' | 'green' | 'teal' | 'blue' | 'purple'

const TAG_COLOR_CLASS: Record<TagColor, string> = {
  gray: 'border-transparent bg-tag-gray-subtle text-tag-gray-text',
  red: 'border-transparent bg-tag-red-subtle text-tag-red-text',
  orange: 'border-transparent bg-tag-orange-subtle text-tag-orange-text',
  green: 'border-transparent bg-tag-green-subtle text-tag-green-text',
  teal: 'border-transparent bg-tag-teal-subtle text-tag-teal-text',
  blue: 'border-transparent bg-tag-blue-subtle text-tag-blue-text',
  purple: 'border-transparent bg-tag-purple-subtle text-tag-purple-text',
}

const TAG_DOT_CLASS: Record<TagColor, string> = {
  gray: 'bg-tag-gray-dot',
  red: 'bg-tag-red-dot',
  orange: 'bg-tag-orange-dot',
  green: 'bg-tag-green-dot',
  teal: 'bg-tag-teal-dot',
  blue: 'bg-tag-blue-dot',
  purple: 'bg-tag-purple-dot',
}

type TagProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof tagVariants> & {
    onRemove?: () => void
    /** 노션식 색 칩. 지정 시 variant 의 배경/텍스트를 덮어쓴다. */
    color?: TagColor
  }

function Tag({ className, variant, color, shape, size, onRemove, children, ...props }: TagProps) {
  const removeLabel = typeof children === 'string' ? `Remove ${children}` : 'Remove'

  return (
    <span
      className={cn(
        tagVariants({ variant, shape, size }),
        color && TAG_COLOR_CLASS[color],
        className,
      )}
      {...props}
    >
      {color && (
        <span className={cn('size-1.5 shrink-0 rounded-full', TAG_DOT_CLASS[color])} aria-hidden />
      )}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className={cn(
            '-mr-0.5 flex items-center rounded-sm transition-opacity hover:opacity-60',
            'focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none',
            shape === 'pill' && 'rounded-full',
          )}
          aria-label={removeLabel}
        >
          <svg
            className="h-3 w-3"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      )}
    </span>
  )
}

export { Tag, tagVariants }
export type { TagProps }
