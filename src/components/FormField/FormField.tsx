'use client'

import { createContext, forwardRef, useContext, useId } from 'react'

import { cn } from '@/utils/cn'

type FormFieldContextValue = {
  fieldId: string
  errorId?: string
  helperId?: string
  hasError: boolean
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null)

/**
 * FormField 내부 control에서 접근성 ID를 가져오는 훅.
 * @internal DS 내부 전용 — 앱에서 직접 사용하지 마세요.
 */
function useFormField() {
  return useContext(FormFieldContext)
}

type FormFieldProps = React.HTMLAttributes<HTMLDivElement> & {
  label?: React.ReactNode
  required?: boolean
  helper?: React.ReactNode
  error?: React.ReactNode
  htmlFor?: string
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, label, required = false, helper, error, htmlFor, children, ...props }, ref) => {
    const autoId = useId()
    const fieldId = htmlFor ?? autoId
    const helperId = helper ? `${fieldId}-helper` : undefined
    const errorId = error ? `${fieldId}-error` : undefined
    const hasError = error != null

    return (
      <FormFieldContext.Provider value={{ fieldId, errorId, helperId, hasError }}>
        <div
          ref={ref}
          data-slot="form-field"
          data-error={hasError || undefined}
          className={cn('flex flex-col gap-1.5', className)}
          {...props}
        >
          {label != null && (
            <label
              htmlFor={fieldId}
              data-slot="form-field-label"
              className="text-sm font-medium text-fg"
            >
              {label}
              {required && (
                <span aria-hidden className="ml-0.5 text-error-primary">
                  *
                </span>
              )}
            </label>
          )}

          <div
            data-slot="form-field-control"
            aria-describedby={errorId ?? helperId}
            aria-invalid={hasError || undefined}
          >
            {children}
          </div>

          {hasError && (
            <p
              id={errorId}
              role="alert"
              data-slot="form-field-error"
              className="flex items-center gap-1 text-xs text-error-text"
            >
              {error}
            </p>
          )}
          {!hasError && helper != null && (
            <p id={helperId} data-slot="form-field-helper" className="text-xs text-fg-muted">
              {helper}
            </p>
          )}
        </div>
      </FormFieldContext.Provider>
    )
  },
)

FormField.displayName = 'FormField'

export { FormField, useFormField }
export type { FormFieldProps }
