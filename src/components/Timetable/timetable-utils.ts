import type { TimetableDateMeta } from './timetable-types'

export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addCalendarDays(d: Date, delta: number): Date {
  const n = new Date(d)
  n.setDate(n.getDate() + delta)
  return n
}

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

export function formatTimetableDate(d: Date): string {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const dow = DAYS_KO[d.getDay()] ?? ''
  return `${y}년 ${m}월 ${day}일 (${dow})`
}

export function formatTimeLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatMinuteRange(startMinute: number, endMinute: number): string {
  return `${formatTimeLabel(startMinute)} – ${formatTimeLabel(endMinute)}`
}

/** 호버 프리뷰용 한 줄 요약 */
export function formatAppointmentPreviewLine(
  label: string,
  resourceLabel: string,
  startMinute: number,
  endMinute: number,
): string {
  return `${label} · ${resourceLabel} · ${formatMinuteRange(startMinute, endMinute)}`
}

export function slotMinuteForIndex(
  viewportStart: number,
  slotIndex: number,
  slotMinutes: number,
): number {
  return viewportStart + slotIndex * slotMinutes
}

export function buildSlotIndexes(visibleSlotCount: number): number[] {
  return Array.from({ length: visibleSlotCount }, (_, i) => i)
}

/**
 * `dates` 메타가 있을 때: 비활성 포함이 꺼져 있으면 `active: false` 인 날에는 일정을 표시하지 않음(기본은 활성 일만).
 */
export function shouldShowAppointmentsForCursor(
  cursor: Date,
  dates: TimetableDateMeta[] | undefined,
  includeDeactiveDates: boolean,
): boolean {
  if (!dates?.length) return true
  const key = dateKey(cursor)
  const meta = dates.find((d) => d.id === key)
  if (!meta) return true
  if (includeDeactiveDates) return true
  return meta.active
}

/**
 * 커서를 달력 하루만큼 옮긴다.
 *
 * 예전에는 `dates`(=데이터가 있는 날, 필터가 켜져 있으면 활성 날만) 안에서만 움직여서
 * 이전 버튼이 며칠씩 건너뛰었다 — "어제" 를 볼 방법이 없었다. 이동 단위는 언제나 하루이고,
 * 그 날에 무엇이 보이는지는 필터가 정한다.
 */
export function stepCursorDate(cursor: Date, direction: -1 | 1): Date {
  return addCalendarDays(cursor, direction)
}

/** `dates` 메타 기준으로 그 날이 활성인지. 메타가 없으면(=모르는 날) 활성으로 본다. */
export function isDateActive(cursor: Date, dates: TimetableDateMeta[] | undefined): boolean {
  return shouldShowAppointmentsForCursor(cursor, dates, false)
}

/**
 * `cursor` 에서 가장 가까운 활성 날짜의 키를 반환한다.
 * 거리가 같으면 미래 날짜를 우선한다.
 */
export function nearestActiveDateKey(cursor: Date, dates: TimetableDateMeta[]): string | null {
  const active = dates.filter((d) => d.active)
  if (!active.length) return null

  const curKey = dateKey(cursor)
  if (active.some((d) => d.id === curKey)) return curKey

  const sorted = [...active].sort((a, b) => a.id.localeCompare(b.id))
  let lo = 0
  let hi = sorted.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (sorted[mid]!.id < curKey) lo = mid + 1
    else hi = mid - 1
  }
  const before = lo > 0 ? sorted[lo - 1] : null
  const after = lo < sorted.length ? sorted[lo] : null

  if (!before) return after!.id
  if (!after) return before.id

  const dBefore = cursor.getTime() - parseDateKey(before.id).getTime()
  const dAfter = parseDateKey(after.id).getTime() - cursor.getTime()
  return dAfter <= dBefore ? after.id : before.id
}

export function slotCellStorageKey(resourceId: string, dayKey: string, slotMinute: number): string {
  return `${resourceId}:${dayKey}:${slotMinute}`
}

export function appointmentsForSlot(
  appointments: {
    id: string
    resourceId: string
    startMinute: number
    endMinute: number
    label: string
    color?: string
  }[],
  resourceId: string,
  slotStart: number,
  slotEnd: number,
): typeof appointments {
  return appointments.filter(
    (a) => a.resourceId === resourceId && a.startMinute < slotEnd && a.endMinute > slotStart,
  )
}
