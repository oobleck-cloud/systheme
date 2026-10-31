'use client'

import { type VariantProps } from 'class-variance-authority'
import { forwardRef, useCallback } from 'react'

import { cn } from '@/utils/cn'
import { inputVariants } from '@/utils/fieldControlSurface'
import { useFieldControl } from '@/utils/useFieldControl'

type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'prefix' | 'suffix' | 'onChange' | 'defaultValue' | 'onBlur'
> &
  VariantProps<typeof inputVariants> & {
    prefix?: React.ReactNode
    suffix?: React.ReactNode
    defaultValue?: string
    onValueChange?: (value: string) => void
    onBlurValue?: (value: string) => void
    validate?: (value: string) => string | undefined
    onValidityChange?: (message: string | undefined) => void
    /** Enter 키 입력 시 호출됩니다. */
    onEnterKey?: () => void
    /** Escape 키 입력 시 호출됩니다. */
    onEscapeKey?: () => void
  }

/** `px-density-*` 와 동일한 CSS 변수 — affix inset / padding 계산에 사용 */
function densityPaddingVarName(size: 'sm' | 'md' | 'lg' | null | undefined): string {
  if (size === 'sm') return '--ds-density-control-px-sm'
  if (size === 'lg') return '--ds-density-control-px-lg'
  return '--ds-density-control-px-md'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      chrome,
      size,
      prefix,
      suffix,
      style,
      id,
      onValueChange,
      onBlurValue,
      validate,
      onValidityChange,
      onEnterKey,
      onEscapeKey,
      value,
      onKeyDown: onKeyDownProp,
      ...props
    },
    ref,
  ) => {
    // `onBlur` is handled by onBlurValue/inputProps — not accepted as a top-level prop
    const fieldControl = useFieldControl({ id, variant: variant ?? undefined })
    const validationError = validate && value != null ? validate(String(value)) : undefined
    const resolvedVariant =
      fieldControl.variant ?? (validationError ? 'error' : variant) ?? undefined
    const padVar = densityPaddingVarName(size ?? 'md')

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange?.(e.target.value)
      },
      [onValueChange],
    )

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        const v = e.target.value
        onBlurValue?.(v)
        if (validate) {
          onValidityChange?.(validate(v))
        }
      },
      [onBlurValue, validate, onValidityChange],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') onEnterKey?.()
        if (e.key === 'Escape') onEscapeKey?.()
        onKeyDownProp?.(e)
      },
      [onEnterKey, onEscapeKey, onKeyDownProp],
    )

    return (
      <div
        className="relative flex w-full items-center"
        style={{ '--ds-input-density-px': `var(${padVar})` }}
      >
        {prefix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-fg-muted left-[var(--ds-input-density-px)]"
          >
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={fieldControl.id}
          aria-describedby={fieldControl['aria-describedby']}
          aria-invalid={fieldControl['aria-invalid']}
          // 제어 컴포넌트: value 를 DOM 에 바인딩한다(Textarea 와 동일). 없으면 프리필·프로그램 갱신이 안 된다.
          {...(value !== undefined && { value })}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            inputVariants({ variant: resolvedVariant, chrome, size }),
            prefix && 'ps-[calc(var(--ds-input-density-px)_+_1.25rem)]',
            suffix && 'pe-[calc(var(--ds-input-density-px)_+_1.25rem)]',
            className,
          )}
          // eslint-disable-next-line design-system/no-inline-style
          style={style}
          {...props}
        />{' '}
        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center text-fg-muted right-[var(--ds-input-density-px)]"
          >
            {suffix}
          </span>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input, inputVariants }
export type { InputProps }
