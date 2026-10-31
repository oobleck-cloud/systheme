'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { IconButton } from '@/components/IconButton'
import { cn } from '@/utils/cn'

const panelNavBarVariants = cva(
  'flex shrink-0 flex-row items-center border-b border-border bg-background',
  {
    variants: {
      density: {
        compact: 'h-10 gap-0.5 px-1',
        default: 'h-12 gap-1 px-1.5',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

export interface PanelNavBarProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof panelNavBarVariants> {
  /** 뒤로 이동 가능 여부 — false이면 back 버튼 비활성 */
  canGoBack?: boolean
  /** 앞으로 이동 가능 여부 — false이면 forward 버튼 비활성 */
  canGoForward?: boolean
  onGoBack?: () => void
  onGoForward?: () => void
  /** 오른쪽 끝 슬롯 — 추가 액션이나 라벨 삽입용 */
  endContent?: React.ReactNode
}

/**
 * 패널 하단 고정 네비게이션 바.
 *
 * back/forward 버튼을 통해 패널 내 히스토리를 탐색합니다.
 * `endContent`로 추가 액션 슬롯을 확장할 수 있습니다.
 */
const PanelNavBar = forwardRef<HTMLDivElement, PanelNavBarProps>(
  (
    {
      density,
      canGoBack = false,
      canGoForward = false,
      onGoBack,
      onGoForward,
      endContent,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="panel-nav-bar-root"
        className={cn(panelNavBarVariants({ density }), className)}
        {...props}
      >
        <IconButton
          data-slot="panel-nav-bar-back"
          size="xs"
          variant="ghost"
          shape="rounded"
          aria-label="이전 페이지로"
          title="뒤로 (Alt+←)"
          disabled={!canGoBack}
          onClick={onGoBack}
        >
          <ChevronLeftIcon />
        </IconButton>
        <IconButton
          data-slot="panel-nav-bar-forward"
          size="xs"
          variant="ghost"
          shape="rounded"
          aria-label="다음 페이지로"
          title="앞으로 (Alt+→)"
          disabled={!canGoForward}
          onClick={onGoForward}
        >
          <ChevronRightIcon />
        </IconButton>
        {endContent != null && (
          <div data-slot="panel-nav-bar-end" className="ml-auto flex items-center">
            {endContent}
          </div>
        )}
      </div>
    )
  },
)

PanelNavBar.displayName = 'PanelNavBar'

function ChevronLeftIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      data-slot="panel-nav-bar-back-icon"
    >
      <path
        d="M8 10L4 6L8 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      data-slot="panel-nav-bar-forward-icon"
    >
      <path
        d="M4 2L8 6L4 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { PanelNavBar, panelNavBarVariants }
