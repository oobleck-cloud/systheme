'use client'

import { useMemo, useState } from 'react'

import { buildSlotIndexes, formatTimeLabel, slotMinuteForIndex } from './timetable-utils'
import { TimetableAppointmentBlock } from './TimetableAppointmentBlock'
import { TimetableAppointmentPreview } from './TimetableAppointmentPreview'
import { TimetableTimeSlotCell } from './TimetableTimeSlotCell'

import type {
  TimetableAppointment,
  TimetableResource,
  TimetableSlotSelection,
  TimetableSlotTone,
} from './timetable-types'

import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

const SLOT_H = 'var(--ds-density-timetable-slot-h, 2.25rem)'
const TIME_COL = 'var(--ds-density-timetable-time-col-w, 3.625rem)'
const MIN_COL = 'var(--ds-density-timetable-min-col, 6.5rem)'

type CellKey = `${number}:${string}`

function cellKey(row: number, resourceId: string): CellKey {
  return `${row}:${resourceId}`
}

/** 뷰포트 내 일정 → 그리드 행·열·span */
function placementForAppointment(
  appt: TimetableAppointment,
  resources: TimetableResource[],
  viewportStart: number,
  slotMinutes: number,
  visibleSlotCount: number,
): { row: number; col: number; rowSpan: number } | null {
  const col = resources.findIndex((r) => r.id === appt.resourceId)
  if (col < 0) return null

  const relStart = (appt.startMinute - viewportStart) / slotMinutes
  const relEnd = (appt.endMinute - viewportStart) / slotMinutes
  if (relEnd <= 0 || relStart >= visibleSlotCount) return null

  const row = Math.max(0, Math.floor(relStart))
  const rowSpan = Math.max(1, Math.ceil(relEnd) - row)
  if (row >= visibleSlotCount) return null

  return { row, col, rowSpan: Math.min(rowSpan, visibleSlotCount - row) }
}

type TimetableGridProps = React.HTMLAttributes<HTMLDivElement> & {
  resources: TimetableResource[]
  appointments: TimetableAppointment[]
  viewportStart: number
  slotMinutes: number
  visibleSlotCount: number
  shakeActive?: boolean
  /** `bare` = 상위 셸이 카드 테두리를 갖는 경우. 단독 사용은 `card`(기본) */
  chrome?: 'card' | 'bare'
  /** 특정 리소스·슬롯을 선택 불가로 표시 (레거시 TimeTable `disabled` / `blocked` 에 해당) */
  isSlotDisabled?: (ctx: { resourceId: string; slotMinute: number }) => boolean
  /** 고를 수 있는 빈 칸의 결 — 미지정이면 전부 `default` */
  getSlotTone?: (ctx: { resourceId: string; slotMinute: number }) => TimetableSlotTone
  /** 빈 슬롯 중 현재 선택 — 클릭 시 시각적으로 구분 */
  selectedSlot?: TimetableSlotSelection | null
  onSlotCellClick?: (resourceId: string, slotMinute: number) => void
  selectedAppointmentId?: string | null
  onAppointmentActivate?: (id: string) => void
  onAppointmentCopy?: (appointment: TimetableAppointment) => void
}

function TimetableGrid({
  resources,
  appointments,
  viewportStart,
  slotMinutes,
  visibleSlotCount,
  shakeActive = false,
  chrome = 'card',
  isSlotDisabled,
  getSlotTone,
  selectedSlot,
  onSlotCellClick,
  selectedAppointmentId,
  onAppointmentActivate,
  onAppointmentCopy,
  className,
  style,
  ...props
}: TimetableGridProps) {
  const slotIndexes = buildSlotIndexes(visibleSlotCount)
  /** 빈 슬롯을 고르는 용도로 쓰이는 격자인가 (복사 격자와 구분) */
  const selectable = onSlotCellClick != null

  // Roving tabindex: keep a single empty-slot cell in the tab order.
  const [focusedSlot, setFocusedSlot] = useState<{ resourceId: string; slotMinute: number } | null>(
    null,
  )

  function handleGridKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)) return

    const current = document.activeElement
    if (!(current instanceof HTMLElement)) return

    const cell = current.closest<HTMLElement>(
      '[data-slot="timetable-time-slot-cell"][data-resource-id]',
    )
    if (!cell) return

    const resourceId = cell.dataset.resourceId ?? ''
    const slotMinute = Number(cell.dataset.slotMinute)
    const resourceIdx = resources.findIndex((r) => r.id === resourceId)

    e.preventDefault()

    let targetResourceId = resourceId
    let targetSlotMinute = slotMinute

    if (key === 'ArrowDown') targetSlotMinute = slotMinute + slotMinutes
    else if (key === 'ArrowUp') targetSlotMinute = slotMinute - slotMinutes
    else if (key === 'ArrowRight') {
      targetResourceId =
        resources[Math.min(resourceIdx + 1, resources.length - 1)]?.id ?? resourceId
    } else if (key === 'ArrowLeft') {
      targetResourceId = resources[Math.max(resourceIdx - 1, 0)]?.id ?? resourceId
    }

    setFocusedSlot({ resourceId: targetResourceId, slotMinute: targetSlotMinute })
    const selector = `[data-slot="timetable-time-slot-cell"][data-resource-id="${targetResourceId}"][data-slot-minute="${targetSlotMinute}"]`
    const target = e.currentTarget.querySelector<HTMLElement>(selector)
    target?.focus()

    // 선택이 포커스를 따라간다 — 이 격자에서 화살표 이동은 호버가 아니라 클릭과 동격이다.
    // 고르는 행위 자체는 되돌릴 수 있고(확정은 별도 버튼), 그래서 포커스 링과 선택 링을
    // 나눌 이유가 없다. 비활성 칸으로 옮겨간 경우에는 선택을 바꾸지 않는다.
    const movedToDisabled =
      isSlotDisabled?.({ resourceId: targetResourceId, slotMinute: targetSlotMinute }) ?? false
    if (!movedToDisabled && target) {
      onSlotCellClick?.(targetResourceId, targetSlotMinute)
    }
  }

  function handleGridFocus(e: React.FocusEvent<HTMLDivElement>) {
    const cell = (e.target as HTMLElement)?.closest<HTMLElement>(
      '[data-slot="timetable-time-slot-cell"][data-resource-id]',
    )
    if (!cell) return
    const resourceId = cell.dataset.resourceId ?? ''
    const slotMinute = Number(cell.dataset.slotMinute)
    if (!resourceId || Number.isNaN(slotMinute)) return
    setFocusedSlot({ resourceId, slotMinute })
  }

  const { placements, covered } = useMemo(() => {
    const coveredSet = new Set<CellKey>()
    const list: { appt: TimetableAppointment; row: number; col: number; rowSpan: number }[] = []

    for (const appt of appointments) {
      const p = placementForAppointment(
        appt,
        resources,
        viewportStart,
        slotMinutes,
        visibleSlotCount,
      )
      if (!p) continue
      list.push({ appt, ...p })
      for (let r = p.row; r < p.row + p.rowSpan; r++) {
        coveredSet.add(cellKey(r, appt.resourceId))
      }
    }

    return { placements: list, covered: coveredSet }
  }, [appointments, resources, viewportStart, slotMinutes, visibleSlotCount])

  // First interactive (enabled, uncovered) slot — default tab stop before any focus.
  const firstInteractiveSlot = useMemo(() => {
    for (const slotIndex of slotIndexes) {
      const slotMinute = slotMinuteForIndex(viewportStart, slotIndex, slotMinutes)
      for (const r of resources) {
        if (covered.has(cellKey(slotIndex, r.id))) continue
        if ((isSlotDisabled?.({ resourceId: r.id, slotMinute }) ?? false) === true) continue
        return { resourceId: r.id, slotMinute }
      }
    }
    return null
  }, [slotIndexes, resources, viewportStart, slotMinutes, covered, isSlotDisabled])

  const tabStopSlot =
    focusedSlot ??
    (selectedSlot != null
      ? { resourceId: selectedSlot.resourceId, slotMinute: selectedSlot.slotMinute }
      : firstInteractiveSlot)

  const gridStyle: React.CSSProperties = {
    ...style,
    gridTemplateColumns: `minmax(${TIME_COL},max-content) repeat(${resources.length}, minmax(${MIN_COL}, 1fr))`,
    gridTemplateRows: `auto repeat(${visibleSlotCount}, ${SLOT_H})`,
  }

  return (
    <Surface
      kind="section"
      data-slot="timetable-grid"
      data-shake={shakeActive ? '1' : undefined}
      className={cn(
        'min-w-0 overflow-hidden border-border-subtle',
        chrome === 'bare' && 'rounded-none border-0',
        shakeActive && 'ds-timetable-shake-active',
        className,
      )}
      {...props}
    >
      <div data-slot="grid-scroll-surface" className="min-w-0 overflow-x-auto">
        {}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- onKeyDown delegated to inner time slot cells */}
        <div
          className="grid min-w-max"
          style={gridStyle}
          onKeyDown={handleGridKeyDown}
          onFocus={handleGridFocus}
        >
          {/* ── 헤더 ── */}
          <div
            className="[grid-column:1] [grid-row:1] border-r border-b border-border-subtle bg-surface"
            aria-hidden
          />
          {resources.map((r, i) => (
            <div
              key={r.id}
              className={cn(
                'flex min-h-0 flex-col items-center justify-center border-b border-border-subtle bg-surface',
                'text-density-cell px-2 py-1.5 leading-tight font-medium tracking-tight text-fg',
                i < resources.length - 1 && 'border-r border-border-subtle',
              )}
              // eslint-disable-next-line design-system/no-inline-style -- dynamic CSS Grid column index (i+2)
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              <span className="truncate">{r.label}</span>
              {r.sublabel ? (
                <span className="text-density-timetable-rail font-normal text-fg-subtle">
                  {r.sublabel}
                </span>
              ) : null}
            </div>
          ))}

          {/* ── 행별: 시간 레일 + 빈 셀 ── */}
          {slotIndexes.map((slotIndex) => {
            const gridRow = slotIndex + 2
            const slotMinute = slotMinuteForIndex(viewportStart, slotIndex, slotMinutes)

            return (
              <div key={`row-${slotIndex}`} className="contents">
                <div
                  data-slot="time-rail-labels"
                  className={cn(
                    'box-border flex min-h-0 max-w-full items-center justify-end overflow-hidden border-r border-b border-border-subtle bg-surface',
                    'text-density-timetable-rail pr-1.5 pl-2 text-right text-fg-subtle tabular-nums',
                    'whitespace-nowrap',
                  )}
                  // eslint-disable-next-line design-system/no-inline-style -- dynamic CSS Grid row index (slotIndex+2)
                  style={{ gridColumn: 1, gridRow }}
                >
                  {formatTimeLabel(slotMinute)}
                </div>

                {resources.map((r, colIdx) => {
                  if (covered.has(cellKey(slotIndex, r.id))) return null

                  const slotLabel = formatTimeLabel(slotMinute)
                  const copyValue = `${slotLabel} · ${r.label}`
                  const disabled = isSlotDisabled?.({ resourceId: r.id, slotMinute }) ?? false
                  const selected =
                    !disabled &&
                    selectedSlot != null &&
                    selectedSlot.resourceId === r.id &&
                    selectedSlot.slotMinute === slotMinute

                  const isTabStop =
                    tabStopSlot != null &&
                    tabStopSlot.resourceId === r.id &&
                    tabStopSlot.slotMinute === slotMinute

                  return (
                    <TimetableTimeSlotCell
                      key={`${slotIndex}-${r.id}`}
                      resourceId={r.id}
                      slotMinute={slotMinute}
                      disabled={disabled}
                      tone={disabled ? undefined : getSlotTone?.({ resourceId: r.id, slotMinute })}
                      selected={selected}
                      isTabStop={isTabStop}
                      className={cn(
                        colIdx < resources.length - 1 && 'border-r border-border-subtle',
                      )}
                      // eslint-disable-next-line design-system/no-inline-style -- dynamic CSS Grid column/row for time slot cells
                      style={{ gridColumn: colIdx + 2, gridRow }}
                      // 고르는 격자에서는 미리보기를 띄우지 않는다. "12:00 · 김일신"은
                      // 바로 왼쪽 시간 레일과 바로 위 열 머리가 이미 말하는 것이고,
                      // 칸 위에 떠서 아래 칸을 가린다.
                      preview={
                        disabled || selectable ? undefined : (
                          <span className="text-fg-muted">
                            {copyValue}
                            <span className="text-density-head mt-0.5 block text-fg-subtle">
                              클릭하여 복사
                            </span>
                          </span>
                        )
                      }
                      // 슬롯을 고르는 격자에서는 클릭이 "선택"이다. 복사까지 겹쳐 걸면
                      // 예약하려고 누른 한 번이 조용히 클립보드를 덮어쓴다.
                      copyValue={disabled || selectable ? undefined : copyValue}
                      onCellClick={
                        disabled
                          ? undefined
                          : onSlotCellClick
                            ? () => onSlotCellClick(r.id, slotMinute)
                            : undefined
                      }
                    />
                  )
                })}
              </div>
            )
          })}

          {/* ── span 일정 블록 (셀 꽉 채움) ── */}
          {placements.map(({ appt, row, col, rowSpan }) => {
            const resourceLabel = resources[col]?.label ?? ''
            return (
              <TimetableAppointmentBlock
                key={appt.id}
                label={appt.label}
                copyValue={appt.copyValue}
                bgColor={appt.bgColor}
                fgColor={appt.fgColor}
                lock={appt.lock}
                preview={
                  <TimetableAppointmentPreview appointment={appt} resourceLabel={resourceLabel} />
                }
                selected={selectedAppointmentId === appt.id}
                onActivate={() => onAppointmentActivate?.(appt.id)}
                onCopy={() => onAppointmentCopy?.(appt)}
                className={cn(col < resources.length - 1 && 'border-r border-border-subtle')}
                // eslint-disable-next-line design-system/no-inline-style -- dynamic CSS Grid placement with rowSpan for appointment blocks
                style={{
                  gridColumn: col + 2,
                  gridRow: `${row + 2} / span ${rowSpan}`,
                  zIndex: 1,
                }}
              />
            )
          })}
        </div>
      </div>
    </Surface>
  )
}

export { TimetableGrid }
export type { TimetableGridProps }
