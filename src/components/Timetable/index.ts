// ─── L3 — 시간표 셸·키보드 연타·기본 합성 ─────────────────────────────────────
export { Timetable } from './Timetable'
export type { TimetableProps } from './Timetable'

// ─── L2 — 영역·그리드·컨트롤러 ───────────────────────────────────────────────
/**
 * 시간표 L2 서브패스 — 직접 사용 시 `Timetable`(L3)와 호환성 유지 책임이 소비자에게 있습니다.
 * 대부분의 경우 `<Timetable>` 컴포넌트를 사용하세요.
 *
 * @example
 * import { TimetableParts } from '@oobleck/systheme'
 * <TimetableParts.Shell controllerRegion={...} gridRegion={...} />
 */
export { TimetableShell } from './TimetableShell'
export type { TimetableShellProps } from './TimetableShell'

export { TimetableController } from './TimetableController'
export type { TimetableControllerProps } from './TimetableController'

export { TimetableDateNav } from './TimetableDateNav'
export type { TimetableDateNavProps } from './TimetableDateNav'

export { TimetableViewToolbar } from './TimetableViewToolbar'
export type { TimetableViewToolbarProps } from './TimetableViewToolbar'

export { TimetableGrid } from './TimetableGrid'
export type { TimetableGridProps } from './TimetableGrid'

export { TimetableResourceColumn } from './TimetableResourceColumn'
export type { TimetableResourceColumnProps } from './TimetableResourceColumn'

export { TimetableTimeSlotCell } from './TimetableTimeSlotCell'
export type { TimetableTimeSlotCellProps } from './TimetableTimeSlotCell'

// ─── TimetableParts — L2 compound 네임스페이스 ────────────────────────────────
import { TimetableController } from './TimetableController'
import { TimetableDateNav } from './TimetableDateNav'
import { TimetableGrid } from './TimetableGrid'
import { TimetableResourceColumn } from './TimetableResourceColumn'
import { TimetableShell } from './TimetableShell'
import { TimetableTimeSlotCell } from './TimetableTimeSlotCell'
import { TimetableViewToolbar } from './TimetableViewToolbar'

/**
 * 시간표 L2 서브컴포넌트를 한 네임스페이스로 묶은 compound.
 * 커스텀 시간표 레이아웃 조합 시 사용하세요.
 *
 * @example
 * import { TimetableParts } from '@oobleck/systheme'
 * <TimetableParts.Shell ... />
 * <TimetableParts.Controller ... />
 */
const TimetableParts = {
  Shell: TimetableShell,
  Controller: TimetableController,
  DateNav: TimetableDateNav,
  ViewToolbar: TimetableViewToolbar,
  Grid: TimetableGrid,
  ResourceColumn: TimetableResourceColumn,
  TimeSlotCell: TimetableTimeSlotCell,
}

export { TimetableParts }

// ─── L1 ─────────────────────────────────────────────────────────────────────
export { TimetableAppointmentBlock } from './TimetableAppointmentBlock'
export type { TimetableAppointmentBlockProps } from './TimetableAppointmentBlock'

export { TimetableAppointmentPreview } from './TimetableAppointmentPreview'
export type { TimetableAppointmentPreviewProps } from './TimetableAppointmentPreview'

export type {
  TimetableAppointment,
  TimetableAppointmentColor,
  TimetableAppointmentLock,
  TimetableDateMeta,
  TimetableDensity,
  TimetableLabels,
  TimetableResource,
  TimetableSlotAppearance,
  TimetableSlotCellPayload,
  TimetableSlotSelection,
  TimetableSlotTag,
  TimetableSlotTone,
} from './timetable-types'

export {
  addCalendarDays,
  appointmentsForSlot,
  buildSlotIndexes,
  dateKey,
  formatTimeLabel,
  formatTimetableDate,
  formatMinuteRange,
  formatAppointmentPreviewLine,
  parseDateKey,
  shouldShowAppointmentsForCursor,
  slotCellStorageKey,
  slotMinuteForIndex,
  stepCursorDate,
} from './timetable-utils'
