'use client'

import { forwardRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type ImportWizardFrameProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  currentStep?: number
  defaultCurrentStep?: number
  totalSteps?: number
  fileLabel?: string
  defaultFileLabel?: string
  errorMessage?: string
  onStepBack?: () => void
  onStepNext?: () => void
  onCancel?: () => void
  onComplete?: () => void
  onPickFile?: () => void
  children?: React.ReactNode
}

const ImportWizardFrame = forwardRef<HTMLDivElement, ImportWizardFrameProps>(
  (
    {
      className,
      currentStep: currentStepProp,
      defaultCurrentStep = 1,
      totalSteps = 3,
      fileLabel: fileLabelProp,
      defaultFileLabel = '',
      errorMessage,
      onStepBack,
      onStepNext,
      onCancel,
      onComplete,
      onPickFile,
      children,
      ...props
    },
    ref,
  ) => {
    const [internalCurrentStep, setInternalCurrentStep] = useState(defaultCurrentStep)
    const [internalFileLabel, setInternalFileLabel] = useState(defaultFileLabel)

    const isStepControlled = currentStepProp !== undefined
    const isFileLabelControlled = fileLabelProp !== undefined

    const currentStep = isStepControlled ? currentStepProp! : internalCurrentStep
    const fileLabel = isFileLabelControlled ? fileLabelProp! : internalFileLabel

    function handleStepBack() {
      if (!isStepControlled) setInternalCurrentStep((s) => Math.max(1, s - 1))
      onStepBack?.()
    }

    function handleStepNext() {
      if (!isStepControlled) setInternalCurrentStep((s) => Math.min(totalSteps, s + 1))
      onStepNext?.()
    }

    function handlePickFile() {
      if (!isFileLabelControlled) setInternalFileLabel('파일 선택됨')
      onPickFile?.()
    }

    return (
      <div
        ref={ref}
        data-slot="import-wizard-frame-root"
        className={cn('flex w-full flex-col gap-3', className)}
        {...props}
      >
        <div data-slot="import-wizard-frame-step-nav" className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-slot="import-wizard-frame-back"
            disabled={currentStep <= 1}
            onClick={handleStepBack}
          >
            이전
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-slot="import-wizard-frame-next"
            disabled={currentStep >= totalSteps}
            onClick={handleStepNext}
          >
            다음 ({currentStep}단계)
          </Button>
        </div>
        <div
          data-slot="import-wizard-frame-step-body"
          className="min-h-16 rounded-md border border-dashed border-border p-2"
        >
          {children}
        </div>
        <p data-slot="import-wizard-frame-file-summary" className="text-sm text-fg-muted">
          {fileLabel || '\u00A0'}
        </p>
        <Stack direction="horizontal" align="center" gap={2} wrap>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-slot="import-wizard-frame-pick-file"
            onClick={handlePickFile}
          >
            파일 선택
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="import-wizard-frame-cancel"
            disabled={!onCancel}
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-slot="import-wizard-frame-complete"
            disabled={!onComplete}
            onClick={onComplete}
          >
            완료
          </Button>
        </Stack>
        <p
          data-slot="import-wizard-frame-error"
          className={cn('min-h-4 text-sm', errorMessage ? 'text-error-text' : 'text-fg-muted')}
        >
          {errorMessage || '\u00A0'}
        </p>
      </div>
    )
  },
)

ImportWizardFrame.displayName = 'ImportWizardFrame'

export { ImportWizardFrame }
