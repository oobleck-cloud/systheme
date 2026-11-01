'use client'

import { forwardRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { usePortalRoot } from '@/primitives/portalRoot'
import { cn } from '@/utils/cn'

export type BulkSelectionBarProps = React.HTMLAttributes<HTMLDivElement> & {
  selectedCount: number
  primaryLabel?: string
  clearLabel?: string
  selectedSuffix?: string
  onPrimaryAction?: () => void
  onClearSelection?: () => void
  /**
   * 목록 위에 떠 있는 바 — 스크롤 영역 아래(AI Dock 여백 위)에 붙어 가운데에 내용 폭으로 뜬다.
   * 행이 그 아래로 지나가도 표의 한 줄처럼 읽히지 않게 흰 면 · 그림자로 띄운다. 기본(false)은 목록 머리에 붙는 띠.
   */
  floating?: boolean
}

const BulkSelectionBar = forwardRef<HTMLDivElement, BulkSelectionBarProps>(
  (
    {
      className,
      selectedCount,
      primaryLabel = '실행',
      clearLabel = '선택 해제',
      selectedSuffix = '개 선택됨',
      onPrimaryAction,
      onClearSelection,
      floating = false,
      children,
      ...props
    },
    ref,
  ) => {
    const portalRoot = usePortalRoot()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    if (floating) {
      // 화면(뷰포트) 바닥에 고정 — 하단 크롬(앱의 AI 도크)과 같은 높이(--ds-floating-bar-bottom)에,
      // 가로로는 그 크롬이 차지한 폭(--ds-bottom-chrome-inline-clearance)을 비운 나머지의 가운데. 둘 다 앱 셸이 준다(DS 기본 1rem·0).
      // 포털로 body 에 그린다 — 조상에 transform 이 있으면 fixed 가 그 조상 기준이 된다.
      return mounted
        ? createPortal(
            <div
              data-slot="bulk-selection-bar-dock"
              className="pointer-events-none fixed inset-x-0 bottom-[var(--ds-floating-bar-bottom,1rem)] z-40 flex justify-center pr-[var(--ds-bottom-chrome-inline-clearance,0px)]"
            >
              <div
                ref={ref}
                data-slot="bulk-selection-bar-root"
                className={cn(
                  'pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-background py-1.5 pr-1.5 pl-4 text-fg shadow-lg',
                  className,
                )}
                {...props}
              >
                <span
                  data-slot="bulk-selection-bar-count"
                  className="text-sm font-medium whitespace-nowrap tabular-nums text-fg"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {selectedCount}
                  {selectedSuffix}
                </span>
                <span aria-hidden className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  {children != null && children !== false ? (
                    <div
                      data-slot="bulk-selection-bar-actions"
                      className="flex items-center gap-1.5"
                    >
                      {children}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    data-slot="bulk-selection-bar-clear"
                    variant="ghost"
                    size="sm"
                    disabled={!onClearSelection}
                    onClick={onClearSelection}
                  >
                    {clearLabel}
                  </Button>
                  <Button
                    type="button"
                    data-slot="bulk-selection-bar-primary"
                    variant="primary"
                    size="sm"
                    disabled={!onPrimaryAction}
                    onClick={onPrimaryAction}
                  >
                    {primaryLabel}
                  </Button>
                </div>
              </div>
            </div>,
            portalRoot,
          )
        : null
    }
    return (
      <div
        ref={ref}
        data-slot="bulk-selection-bar-root"
        className={cn('border-b border-border bg-muted px-4 py-2 text-fg shadow-sm', className)}
        {...props}
      >
        <Stack direction="horizontal" justify="between" align="center" gap={4} wrap>
          <span
            data-slot="bulk-selection-bar-count"
            className="text-sm font-medium tabular-nums text-fg-muted"
            aria-live="polite"
            aria-atomic="true"
          >
            {selectedCount}
            {selectedSuffix}
          </span>
          <Stack direction="horizontal" align="center" gap={2} wrap>
            {children != null && children !== false ? (
              <div
                data-slot="bulk-selection-bar-actions"
                className="flex flex-wrap items-center gap-2"
              >
                {children}
              </div>
            ) : null}
            <Button
              type="button"
              data-slot="bulk-selection-bar-primary"
              variant="primary"
              size="sm"
              disabled={!onPrimaryAction}
              onClick={onPrimaryAction}
            >
              {primaryLabel}
            </Button>
            <Button
              type="button"
              data-slot="bulk-selection-bar-clear"
              variant="ghost"
              size="sm"
              disabled={!onClearSelection}
              onClick={onClearSelection}
            >
              {clearLabel}
            </Button>
          </Stack>
        </Stack>
      </div>
    )
  },
)

BulkSelectionBar.displayName = 'BulkSelectionBar'

export { BulkSelectionBar }
