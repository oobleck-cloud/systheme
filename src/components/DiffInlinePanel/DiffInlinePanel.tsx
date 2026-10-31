'use client'

import { forwardRef, useCallback } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

export type DiffLineKind = 'add' | 'remove' | 'change' | 'context'

export type DiffLineViewModel = {
  id: string
  kind: DiffLineKind
  leftText: string
  rightText: string
}

export type DiffInlinePanelProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  lines: DiffLineViewModel[]
  onLineActivate?: (lineId: string) => void
}

function kindVariant(kind: DiffLineKind): 'success' | 'error' | 'warning' | 'default' {
  if (kind === 'add') return 'success'
  if (kind === 'remove') return 'error'
  if (kind === 'change') return 'warning'
  return 'default'
}

const DiffInlinePanel = forwardRef<HTMLDivElement, DiffInlinePanelProps>(
  ({ className, lines, onLineActivate, ...props }, ref) => {
    const handleOpen = useCallback(
      (id: string) => {
        onLineActivate?.(id)
      },
      [onLineActivate],
    )

    return (
      <Surface
        ref={ref}
        kind="section"
        density="compact"
        data-slot="diff-inline-panel-root"
        className={cn('w-full overflow-hidden [&_[data-slot=surface-body]]:p-0', className)}
        {...props}
      >
        <Stack direction="vertical" gap={0}>
          {lines.map((line) => (
            <div
              key={line.id}
              data-slot="diff-inline-panel-row"
              className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2 border-b border-border px-2 py-1.5 last:border-b-0"
            >
              <span data-slot="diff-inline-panel-kind" className="shrink-0">
                <Badge variant={kindVariant(line.kind)} size="sm">
                  {line.kind}
                </Badge>
              </span>
              <span
                data-slot="diff-inline-panel-left"
                className="min-w-0 truncate font-mono text-xs text-fg-muted"
              >
                {line.leftText || '\u00A0'}
              </span>
              <span
                data-slot="diff-inline-panel-right"
                className="min-w-0 truncate font-mono text-xs text-fg"
              >
                {line.rightText || '\u00A0'}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-slot="diff-inline-panel-open"
                disabled={!onLineActivate}
                onClick={() => handleOpen(line.id)}
              >
                Open
              </Button>
            </div>
          ))}
        </Stack>
      </Surface>
    )
  },
)

DiffInlinePanel.displayName = 'DiffInlinePanel'

export { DiffInlinePanel }
