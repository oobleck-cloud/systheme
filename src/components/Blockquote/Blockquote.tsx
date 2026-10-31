import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

/**
 * 인용·제시문 — 문제의 고객 발화, 문서에서 끌어온 문장처럼 "남의 말"을 본문과 갈라 놓는다.
 *
 * 왼쪽 3px 선 + 한 단 눌린 표면. 선은 accent(브랜드)가 기본이다 — 회색 선은 코드 블록·
 * 비활성 영역과 구분이 안 되고, 눈이 먼저 가야 할 제시문이 배경으로 가라앉는다
 * (hire.mvos.app 문제 화면의 q-stimulus 처방). 조치 필요도를 말하는 색이 아니므로 상태색은 쓰지 않는다.
 * 출제자가 넣은 줄바꿈을 살린다(pre-line).
 */
const blockquoteVariants = cva(
  'border-l-[3px] px-4 py-3 text-sm leading-relaxed tracking-tight whitespace-pre-line text-fg',
  {
    variants: {
      tone: {
        accent: 'border-primary bg-surface',
        neutral: 'border-border-strong bg-surface',
      },
    },
    defaultVariants: { tone: 'accent' },
  },
)

type BlockquoteProps = React.BlockquoteHTMLAttributes<HTMLQuoteElement> &
  VariantProps<typeof blockquoteVariants> & {
    /** 출처 — 있으면 아래 줄에 작게 */
    citation?: React.ReactNode
  }

const Blockquote = forwardRef<HTMLQuoteElement, BlockquoteProps>(
  ({ className, tone, citation, children, ...props }, ref) => (
    <blockquote
      ref={ref}
      data-slot="blockquote"
      className={cn(blockquoteVariants({ tone }), className)}
      {...props}
    >
      {children}
      {citation != null && (
        <footer data-slot="blockquote-citation" className="mt-1.5 text-xs text-fg-muted">
          {citation}
        </footer>
      )}
    </blockquote>
  ),
)
Blockquote.displayName = 'Blockquote'

export { Blockquote, blockquoteVariants }
export type { BlockquoteProps }
