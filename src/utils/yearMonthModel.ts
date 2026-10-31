import { buildYearRange, pad2 } from './birthDateModel'

export type YearMonthParts = {
  year: number
  month: number
}

export function dateToYearMonthParts(date: Date): YearMonthParts {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

export function yearMonthPartsToDate(parts: YearMonthParts): Date {
  return new Date(parts.year, parts.month - 1, 1)
}

export function formatYearMonthLabel(parts: YearMonthParts): string {
  return `${parts.year}년 ${parts.month}월`
}

export function clampYearMonth(
  parts: YearMonthParts,
  minYear: number,
  maxYear: number,
): YearMonthParts {
  const year = Math.min(maxYear, Math.max(minYear, parts.year))
  const month = Math.min(12, Math.max(1, parts.month))
  return { year, month }
}

export function shiftYearMonth(parts: YearMonthParts, deltaMonths: number): YearMonthParts {
  const date = yearMonthPartsToDate(parts)
  return dateToYearMonthParts(new Date(date.getFullYear(), date.getMonth() + deltaMonths, 1))
}

export function resolveYearMonthParts(
  value: Date | undefined,
  minYear: number,
  maxYear: number,
): YearMonthParts {
  const base = value ? dateToYearMonthParts(value) : dateToYearMonthParts(new Date())
  return clampYearMonth(base, minYear, maxYear)
}

export { buildYearRange, pad2 }
