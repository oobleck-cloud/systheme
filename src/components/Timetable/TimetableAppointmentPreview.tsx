'use client'

import { formatMinuteRange } from './timetable-utils'

import type { TimetableAppointment } from './timetable-types'

type TimetableAppointmentPreviewProps = {
  appointment: TimetableAppointment
  resourceLabel: string
}

/** anatomy `hover-preview-surface` — 일정 호버 요약 */
function TimetableAppointmentPreview({
  appointment,
  resourceLabel,
}: TimetableAppointmentPreviewProps) {
  const durationMin = appointment.endMinute - appointment.startMinute

  return (
    <div data-slot="hover-preview-surface" className="flex min-w-[10rem] flex-col gap-1.5 p-0.5">
      <div className="flex flex-col gap-0.5">
        <span className="text-[0.8125rem] leading-tight font-semibold text-fg">
          {appointment.label}
        </span>
        <span className="text-xs text-fg-muted">{resourceLabel}</span>
      </div>
      <span className="text-xs text-fg-subtle tabular-nums">
        {formatMinuteRange(appointment.startMinute, appointment.endMinute)}
        {durationMin > 0 ? ` · ${durationMin}분` : null}
      </span>
      {appointment.detail ? (
        <span className="border-t border-border-subtle pt-1.5 text-xs leading-snug text-fg">
          {appointment.detail}
        </span>
      ) : null}
    </div>
  )
}

export { TimetableAppointmentPreview }
export type { TimetableAppointmentPreviewProps }
