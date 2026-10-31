import { cn } from '@/utils/cn'

import type { HTMLAttributes, ReactNode } from 'react'

export type PageHeaderProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** 제목 위 경로 — 사이드바 그룹 이름을 잇는다(「조직 · 운영」). 없으면 생략한다. */
  eyebrow?: ReactNode
  title: ReactNode
  /** 제목 바로 옆 — 상태 배지처럼 제목과 한 줄로 읽혀야 하는 것. */
  titleAddon?: ReactNode
  /** 제목 앞 — 상세 화면의 아바타·아이콘. */
  leading?: ReactNode
  /** 제목 아래 한 줄 설명이나 요약(건수 등). */
  description?: ReactNode
  /** 오른쪽 끝 — 화면 단위 액션. primary 는 하나까지. */
  actions?: ReactNode
  /** 머리 밴드 아래줄 — 하위 화면 전환·상태 막대처럼 머리에 붙어 있어야 하는 것. */
  children?: ReactNode
  /** 밑줄. 머리 아래에 바로 표·툴바가 붙어 선이 겹치면 끈다. */
  bordered?: boolean
}

/**
 * 작업 화면의 머리 밴드 — 경로 · 제목 · 설명 · 액션.
 *
 * 화면마다 제목 크기와 여백을 다시 정하지 않도록 한 곳에 둔다. 모든 콘솔 화면이 이것으로
 * 시작하므로, 어느 탭을 열어도 제목이 같은 자리·같은 크기에 있다. 스크롤 영역 밖에 두어
 * 본문이 스크롤해도 머리는 남는다(`shrink-0`).
 */
function PageHeader({
  eyebrow,
  title,
  titleAddon,
  leading,
  description,
  actions,
  children,
  bordered = true,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        'flex shrink-0 flex-col gap-3 bg-background px-6 py-4',
        bordered && 'border-b border-border',
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-4">
          {leading && (
            <div data-slot="page-header-leading" className="shrink-0">
              {leading}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow && (
              <span data-slot="page-header-eyebrow" className="text-xs text-fg-subtle">
                {eyebrow}
              </span>
            )}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1
                data-slot="page-header-title"
                className="min-w-0 text-xl font-semibold tracking-tight text-fg"
              >
                {title}
              </h1>
              {titleAddon}
            </div>
            {description && (
              <div data-slot="page-header-description" className="max-w-3xl text-sm text-fg-subtle">
                {description}
              </div>
            )}
          </div>
        </div>
        {actions && (
          <div
            data-slot="page-header-actions"
            className="flex shrink-0 flex-wrap items-center gap-2"
          >
            {actions}
          </div>
        )}
      </div>
      {children}
    </header>
  )
}

export { PageHeader }
