import { forwardRef } from 'react'

import { Check, createIconElement } from '@/icons'
import { cn } from '@/utils/cn'

/**
 * 사실 목록 — 펼친 행 안의 짧은 패널(「이사」「받은 견적」「이 주문과 맞는 점」). 제목 줄(제목 · 오른쪽 보조) 아래에
 * 같은 문법의 행을 쌓는다: `라벨 | 값 · 보조 | 숫자`.
 *
 * 행 높이를 고정(h-8)해 나란히 둔 두 패널이 같은 선 위에 놓이고, 시선은 라벨 → 값 → 숫자로 흐른다.
 * 색은 보조 글의 경고(주황) 하나와 앞 표식(✓ · 주황 점 · 대시)에만 쓴다.
 */
type FactListProps = React.HTMLAttributes<HTMLElement> & {
  title: React.ReactNode
  /** 제목 오른쪽 작은 글(개수 `2 / 4`, 기준 `25~34평 포장 · 90일`). */
  aside?: React.ReactNode
}

const FactList = forwardRef<HTMLElement, FactListProps>(
  ({ className, title, aside, children, ...props }, ref) => (
    <section
      ref={ref}
      data-slot="fact-list"
      className={cn('flex min-w-0 flex-col', className)}
      {...props}
    >
      <div
        data-slot="fact-list-header"
        className="flex h-8 items-center justify-between gap-3 border-b border-border-subtle"
      >
        <h5 className="text-xs font-medium text-fg-subtle">{title}</h5>
        {aside != null ? <span className="text-xs text-fg-muted tabular-nums">{aside}</span> : null}
      </div>
      {children}
    </section>
  ),
)
FactList.displayName = 'FactList'

/** 앞 표식 — 맞음(✓) · 주의(주황 점) · 해당 없음(대시). */
type FactMark = 'ok' | 'warn' | 'none'

const MARKS: Record<FactMark, React.ReactNode> = {
  ok: createIconElement(Check, 'xs', 'h-3 w-3 text-success-text'),
  warn: <span className="block h-1.5 w-1.5 rounded-full bg-warning-primary" />,
  none: <span className="block h-px w-2 bg-border-strong" />,
}

type FactRowProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 라벨(명사, 흐림). 같은 라벨이 이어지면 둘째 줄부터 비운다. */
  label?: React.ReactNode
  value: React.ReactNode
  /** 값 옆 보조(작고 흐림). tone=warning 이면 주황. */
  sub?: React.ReactNode
  /** 오른쪽 숫자(굵게). */
  figure?: React.ReactNode
  /** 숫자를 흐리게 — 비교 기준(시세)처럼 주인공이 아닌 숫자. */
  figureMuted?: boolean
  mark?: FactMark
  tone?: 'warning'
  /** 위에 가는 선 — 묶음이 바뀌는 행(받은 견적 → 시세). */
  separated?: boolean
}

const FactRow = forwardRef<HTMLDivElement, FactRowProps>(
  ({ className, label, value, sub, figure, figureMuted, mark, tone, separated, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="fact-list-row"
      className={cn(
        'grid h-8 grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-3',
        separated && 'border-t border-border-subtle',
        className,
      )}
      {...props}
    >
      <span
        data-part="label"
        className="flex min-w-0 items-center gap-1.5 truncate text-xs text-fg-muted"
      >
        {mark ? <span className="flex w-3 shrink-0 justify-center">{MARKS[mark]}</span> : null}
        {label}
      </span>
      <span data-part="value" className="min-w-0 truncate text-sm text-fg">
        {value}
        {sub != null ? (
          <span
            className={cn(
              'ml-2 text-xs',
              tone === 'warning' ? 'text-warning-text' : 'text-fg-muted',
            )}
          >
            {sub}
          </span>
        ) : null}
      </span>
      <span
        data-part="figure"
        className={cn(
          'text-right text-sm tabular-nums',
          figureMuted ? 'font-medium text-fg-subtle' : 'font-semibold text-fg',
        )}
      >
        {figure}
      </span>
    </div>
  ),
)
FactRow.displayName = 'FactRow'

export { FactList, FactRow }
export type { FactListProps, FactRowProps, FactMark }
