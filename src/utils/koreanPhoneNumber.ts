/** 비숫자 제거 — 서버 [KoreanPhoneNumber.normalize] 와 동일한 전제의 digits */
export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * 한국 전화번호 표시용 하이픈 삽입 (입력 중 partial 허용).
 * 저장·API 전송은 항상 [stripPhoneDigits] 결과만 사용합니다.
 */
export function formatKoreanPhoneDisplay(digits: string): string {
  const numbers = stripPhoneDigits(digits)
  if (numbers.length === 0) return ''

  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}-${numbers.slice(2)}`
    if (numbers.length <= 9) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 5)}-${numbers.slice(5)}`
    }
    return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`
  }

  if (numbers.startsWith('01')) {
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    if (numbers.length <= 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
    }
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  if (numbers.length <= 3) return numbers
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
  }
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}
