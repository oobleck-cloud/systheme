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
   */
  appearance?: 'default' | 'text'
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
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

    return (
      // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown delegated to inner step indicator buttons
      <ol
        ref={ref}
        data-slot="steps-root"
        data-orientation={orientation}
        className={cn(
          'flex',
          orientation === 'horizontal' ? 'flex-row items-start' : 'flex-col',
          className,
        )}
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
                'flex',
                orientation === 'horizontal'
                  ? 'flex-1 flex-col items-center'
                  : 'flex-row items-start gap-3',
              )}
            >
              <div
                className={cn(
                  'flex',
                  orientation === 'horizontal'
                    ? 'w-full flex-col items-center'
                    : 'flex-row items-start gap-3',
                )}
              >
                {/* Indicator + Connector row */}
                <div
                  className={cn(
                    'flex items-center',
                    orientation === 'horizontal' ? 'w-full' : 'flex-col',
                  )}
                >
                  {/* Step indicator button */}
                  <button
                    type="button"
                    aria-current={status === 'current' ? 'step' : undefined}
                    aria-label={`${typeof step.label === 'string' ? step.label : `단계 ${index + 1}`}${status === 'completed' ? ' (완료)' : status === 'current' ? ' (현재)' : ''}`}
                    onClick={isClickable ? () => onStepChange?.(index) : undefined}
                    disabled={!isClickable}
                    data-slot="steps-indicator"
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                      'text-sm font-semibold transition-colors',
                      status === 'completed' && 'border-primary bg-primary text-primary-fg',
                      status === 'current' && 'border-primary bg-background text-primary',
                      status === 'upcoming' && 'border-border bg-background text-fg-muted',
                      isClickable
                        ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none'
                        : 'cursor-default',
                    )}
                  >
                    {status === 'completed' ? <CheckIcon /> : index + 1}
                  </button>

                  {/* Connector line */}
                  {!isLast && (
                    <div
                      aria-hidden
                      data-slot="steps-connector"
                      className={cn(
                        'overflow-hidden bg-border',
                        orientation === 'horizontal'
                          ? 'mx-2 h-px flex-1'
                          : 'mt-1 mb-1 ml-[0.9375rem] h-6 w-px',
                      )}
                    >
                      <motion.div
                        className="h-full w-full bg-primary"
                        initial={false}
                        animate={
                          orientation === 'horizontal'
                            ? { scaleX: index < currentStep ? 1 : 0 }
                            : { scaleY: index < currentStep ? 1 : 0 }
                        }
                        style={orientation === 'horizontal' ? { originX: 0 } : { originY: 0 }}
                        transition={spring.standard}
                      />
                    </div>
                  )}
                </div>

                {/* Label */}
                <div
                  data-slot="steps-label"
                  className={cn(
                    'flex flex-col',
                    orientation === 'horizontal' && 'mt-2 items-center text-center',
                  )}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      status === 'current' && 'text-fg',
                      status === 'completed' && 'text-fg-subtle',
                      status === 'upcoming' && 'text-fg-muted',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description != null && (
                    <span className="text-xs text-fg-muted">{step.description}</span>
                  )}
                </div>
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
