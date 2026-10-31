import { BIRTH_DATE_DIGIT_LENGTH, stripDateDigits } from './dateDigits'

export type BirthDateParts = {
  year: number
  month: number
  day: number
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function toBirthDateDigits(parts: BirthDateParts): string {
  return `${parts.year}${pad2(parts.month)}${pad2(parts.day)}`
}

export function parseBirthDateDigits(digits: string): BirthDateParts | null {
  const numbers = stripDateDigits(digits)
  if (numbers.length !== BIRTH_DATE_DIGIT_LENGTH) return null
  const year = Number(numbers.slice(0, 4))
  const month = Number(numbers.slice(4, 6))
  const day = Number(numbers.slice(6, 8))
  if (!isValidBirthParts({ year, month, day })) return null
  return { year, month, day }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export function isValidBirthParts(parts: BirthDateParts): boolean {
  if (parts.month < 1 || parts.month > 12) return false
  const maxDay = daysInMonth(parts.year, parts.month)
  if (parts.day < 1 || parts.day > maxDay) return false
  return true
}

export function clampBirthParts(parts: BirthDateParts): BirthDateParts {
  const month = Math.min(12, Math.max(1, parts.month))
  const maxDay = daysInMonth(parts.year, month)
  const day = Math.min(maxDay, Math.max(1, parts.day))
  return { year: parts.year, month, day }
}

export function buildYearRange(minYear: number, maxYear: number): number[] {
  const from = Math.min(minYear, maxYear)
  const to = Math.max(minYear, maxYear)
  return Array.from({ length: to - from + 1 }, (_, i) => to - i)
}

export function defaultBirthDateParts(maxYear: number): BirthDateParts {
  return { year: Math.min(1990, maxYear), month: 1, day: 1 }
}

export function resolveBirthDateParts(
  digits: string | undefined,
  minYear: number,
  maxYear: number,
): BirthDateParts {
  const parsed = digits ? parseBirthDateDigits(digits) : null
  if (parsed) return clampBirthParts(parsed)
  return defaultBirthDateParts(maxYear)
}
