'use client'

import { appointmentsForSlot, slotMinuteForIndex } from './timetable-utils'
import { TimetableAppointmentBlock } from './TimetableAppointmentBlock'
import { TimetableTimeSlotCell } from './TimetableTimeSlotCell'

import type {
  TimetableAppointment,
  TimetableResource,
  TimetableSlotSelection,
} from './timetable-types'

type TimetableResourceColumnProps = {
  resource: TimetableResource
  slotIndexes: number[]
  viewportStart: number
  slotMinutes: number
  appointments: TimetableAppointment[]
  onSlotCellClick?: (resourceId: string, slotMinute: number) => void
  isSlotDisabled?: (ctx: { resourceId: string; slotMinute: number }) => boolean
  selectedSlot?: TimetableSlotSelection | null
  selectedAppointmentId?: string | null
  onAppointmentActivate?: (id: string) => void
  className?: string
}

/** 열 단위 합성 — 커스텀 레이아웃용. 기본 `TimetableGrid`는 CSS Grid 행 렌더링을 사용합니다. */
function TimetableResourceColumn({
  resource,
  slotIndexes,
  viewportStart,
  slotMinutes,
  appointments,
  onSlotCellClick,
  isSlotDisabled,
  selectedSlot,
  selectedAppointmentId,
  onAppointmentActivate,
  className,
}: TimetableResourceColumnProps) {
  return (
    <div data-slot="timetable-resource-column" className={className}>
      <div data-slot="slot-stack" className="flex min-w-0 flex-col">
        {slotIndexes.map((slotIndex) => {
          const slotStart = slotMinuteForIndex(viewportStart, slotIndex, slotMinutes)
          const slotEnd = slotStart + slotMinutes
          const disabled =
            isSlotDisabled?.({ resourceId: resource.id, slotMinute: slotStart }) ?? false
          const selected =
            !disabled &&
            selectedSlot != null &&
            selectedSlot.resourceId === resource.id &&
            selectedSlot.slotMinute === slotStart
          const appts = appointmentsForSlot(appointments, resource.id, slotStart, slotEnd)
          const appt = appts[0]

          if (appt) {
            return (
              <TimetableAppointmentBlock
                key={`${resource.id}-${slotIndex}`}
                label={appt.label}
                selected={selectedAppointmentId === appt.id}
                onActivate={() => onAppointmentActivate?.(appt.id)}
                className="min-h-[var(--ds-density-timetable-slot-h,2.5rem)]"
              />
            )
          }

          return (
            <TimetableTimeSlotCell
              key={`${resource.id}-${slotIndex}`}
              resourceId={resource.id}
              slotMinute={slotStart}
              disabled={disabled}
              selected={selected}
              className="min-h-[var(--ds-density-timetable-slot-h,2.5rem)]"
              onCellClick={
                disabled
                  ? undefined
                  : onSlotCellClick
                    ? () => onSlotCellClick(resource.id, slotStart)
                    : undefined
              }
            />
          )
        })}
      </div>
    </div>
  )
}

export { TimetableResourceColumn }
export type { TimetableResourceColumnProps }
