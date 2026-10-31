/** Compare calendar dates by year/month/day (local timezone). */
export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Flat month grid padded with null for leading/trailing cells. */
export function getCalendarDays(
  year: number,
  month: number,
  weekStartsOn: 0 | 1 = 0,
): (Date | null)[] {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days: (Date | null)[] = []
  const leadPad = (first.getDay() - weekStartsOn + 7) % 7
  for (let i = 0; i < leadPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  while (days.length % 7 !== 0) days.push(null)
  return days
}

/** Group a flat day list into rows of seven. */
export function groupCalendarDaysIntoWeeks(days: (Date | null)[]): (Date | null)[][] {
  return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7))
}
