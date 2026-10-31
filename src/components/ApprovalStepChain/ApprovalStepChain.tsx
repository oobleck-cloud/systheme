'use client'

import { forwardRef, useCallback } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { TimelineMarker, type TimelinePhase } from '@/components/TimelineMarker/TimelineMarker'
import { cn } from '@/utils/cn'

export type ApprovalStepViewModel = { id: string; roleLabel: string; status: string }

export type ApprovalStepChainProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  steps: ApprovalStepViewModel[]
  onApprove?: (stepId: string) => void
  onReject?: (stepId: string) => void
  onDelegate?: (stepId: string) => void
}

function statusToPhase(status: string): TimelinePhase {
  switch (status.toLowerCase()) {
    case 'approved':
    case 'complete':
      return 'complete'
    case 'active':
      return 'active'
    case 'rejected':
      return 'neutral'
    case 'pending':
    case 'waiting':
    default:
      return 'pending'
  }
}

const ApprovalStepChain = forwardRef<HTMLDivElement, ApprovalStepChainProps>(
  ({ className, steps, onApprove, onReject, onDelegate, ...props }, ref) => {
    const wrap = useCallback((fn: ((id: string) => void) | undefined, id: string) => {
      if (!fn) return
      fn(id)
    }, [])

    return (
      <div
        ref={ref}
        role="list"
        data-slot="approval-step-chain-root"
        className={cn(
          'grid w-full items-center gap-x-2.5 gap-y-4',
          'grid-cols-[auto_1fr_auto_auto_auto_auto]',
          className,
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1

          return (
            <div
              key={step.id}
              role="listitem"
              data-slot="approval-step-chain-row"
              className="contents"
            >
              {/* Marker track — self-stretch so the spine fills to the row bottom */}
              <div className="flex w-10 flex-col items-center self-stretch">
                <div className="relative z-[1] mt-1 flex items-center justify-center">
                  <TimelineMarker
                    appearance="milestone"
                    size="sm"
                    phase={statusToPhase(step.status)}
                    showPhaseDot={false}
                  />
                </div>
                {!isLast && <div className="-mb-4 mt-1.5 min-h-3 w-px flex-1 bg-border" />}
              </div>

              {/* Role label */}
              <span
                data-slot="approval-step-chain-role"
                className="min-w-0 text-sm font-medium text-fg"
              >
                {step.roleLabel}
              </span>

              {/* Approve */}
              <Button
                type="button"
                size="sm"
                variant="primary"
                data-slot="approval-step-chain-approve"
                disabled={!onApprove}
                onClick={() => wrap(onApprove, step.id)}
              >
                Approve
              </Button>

              {/* Reject */}
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-slot="approval-step-chain-reject"
                disabled={!onReject}
                onClick={() => wrap(onReject, step.id)}
              >
                Reject
              </Button>

              {/* Delegate */}
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-slot="approval-step-chain-delegate"
                disabled={!onDelegate}
                onClick={() => wrap(onDelegate, step.id)}
              >
                Delegate
              </Button>

              {/* Status badge */}
              <span data-slot="approval-step-chain-status" className="text-right">
                <Badge variant="outline" size="sm">
                  {step.status}
                </Badge>
              </span>
            </div>
          )
        })}
      </div>
    )
  },
)

ApprovalStepChain.displayName = 'ApprovalStepChain'

export { ApprovalStepChain }
