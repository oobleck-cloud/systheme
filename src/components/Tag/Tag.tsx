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
      // 값 칩 — 테두리 없이 회색 면. 표 칸처럼 칩이 줄지어 서는 자리에서 테두리 선이 격자와 겹쳐 시끄럽지 않게.
      subtle: 'bg-tag-gray-subtle text-fg',
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
      // 표 칸 안의 값 칩(22px) — 행 M(48px) 한 줄에 칩 하나 높이. 관계 칸의 계층 값 칩이 쓴다.
      cell: 'h-5.5 px-1.75 text-xs',
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
    /**
     * 앞말 — 계층 값의 윗단(「서울 구로구」의 「서울」). 주면 앞말은 흐린 보통 굵기, 본말(children)은 굵게 그려
     * 칩마다 같은 앞말이 반복돼도 눈이 본말(구 이름)에 먼저 간다. 본말이 넘치면 본말만 말줄임한다.
     */
    qualifier?: React.ReactNode
  }

function Tag({
  className,
  variant,
  color,
  shape,
  size,
  qualifier,
  onRemove,
  children,
  ...props
}: TagProps) {
  const removeLabel = typeof children === 'string' ? `Remove ${children}` : 'Remove'
  const qualified = qualifier != null && qualifier !== ''

  return (
    <span
      className={cn(
        tagVariants({ variant, shape, size }),
        qualified && 'gap-0.75',
        color && TAG_COLOR_CLASS[color],
        className,
      )}
      {...props}
    >
      {color && (
        <span className={cn('size-1.5 shrink-0 rounded-full', TAG_DOT_CLASS[color])} aria-hidden />
      )}
      {qualified ? (
        <>
          <span data-tag-qualifier="" className="shrink-0 font-normal text-fg-muted">
            {qualifier}
          </span>
          <span className="min-w-0 truncate font-semibold">{children}</span>
        </>
      ) : (
        children
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className={cn(
            '-mr-0.5 flex items-center rounded-sm transition-opacity hover:opacity-60',
            // 회색 면 칩의 ✕ 는 앞말과 같은 흐린 색 — 본말보다 튀지 않게.
            variant === 'subtle' && 'text-fg-muted',
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
