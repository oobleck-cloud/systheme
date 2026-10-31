'use client'

import { forwardRef } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type BulkSelectionBarProps = React.HTMLAttributes<HTMLDivElement> & {
  selectedCount: number
  primaryLabel?: string
  clearLabel?: string
  selectedSuffix?: string
  onPrimaryAction?: () => void
  onClearSelection?: () => void
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
      children,
      ...props
    },
    ref,
  ) => {
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
