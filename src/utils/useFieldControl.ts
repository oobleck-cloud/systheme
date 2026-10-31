'use client'

import { useFormField } from '@/components/FormField/FormField'

type FieldControlSurface = {
  id?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
  variant?: 'default' | 'error' | 'success'
}

/**
 * FormField context가 있으면 id / aria / error variant를 자동 적용한다.
 * FormField 밖에서는 전달된 props를 그대로 반환한다.
 */
function useFieldControl(
  props: FieldControlSurface & { id?: string; variant?: 'default' | 'error' | 'success' },
): FieldControlSurface {
  const field = useFormField()

  if (!field) {
    return {
      id: props.id,
      'aria-describedby': props['aria-describedby'],
      'aria-invalid': props['aria-invalid'],
      variant: props.variant,
    }
  }

  const describedBy = field.errorId ?? field.helperId
  const invalid = field.hasError || props['aria-invalid'] === true

  return {
    id: props.id ?? field.fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': invalid || undefined,
    variant: field.hasError ? 'error' : props.variant,
  }
}

export { useFieldControl }
export type { FieldControlSurface }
