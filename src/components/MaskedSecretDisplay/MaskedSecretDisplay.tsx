'use client'

import { forwardRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type MaskedSecretDisplayProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  maskedText: string
  plainText?: string
  revealed?: boolean
  defaultRevealed?: boolean
  onRevealChange?: (revealed: boolean) => void
  onCopyRequest?: () => void
  valueLabel?: string
  copyLabel?: string
}

const MaskedSecretDisplay = forwardRef<HTMLDivElement, MaskedSecretDisplayProps>(
  (
    {
      className,
      maskedText,
      plainText,
      revealed: revealedProp,
      defaultRevealed = false,
      onRevealChange,
      onCopyRequest,
      valueLabel = '비밀 값',
      copyLabel = '복사',
      ...props
    },
    ref,
  ) => {
    const [internalRevealed, setInternalRevealed] = useState(defaultRevealed)
    const isControlled = revealedProp !== undefined
    const revealed = isControlled ? revealedProp! : internalRevealed

    const handleRevealChange = (next: boolean) => {
      if (!isControlled) setInternalRevealed(next)
      onRevealChange?.(next)
    }
    const displayText =
      revealed && plainText !== undefined && plainText !== '' ? plainText : maskedText

    return (
      <div
        ref={ref}
        data-slot="masked-secret-display-root"
        className={cn('flex min-w-0 items-center gap-2 py-1', className)}
        {...props}
      >
        <span
          data-slot="masked-secret-display-value"
          className="min-w-0 flex-1 truncate font-mono text-sm text-fg"
        >
          {displayText}
        </span>
        <Stack direction="horizontal" align="center" gap={1}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-slot="masked-secret-display-reveal"
            aria-pressed={revealed}
            aria-label={valueLabel}
            disabled={!onRevealChange}
            onClick={() => handleRevealChange(!revealed)}
          >
            {revealed ? '숨기기' : '보기'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-slot="masked-secret-display-copy"
            disabled={!onCopyRequest}
            onClick={onCopyRequest}
          >
            {copyLabel}
          </Button>
        </Stack>
      </div>
    )
  },
)

MaskedSecretDisplay.displayName = 'MaskedSecretDisplay'

export { MaskedSecretDisplay }
