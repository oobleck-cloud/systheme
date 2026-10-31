'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Input, type InputProps } from '../Input'

import { formatKoreanPhoneDisplay, stripPhoneDigits } from '@/utils/koreanPhoneNumber'

type PhoneNumberInputProps = Omit<
  InputProps,
  'value' | 'defaultValue' | 'onValueChange' | 'type' | 'inputMode'
> & {
  /** 숫자만 (하이픈 없음). 서버 전송·상태 저장용 */
  value?: string
  /** Uncontrolled 초기 숫자값 (하이픈 없음) */
  defaultValue?: string
  onChange?: (digits: string) => void
  /** 허용 최대 자릿수 (기본 11, 휴대폰) */
  maxDigits?: number
}

const PhoneNumberInput = forwardRef<HTMLInputElement, PhoneNumberInputProps>(
  (
    { value, defaultValue, onChange, maxDigits = 11, placeholder = '010-0000-0000', ...props },
    ref,
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = useState(defaultValue ?? '')
    const currentValue = isControlled ? value : internalValue
    const displayValue = formatKoreanPhoneDisplay(currentValue)

    const handleChange = useCallback(
      (raw: string) => {
        const digits = stripPhoneDigits(raw).slice(0, maxDigits)
        if (!isControlled) setInternalValue(digits)
        onChange?.(digits)
      },
      [onChange, maxDigits, isControlled],
    )

    return (
      <Input
        ref={ref}
        data-slot="phone-number-input-root"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        value={displayValue}
        onValueChange={handleChange}
        {...props}
      />
    )
  },
)

PhoneNumberInput.displayName = 'PhoneNumberInput'

export { PhoneNumberInput }
export type { PhoneNumberInputProps }
