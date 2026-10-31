/** 생년월일 등 연·월·일 8자리(YYYYMMDD) 입력용 */

export const BIRTH_DATE_DIGIT_LENGTH = 8

export function stripDateDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * 생년월일 표시용 하이픈 삽입 (입력 중 partial 허용).
 * 저장·API 전송은 항상 [stripDateDigits] 결과만 사용합니다.
 */
export function formatBirthDateDisplay(digits: string): string {
  const numbers = stripDateDigits(digits)
  if (numbers.length === 0) return ''
  if (numbers.length <= 4) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`
  return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`
}

/** 8자리 완성 시 `yyyy-MM-dd` (서버 [LocalDate.parse] 호환). 미완성·비정상이면 null */
export function birthDateDigitsToIso(digits: string): string | null {
  const numbers = stripDateDigits(digits)
  if (numbers.length !== BIRTH_DATE_DIGIT_LENGTH) return null

  const year = Number(numbers.slice(0, 4))
  const month = Number(numbers.slice(4, 6))
  const day = Number(numbers.slice(6, 8))
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return `${numbers.slice(0, 4)}-${numbers.slice(4, 6)}-${numbers.slice(6, 8)}`
}

export function isValidBirthDateDigits(digits: string): boolean {
  return birthDateDigitsToIso(digits) !== null
}
