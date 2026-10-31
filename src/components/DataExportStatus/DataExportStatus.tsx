'use client'

import { forwardRef, useMemo, useState } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { Progress } from '@/components/Progress/Progress'
import { cn } from '@/utils/cn'

export type DataExportPhase = 'idle' | 'queued' | 'running' | 'succeeded' | 'failed'

export type DataExportStatusProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  visible?: boolean
  defaultVisible?: boolean
  phase?: DataExportPhase
  defaultPhase?: DataExportPhase
  progress?: number
  errorMessage?: string
  onDownload?: () => void
  onDismiss?: () => void
  onRetry?: () => void
}

function phaseLabel(phase: DataExportPhase): string {
  switch (phase) {
    case 'idle':
      return '대기'
    case 'queued':
      return '대기열'
    case 'running':
      return '내보내는 중'
    case 'succeeded':
      return '완료'
    case 'failed':
      return '실패'
    default:
      return phase
  }
}

const DataExportStatus = forwardRef<HTMLDivElement, DataExportStatusProps>(
  (
    {
      className,
      visible: visibleProp,
      defaultVisible = true,
      phase: phaseProp,
      defaultPhase = 'idle',
      progress = 0,
      errorMessage,
      onDownload,
      onDismiss,
      onRetry,
      ...props
    },
    ref,
  ) => {
    const [internalVisible, setInternalVisible] = useState(defaultVisible)
    const [internalPhase, setInternalPhase] = useState<DataExportPhase>(defaultPhase)

    const isVisibleControlled = visibleProp !== undefined
    const isPhaseControlled = phaseProp !== undefined

    const visible = isVisibleControlled ? visibleProp! : internalVisible
    const phase = isPhaseControlled ? phaseProp! : internalPhase

    function handleDismiss() {
      if (!isVisibleControlled) setInternalVisible(false)
      onDismiss?.()
    }

    function handleRetry() {
      if (!isPhaseControlled) setInternalPhase('running')
      onRetry?.()
    }

    const badgeVariant = useMemo(() => {
      if (phase === 'failed') return 'error' as const
      if (phase === 'succeeded') return 'success' as const
      if (phase === 'running' || phase === 'queued') return 'warning' as const
      return 'default' as const
    }, [phase])

    if (!visible) return null

    return (
      <div
        ref={ref}
        data-slot="data-export-status-root"
        className={cn(
          'rounded-lg border border-border bg-background px-3 py-2 shadow-sm',
          className,
        )}
        {...props}
      >
        <Stack direction="horizontal" align="center" justify="between" gap={4} wrap>
          <span data-slot="data-export-status-severity">
            <Badge variant={badgeVariant} size="sm" dot>
              {phaseLabel(phase)}
            </Badge>
          </span>
          <Stack direction="horizontal" align="center" gap={2} wrap>
            <div data-slot="data-export-status-progress" className="w-32 min-w-32">
              <Progress
                value={phase === 'running' ? progress : phase === 'succeeded' ? 100 : 0}
                max={100}
                size="sm"
                variant={phase === 'failed' ? 'error' : 'default'}
              />
            </div>
            <p
              data-slot="data-export-status-error"
              className={cn(
                'max-w-xs min-h-4 text-xs',
                errorMessage ? 'text-error-text' : 'text-fg-muted',
              )}
            >
              {errorMessage || '\u00A0'}
            </p>
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-slot="data-export-status-download"
              disabled={phase !== 'succeeded' || !onDownload}
              onClick={onDownload}
            >
              다운로드
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-slot="data-export-status-retry"
              disabled={phase !== 'failed'}
              onClick={handleRetry}
            >
              재시도
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="data-export-status-dismiss"
              onClick={handleDismiss}
            >
              닫기
            </Button>
          </Stack>
        </Stack>
      </div>
    )
  },
)

DataExportStatus.displayName = 'DataExportStatus'

export { DataExportStatus }
