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

/** 휴대폰 — 010·011·016·017·018·019 */
const MOBILE_PREFIX = /^01[016789]/
/** 안심번호(평생번호) — 0502~0508 */
const SAFE_NUMBER_PREFIX = /^050[2-8]/
/** 3자리 지역번호(031~033·041~044·051~055·061~064)와 같은 자리 배분을 쓰는 060·070·080 */
const THREE_DIGIT_PREFIX = /^0(?:3[1-3]|4[1-4]|5[1-5]|6[0-4]|70|80)/
/** 전국 대표번호 — 15XX·16XX·18XX (8자리) */
const REPRESENTATIVE_PREFIX = /^1[568]\d{2}/

/** digits 를 자리 수 배열대로 끊어 하이픈으로 잇는다. */
function joinGroups(digits: string, sizes: readonly number[]): string {
  const parts: string[] = []
  let at = 0
  for (const size of sizes) {
    parts.push(digits.slice(at, at + size))
    at += size
  }
  return parts.join('-')
}

/** 완성된 국내 번호 digits → 자리 배분. 모르는 접두·길이는 null. */
function layoutDomesticDigits(d: string): string | null {
  const byLength = (short: number[], long: number[], shortLen: number): string | null => {
    if (d.length === shortLen) return joinGroups(d, short)
    if (d.length === shortLen + 1) return joinGroups(d, long)
    return null
  }
  if (MOBILE_PREFIX.test(d)) return byLength([3, 3, 4], [3, 4, 4], 10)
  if (d.startsWith('02')) return byLength([2, 3, 4], [2, 4, 4], 9)
  if (SAFE_NUMBER_PREFIX.test(d)) return byLength([4, 3, 4], [4, 4, 4], 11)
  if (THREE_DIGIT_PREFIX.test(d)) return byLength([3, 3, 4], [3, 4, 4], 10)
  if (REPRESENTATIVE_PREFIX.test(d) && d.length === 8) return joinGroups(d, [4, 4])
  return null
}

/**
 * 화면 표시용 전화번호 서식 — 저장값(digits 든 원문이든)을 받아 하이픈을 붙인다.
 *
 * - 휴대폰 010-1234-5678 / 011-123-4567, 서울 02-123-4567 / 02-1234-5678,
 *   지역·060·070·080 031-123-4567 / 031-1234-5678, 안심번호 0505-123-4567 / 0505-1234-5678,
 *   대표번호 1588-1234.
 * - 국제 표기 `+82 10-1234-5678`·`+821012345678`·`0082…` 는 국내 표기로 정규화한다.
 * - 공백·점·괄호로만 끊긴 번호(`010 1234 5678`, `010.1234.5678`)도 숫자만 보고 서식.
 * - 이미 하이픈이 있거나(국제 표기 제외), 문자가 섞였거나(마스킹 `010-****-1234` 등), 모르는 형식이면 **원문 그대로**.
 *
 * 표시 전용 — 저장·API·검색·`tel:` 링크 값에는 쓰지 않는다(그쪽은 원문 또는 [stripPhoneDigits]).
 * 입력 중 partial 서식은 [formatKoreanPhoneDisplay] 가 맡는다.
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (value == null) return ''
  const raw = value.trim()
  if (raw === '') return ''
  if (!/^[\d\s\-.()+]+$/.test(raw)) return value
  const international = raw.startsWith('+82') || raw.startsWith('0082')
  if (!international && (raw.includes('-') || raw.startsWith('+'))) return value
  let digits = stripPhoneDigits(raw)
  if (international) {
    digits = digits.slice(digits.startsWith('0082') ? 4 : 2)
    if (!digits.startsWith('0')) digits = `0${digits}`
  }
  return layoutDomesticDigits(digits) ?? value
}
