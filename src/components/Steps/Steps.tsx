'use client'

import { motion } from 'motion/react'
import { forwardRef } from 'react'

import { spring } from '@/foundations/motionTokens'
import { cn } from '@/utils/cn'

type StepStatus = 'completed' | 'current' | 'upcoming'

export type StepItem = {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
}

type StepsProps = React.HTMLAttributes<HTMLOListElement> & {
  steps: StepItem[]
  currentStep: number
  onStepChange?: (index: number) => void
  orientation?: 'horizontal' | 'vertical'
  /**
   * `default` — 원 + 연결선 + 라벨(진행 폼·위저드).
   * `text` — "영상 시청 › 문제 풀기 › 이수 완료" 한 줄 글자 브레드크럼. 현재 단계만 진하게.
   *   콘텐츠(영상·문서) 위에 얹는 얇은 위치 표시용 — 학습 화면(LMS)에서 왔다.
   *   가로 전용이며 description 은 그리지 않는다.
   * `compact` — 한 줄 「(✓) 필요 인원 — (✓) 가능 일정 — (3) 초안 다듬기」. 원(20px) 오른쪽에 라벨, 짧은
   *   연결선. 페이지 머리(PageHeader 제목 옆)처럼 높이가 한 줄뿐인 자리용. 원 색 규칙은 default 와 같다
   *   (지금 단계만 진한 primary, 끝난 단계는 primary-container + 체크). 가로 전용, description 없음.
   */
  appearance?: 'default' | 'text' | 'compact'
}

/** 글자 브레드크럼 — 상호작용 없이 위치만 말한다(onStepChange 는 무시). */
const TextSteps = forwardRef<
  HTMLOListElement,
  Omit<StepsProps, 'appearance' | 'orientation' | 'onStepChange'>
>(({ steps, currentStep, className, ...props }, ref) => {
  return (
    <ol
      ref={ref}
      data-slot="steps"
      data-appearance="text"
      className={cn(
        'flex flex-wrap items-center gap-2 text-xs font-medium text-fg-muted',
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const isCurrent = index === currentStep
        return (
          <li key={step.id} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden className="font-normal">
                ›
              </span>
            )}
            <span
              data-slot="steps-label"
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(isCurrent && 'font-bold text-fg')}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
})
TextSteps.displayName = 'Steps.Text'

/** 한 줄 단계 — 머리 높이에 들어가는 작은 원 + 옆 라벨. 상호작용 없이 위치만 말한다. */
const CompactSteps = forwardRef<
  HTMLOListElement,
  Omit<StepsProps, 'appearance' | 'orientation' | 'onStepChange'>
>(({ steps, currentStep, className, ...props }, ref) => {
  return (
    <ol
      ref={ref}
      data-slot="steps"
      data-appearance="compact"
      className={cn('flex items-center gap-2', className)}
      {...props}
    >
      {steps.map((step, index) => {
        const status: StepStatus =
          index < currentStep ? 'completed' : index === currentStep ? 'current' : 'upcoming'
        return (
          <li
            key={step.id}
            data-slot="step-item"
            data-status={status}
            className="flex items-center gap-2"
          >
            {index > 0 && <span aria-hidden className="h-px w-6 bg-border" />}
            <span className="flex items-center gap-1.5">
              <span
                data-slot="steps-indicator"
                aria-hidden
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                  status === 'completed' && 'bg-primary-container text-primary',
                  status === 'current' && 'bg-primary text-primary-fg',
                  status === 'upcoming' && 'border border-border bg-background text-fg-muted',
                )}
              >
                {status === 'completed' ? <CheckIcon className="size-3" /> : index + 1}
              </span>
              <span
                data-slot="steps-label"
                aria-current={status === 'current' ? 'step' : undefined}
                className={cn(
                  'text-sm whitespace-nowrap',
                  status === 'current' ? 'font-semibold text-fg' : 'text-fg-muted',
                )}
              >
                {step.label}
                {status === 'completed' && <span className="sr-only"> (완료)</span>}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
})
CompactSteps.displayName = 'Steps.Compact'

function CheckIcon({ className = 'size-3.5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M3 8l3.5 3.5L13 4" />
    </svg>
  )
}

const Steps = forwardRef<HTMLOListElement, StepsProps>(
  (
    {
      className,
      steps,
      currentStep,
      onStepChange,
      orientation = 'horizontal',
      appearance = 'default',
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    if (appearance === 'compact') {
      return (
        <CompactSteps
          ref={ref}
          steps={steps}
          currentStep={currentStep}
          className={className}
          onKeyDown={onKeyDown}
          {...props}
        />
      )
    }

    if (appearance === 'text') {
      return (
        <TextSteps
          ref={ref}
          steps={steps}
          currentStep={currentStep}
          className={className}
          onKeyDown={onKeyDown}
          {...props}
        />
      )
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLOListElement>) {
      onKeyDown?.(e)
      if (e.defaultPrevented || !onStepChange) return

      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp'
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown'
      const key = e.key
      if (![prevKey, nextKey, 'Home', 'End'].includes(key)) return

      const indicators = Array.from(
        e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-slot="steps-indicator"]'),
      )
      const current = document.activeElement as HTMLButtonElement
      const currentIdx = indicators.indexOf(current)
      if (currentIdx < 0) return

      const isClickableAt = (index: number) => index <= currentStep

      e.preventDefault()
      let targetIdx = currentIdx

      if (key === nextKey) {
        for (let i = currentIdx + 1; i < steps.length; i++) {
          if (isClickableAt(i)) {
            targetIdx = i
            break
          }
        }
      } else if (key === prevKey) {
        for (let i = currentIdx - 1; i >= 0; i--) {
          if (isClickableAt(i)) {
            targetIdx = i
            break
          }
        }
      } else if (key === 'Home') {
        targetIdx = 0
      } else if (key === 'End') {
        targetIdx = currentStep
      }

      if (!isClickableAt(targetIdx)) return
      indicators[targetIdx]?.focus()
      if (targetIdx !== currentIdx) onStepChange(targetIdx)
    }

    const horizontal = orientation === 'horizontal'

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown delegated to inner step indicator buttons
      <ol
        ref={ref}
        data-slot="steps-root"
        data-orientation={orientation}
        className={cn('flex', horizontal ? 'flex-row items-start' : 'flex-col', className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {steps.map((step, index) => {
          const status: StepStatus =
            index < currentStep ? 'completed' : index === currentStep ? 'current' : 'upcoming'
          const isLast = index === steps.length - 1
          const isClickable = !!onStepChange && status !== 'upcoming'

          return (
            <li
              key={step.id}
              data-slot="step-item"
              data-status={status}
              className={cn(
                'relative flex min-w-0',
                // 가로: 칸마다 원을 가운데 두고 라벨을 그 아래 가운데 — 원과 라벨이 한 축에 선다.
                // 세로: 원 오른쪽에 라벨·설명, 다음 단계까지 간격을 둔다.
                horizontal ? 'flex-1 flex-col items-center' : 'flex-row gap-3 pb-6 last:pb-0',
              )}
            >
              {/* 연결선 — 이 원의 가장자리에서 다음 원의 가장자리까지(원 지름 24px + 여백 4px). */}
              {!isLast && (
                <div
                  aria-hidden
                  data-slot="steps-connector"
                  className={cn(
                    'absolute overflow-hidden rounded-full bg-border',
                    horizontal
                      ? 'top-3 right-[calc(-50%+1rem)] left-[calc(50%+1rem)] h-0.5 -translate-y-1/2'
                      : 'top-7 bottom-1 left-3 w-0.5 -translate-x-1/2',
                  )}
                >
                  <motion.div
                    className="h-full w-full bg-primary-container-hover"
                    initial={false}
                    animate={
                      horizontal
                        ? { scaleX: index < currentStep ? 1 : 0 }
                        : { scaleY: index < currentStep ? 1 : 0 }
                    }
                    style={horizontal ? { originX: 0 } : { originY: 0 }}
                    transition={spring.standard}
                  />
                </div>
              )}

              {/* Step indicator button */}
              <button
                type="button"
                aria-current={status === 'current' ? 'step' : undefined}
                aria-label={`${typeof step.label === 'string' ? step.label : `단계 ${index + 1}`}${status === 'completed' ? ' (완료)' : status === 'current' ? ' (현재)' : ''}`}
                onClick={isClickable ? () => onStepChange?.(index) : undefined}
                disabled={!isClickable}
                data-slot="steps-indicator"
                className={cn(
                  'relative flex size-6 shrink-0 items-center justify-center rounded-full',
                  'text-xs font-semibold tabular-nums transition-colors',
                  // 진한 원은 지금 단계 하나뿐 — 끝난 단계는 옅은 원 + 체크로 가라앉힌다.
                  status === 'completed' && 'bg-primary-container text-primary',
                  status === 'current' && 'bg-primary text-primary-fg',
                  status === 'upcoming' && 'border border-border bg-background text-fg-muted',
                  isClickable
                    ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none'
                    : 'cursor-default',
                )}
              >
                {status === 'completed' ? <CheckIcon /> : index + 1}
              </button>

              {/* Label */}
              <div
                data-slot="steps-label"
                className={cn(
                  'flex min-w-0 flex-col gap-0.5',
                  horizontal ? 'mt-2 items-center px-1 text-center' : 'pt-0.5',
                )}
              >
                <span
                  className={cn(
                    'text-sm',
                    status === 'current' && 'font-semibold text-fg',
                    status === 'completed' && 'font-medium text-fg',
                    status === 'upcoming' && 'font-medium text-fg-muted',
                  )}
                >
                  {step.label}
                </span>
                {step.description != null && (
                  <span className="text-xs text-fg-muted">{step.description}</span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    )
  },
)

Steps.displayName = 'Steps'

export { Steps }
export type { StepsProps, StepStatus }
