'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useCallback, useEffect, useRef } from 'react'

import { cn } from '@/utils/cn'
import { useFieldControl } from '@/utils/useFieldControl'

const textareaVariants = cva(
  [
    'w-full border bg-background text-fg transition-colors outline-none',
    'placeholder:text-fg-muted',
    'focus-visible:ring-2 focus-visible:ring-offset-1',
    'disabled:cursor-not-allowed disabled:border-disabled-border disabled:bg-disabled-subtle disabled:text-disabled-text',
    'read-only:bg-surface read-only:focus-visible:ring-0 read-only:focus-visible:ring-offset-0',
  ],
  {
    variants: {
      variant: {
        default: 'border-border focus-visible:ring-ring',
        error: 'border-error-border focus-visible:ring-error-primary',
        success: 'border-success-border focus-visible:ring-success-primary',
      },
      size: {
        sm: 'min-h-20 rounded-md px-3 py-2 text-xs',
        md: 'min-h-24 rounded-md px-3 py-2.5 text-sm',
        lg: 'min-h-28 rounded-lg px-4 py-3 text-md',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      resize: 'vertical',
    },
  },
)

type TextareaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  'size' | 'onChange' | 'defaultValue' | 'onBlur'
> &
  VariantProps<typeof textareaVariants> & {
    autoResize?: boolean
    defaultValue?: string
    onValueChange?: (value: string) => void
    onBlurValue?: (value: string) => void
    validate?: (value: string) => string | undefined
    onValidityChange?: (message: string | undefined) => void
    /** Escape 키 입력 시 호출됩니다. */
    onEscapeKey?: () => void
  }

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
      autoResize = false,
      id,
      onValueChange,
      onBlurValue,
      validate,
      onValidityChange,
      onEscapeKey,
      value,
      onKeyDown: onKeyDownProp,
      ...props
    },
    forwardedRef,
  ) => {
    const fieldControl = useFieldControl({ id, variant: variant ?? undefined })
    const validationError = validate && value != null ? validate(String(value)) : undefined
    const resolvedVariant =
      fieldControl.variant ?? (validationError ? 'error' : variant) ?? undefined
    const innerRef = useRef<HTMLTextAreaElement>(null)

    const mergedRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef)
          (forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
      },
      [forwardedRef],
    )

    const adjustHeight = useCallback(() => {
      const el = innerRef.current
      if (!el || !autoResize) return
      el.style.height = 'auto'
      const scrollHeight = el.scrollHeight
      const maxHeight = Number.parseFloat(getComputedStyle(el).maxHeight)
      const hasMaxHeight = Number.isFinite(maxHeight) && maxHeight > 0

      if (hasMaxHeight && scrollHeight > maxHeight) {
        el.style.height = `${maxHeight}px`
        el.style.overflowY = 'auto'
      } else {
        el.style.height = `${scrollHeight}px`
        el.style.overflowY = 'hidden'
      }
    }, [autoResize])

    useEffect(() => {
      adjustHeight()
    }, [adjustHeight, value, props.defaultValue])

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        adjustHeight()
        onValueChange?.(e.target.value)
      },
      [adjustHeight, onValueChange],
    )

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLTextAreaElement>) => {
        const v = e.target.value
        onBlurValue?.(v)
        if (validate) {
          onValidityChange?.(validate(v))
        }
      },
      [onBlurValue, validate, onValidityChange],
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') onEscapeKey?.()
        onKeyDownProp?.(e)
      },
      [onEscapeKey, onKeyDownProp],
    )

    return (
      <textarea
        ref={mergedRef}
        id={fieldControl.id}
        aria-describedby={fieldControl['aria-describedby']}
        aria-invalid={fieldControl['aria-invalid']}
        value={value}
        className={cn(
          textareaVariants({
            variant: resolvedVariant,
            size,
            resize: autoResize ? 'none' : resize,
          }),
          className,
        )}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea, textareaVariants }
export type { TextareaProps }
