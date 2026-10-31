'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Input, type InputProps } from '../Input'

import {
  BIRTH_DATE_DIGIT_LENGTH,
  formatBirthDateDisplay,
  stripDateDigits,
} from '@/utils/dateDigits'

type DateInputProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onValueChange' | 'type' | 'inputMode'
> & {
  /** 숫자만 YYYYMMDD (8자리). API 전송 시 [birthDateDigitsToIso] 사용 */
  value?: string
  /** Uncontrolled 초기 숫자값 (YYYYMMDD) */
  defaultValue?: string
  onChange?: (digits: string) => void
  /** 허용 최대 자릿수 (기본 8, 연·월·일) */
  maxDigits?: number
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      maxDigits = BIRTH_DATE_DIGIT_LENGTH,
      placeholder = '1990-01-15',
      autoComplete = 'bday',
      ...props
    },
    ref,
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const currentValue = isControlled ? value : internalValue
    const displayValue = formatBirthDateDisplay(currentValue)

    const handleChange = useCallback(
      (raw: string) => {
        const digits = stripDateDigits(raw).slice(0, maxDigits)
        if (!isControlled) setInternalValue(digits)
        onChange?.(digits)
      },
      [onChange, maxDigits, isControlled],
    )

    return (
      <Input
        ref={ref}
        data-slot="date-input-root"
        type="text"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={displayValue}
        onValueChange={handleChange}
        {...props}
      />
    )
  },
)

DateInput.displayName = 'DateInput'

export { DateInput }
export type { DateInputProps }
