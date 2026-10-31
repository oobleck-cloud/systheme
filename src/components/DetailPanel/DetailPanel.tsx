import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

/**
 * 상세 칸 시스템 — 서랍 · 옆 패널 · 상세 화면처럼 칸(섹션)으로 나뉘는 화면의 공통 틀(사람 결정 2026-10-29 B안 · 구분선).
 *
 * 규칙(docs/design-system/decisions.md 「상세 칸 시스템」):
 * - 칸 사이는 1px 구분선(border) + 위아래 24. 맨 위 요약은 구분선 대신 옅은 바탕(container-low) 카드.
 * - 글자는 네 단계 — 핵심 값 xl 굵게 · 칸 제목 sm 굵게 · 본문 sm · 보조 xs(fg-subtle). 11px · 대문자 제목을 쓰지 않는다.
 * - 칸 안 12 · 줄 사이 8 · 이름 위 값 아래 4. 패널 안쪽 24 · 20.
 * - 칸 안의 묶음(시세 띠 · 시간대)은 테두리 대신 옅은 바탕 카드(DetailInset).
 * - SideSheet 안에서는 `flush` 로 시트 여백 하나만 쓰고, 요약 · 묶음 카드는 흰 바탕이다(시트 바탕이 container-low 와 같은 회색).
 *
 * 차례: DetailPanel > (DetailSummary) > DetailSection* — 각 DetailSection 위에 구분선이 붙는다.
 */
type DetailPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 패널 안쪽 여백을 뺀다 — 이미 여백이 있는 틀(SideSheet 본문 등) 안에 넣을 때. */
  flush?: boolean
}

const DetailPanel = forwardRef<HTMLDivElement, DetailPanelProps>(
  ({ className, flush, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="detail-panel"
      className={cn('flex min-w-0 flex-col gap-6', !flush && 'px-6 py-5', className)}
      {...props}
    />
  ),
)
DetailPanel.displayName = 'DetailPanel'

/** SideSheet 바탕(surface)은 container-low 와 같은 회색이라, 서랍 안에서는 카드를 흰 바탕으로 띄운다. */
const INSET_ON_SHEET = 'in-data-[slot=side-sheet-body]:bg-background'

/** 맨 위 요약 — 옅은 바탕 카드. 이름 · 핵심 값 · 상태 배지 · 바닥 한 줄과 행동을 담는다. */
const DetailSummary = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="detail-panel-summary"
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl bg-container-low p-4',
        INSET_ON_SHEET,
        className,
      )}
      {...props}
    />
  ),
)
DetailSummary.displayName = 'DetailSummary'

type DetailSectionProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title: React.ReactNode
  /** 제목 옆 개수(흐림). */
  count?: number | null
  /** 제목 옆 — 상태 배지 하나. */
  badge?: React.ReactNode
  /** 칸 머리 오른쪽 — 글자 행동(더 보기 · 메모 쓰기). */
  action?: React.ReactNode
}

/** 칸 — 위에 구분선, 칸 머리(제목 · 개수 · 배지 … 오른쪽 행동) 아래 내용. */
const DetailSection = forwardRef<HTMLElement, DetailSectionProps>(
  ({ className, title, count, badge, action, children, ...props }, ref) => (
    <section
      ref={ref}
      data-slot="detail-panel-section"
      className={cn('flex min-w-0 flex-col gap-3 border-t border-border pt-6', className)}
      {...props}
    >
      <div data-slot="detail-panel-section-header" className="flex min-w-0 items-center gap-2">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {count != null ? (
          <span className="text-sm text-fg-subtle tabular-nums">{count}</span>
        ) : null}
        {badge}
        {action != null ? (
          <span className="ml-auto flex shrink-0 items-center">{action}</span>
        ) : null}
      </div>
      {children}
    </section>
  ),
)
DetailSection.displayName = 'DetailSection'

/** 이름-값 두 열 — 이름 6rem(흐림) · 사이 16 · 줄 8. 값이 없으면 줄을 세우지 않는다. 이름이 길면 DetailStacked. */
type DetailFactsProps = React.HTMLAttributes<HTMLDListElement> & {
  rows: Array<[React.ReactNode, React.ReactNode | null | undefined]>
}

const DetailFacts = forwardRef<HTMLDListElement, DetailFactsProps>(
  ({ className, rows, ...props }, ref) => {
    const shown = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
    if (shown.length === 0) return null
    return (
      <dl
        ref={ref}
        data-slot="detail-panel-facts"
        className={cn('grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm', className)}
        {...props}
      >
        {shown.map(([label, value], i) => (
          <div key={i} className="contents">
            <dt className="text-fg-subtle">{label}</dt>
            <dd className="min-w-0 break-keep text-fg tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    )
  },
)
DetailFacts.displayName = 'DetailFacts'

/** 이름 위 · 값 아래 — 이름이 긴 문항(질문지 답). 사이 4, 묶음 사이 12. */
const DetailStacked = forwardRef<HTMLDListElement, DetailFactsProps>(
  ({ className, rows, ...props }, ref) => {
    if (rows.length === 0) return null
    return (
      <dl
        ref={ref}
        data-slot="detail-panel-stacked"
        className={cn('flex flex-col gap-3 text-sm', className)}
        {...props}
      >
        {rows.map(([label, value], i) => (
          <div key={i} className="flex min-w-0 flex-col gap-1">
            <dt className="text-xs text-fg-subtle">{label}</dt>
            <dd className="min-w-0 break-keep text-fg">
              {value ?? <span className="text-fg-muted">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    )
  },
)
DetailStacked.displayName = 'DetailStacked'

/** 목록 — 구분선 없이 줄 사이 12. */
const DetailList = forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="detail-panel-list"
      className={cn('flex flex-col gap-3', className)}
      {...props}
    />
  ),
)
DetailList.displayName = 'DetailList'

type DetailListItemProps = Omit<React.LiHTMLAttributes<HTMLLIElement>, 'title'> & {
  title: React.ReactNode
  /** 보조 한 줄(xs · 흐림). */
  meta?: React.ReactNode
  /** 앞 표식(구역 색 점 등). */
  lead?: React.ReactNode
  /** 오른쪽 — 상태 배지 하나. */
  trailing?: React.ReactNode
}

const DetailListItem = forwardRef<HTMLLIElement, DetailListItemProps>(
  ({ className, title, meta, lead, trailing, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="detail-panel-list-item"
      className={cn('flex min-w-0 items-center gap-3', className)}
      {...props}
    >
      {lead != null ? <span className="flex shrink-0 items-center">{lead}</span> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm text-fg">{title}</span>
        {meta != null && meta !== '' ? (
          <span className="truncate text-xs text-fg-subtle tabular-nums">{meta}</span>
        ) : null}
      </div>
      {trailing != null ? <span className="flex shrink-0 items-center">{trailing}</span> : null}
    </li>
  ),
)
DetailListItem.displayName = 'DetailListItem'

/** 칸 안의 묶음 — 테두리 대신 옅은 바탕 카드(시세 띠 · 시간대). */
const DetailInset = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="detail-panel-inset"
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-xl bg-container-low p-4',
        INSET_ON_SHEET,
        className,
      )}
      {...props}
    />
  ),
)
DetailInset.displayName = 'DetailInset'

/** 행동 줄 — 칸 안 버튼 묶음(주 행동 하나 + 보조). 패널 바닥 적용 줄은 DetailSection 안에 꽉 찬 버튼으로. */
const DetailActions = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="detail-panel-actions"
      className={cn('flex flex-wrap items-center gap-2', className)}
      {...props}
    />
  ),
)
DetailActions.displayName = 'DetailActions'

/** 중립 배지 덮개 — Badge default 의 테두리를 걷어 회색 바탕으로(상세 칸 시스템은 테두리 없는 채운 배지 하나). */
const DETAIL_NEUTRAL_BADGE = 'border-transparent bg-container-high text-fg-subtle'

export {
  DETAIL_NEUTRAL_BADGE,
  DetailActions,
  DetailFacts,
  DetailInset,
  DetailList,
  DetailListItem,
  DetailPanel,
  DetailSection,
  DetailStacked,
  DetailSummary,
}
export type { DetailFactsProps, DetailListItemProps, DetailPanelProps, DetailSectionProps }
