'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  formatTimeLabel,
  isDateActive,
  nearestActiveDateKey,
  parseDateKey,
  shouldShowAppointmentsForCursor,
  stepCursorDate,
} from './timetable-utils'
import { TimetableController } from './TimetableController'
import { TimetableDateNav } from './TimetableDateNav'
import { TimetableGrid } from './TimetableGrid'
import { TimetableShell } from './TimetableShell'
import { TimetableViewToolbar } from './TimetableViewToolbar'

import type {
  TimetableAppointment,
  TimetableDateMeta,
  TimetableDensity,
  TimetableLabels,
  TimetableResource,
  TimetableSlotSelection,
} from './timetable-types'

import { cn } from '@/utils/cn'

type TimetableProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  resources: TimetableResource[]
  appointments: TimetableAppointment[]
  dates?: TimetableDateMeta[]
  /** controlled */
  cursorDate?: Date
  defaultCursorDate?: Date
  onCursorDateChange?: (d: Date) => void
  /** 기본 `false` — 활성 일만 날짜 이동·일정 표시. `true`이면 비활성 일 포함 */
  includeDeactiveDates?: boolean
  defaultIncludeDeactiveDates?: boolean
  onIncludeDeactiveDatesChange?: (v: boolean) => void
  viewportStart?: number
  defaultViewportStart?: number
  onViewportStartChange?: (m: number) => void
  slotMinutes?: number
  visibleSlotCount?: number
  /** 슬롯 클릭 콜백 (편집 패널 등 외부에서 처리) */
  onSlotCellClick?: (resourceId: string, slotMinute: number) => void
  /** 빈 슬롯 선택 불가 여부 — `true`이면 비활성 스타일·클릭 무시 */
  isSlotDisabled?: (ctx: { resourceId: string; slotMinute: number }) => boolean
  /** controlled 빈 슬롯 선택 */
  selectedSlot?: TimetableSlotSelection | null
  defaultSelectedSlot?: TimetableSlotSelection | null
  onSelectedSlotChange?: (next: TimetableSlotSelection | null) => void
  datePickerOpen?: boolean
  onDatePickerOpenChange?: (open: boolean) => void
  selectedAppointmentId?: string | null
  onAppointmentActivate?: (id: string) => void
  /** 일정 라벨 복사 후 호출 */
  onAppointmentCopy?: (appointment: TimetableAppointment) => void
  onDeactiveRevealForced?: () => void
  /** Table 과 동일 스케일 — `data-density` 로 하위(그리드 행·타이포)에 전달 */
  density?: TimetableDensity
  /** `TimetableViewToolbar` 등에 넘기는 문구. `includeDeactive`로 스위치 라벨을 제품에서 덮어쓸 수 있음 */
  labels?: TimetableLabels
  /** 날짜 오른쪽 표식 — "고객 희망일" 배지 등 */
  dateNavTrailing?: React.ReactNode
  /** 격자 아래 띠 — 칸 색이 무슨 뜻인지 밝히는 범례 */
  legend?: React.ReactNode
  /**
   * 마운트 시 시간표(셸)에 포커스 → 모달 등에서 열자마자 키보드 조작 가능.
   * ←/→=날짜 이동, ↑/↓=보이는 시간 윈도우 스크롤, Ctrl·Cmd 더블프레스=활성일정 필터 토글.
   */
  autoFocus?: boolean
}

/** ↑/↓ 키 1회당 뷰포트 이동 슬롯 수 — 툴바 `↑이전/↓다음` 기본값과 동일 */
const VIEWPORT_STEP_SLOTS = 2

function Timetable({
  resources,
  appointments,
  dates,
  cursorDate: cursorDateControlled,
  defaultCursorDate = new Date(),
  onCursorDateChange,
  includeDeactiveDates: includeDeactiveControlled,
  defaultIncludeDeactiveDates = false,
  onIncludeDeactiveDatesChange,
  viewportStart: viewportStartControlled,
  defaultViewportStart = 8 * 60,
  onViewportStartChange,
  slotMinutes = 30,
  visibleSlotCount = 10,
  onSlotCellClick,
  isSlotDisabled,
  selectedSlot: selectedSlotControlled,
  defaultSelectedSlot = null,
  onSelectedSlotChange,
  datePickerOpen: datePickerOpenControlled,
  onDatePickerOpenChange,
  selectedAppointmentId,
  onAppointmentActivate,
  onAppointmentCopy,
  onDeactiveRevealForced,
  density = 'default',
  labels,
  dateNavTrailing,
  legend,
  autoFocus = false,
  className,
  ...props
}: TimetableProps) {
  /* ── 날짜 ─────────────────────────────────────────────────────────── */
  const [cursorInner, setCursorInner] = useState(defaultCursorDate)
  const cursorDate = cursorDateControlled ?? cursorInner
  const setCursorDate = useCallback(
    (d: Date) => {
      if (cursorDateControlled === undefined) setCursorInner(d)
      onCursorDateChange?.(d)
    },
    [cursorDateControlled, onCursorDateChange],
  )

  /* ── 비활성 포함 ───────────────────────────────────────────────────── */
  const [includeInner, setIncludeInner] = useState(defaultIncludeDeactiveDates)
  const includeDeactiveDates = includeDeactiveControlled ?? includeInner
  const setIncludeDeactiveDates = useCallback(
    (v: boolean) => {
      if (includeDeactiveControlled === undefined) setIncludeInner(v)
      onIncludeDeactiveDatesChange?.(v)
    },
    [includeDeactiveControlled, onIncludeDeactiveDatesChange],
  )

  /* ── 뷰포트 ───────────────────────────────────────────────────────── */
  const [viewportInner, setViewportInner] = useState(defaultViewportStart)
  const viewportStart = viewportStartControlled ?? viewportInner
  const setViewportStart = useCallback(
    (m: number) => {
      if (viewportStartControlled === undefined) setViewportInner(m)
      onViewportStartChange?.(m)
    },
    [viewportStartControlled, onViewportStartChange],
  )

  /* ── Shake (비활성 해제 피드백) ──────────────────────────────────── */
  const [shakeActive, setShakeActive] = useState(false)
  useEffect(() => {
    if (!shakeActive) return
    const id = window.setTimeout(() => setShakeActive(false), 480) // 애니메이션 0.48s + 여유
    return () => window.clearTimeout(id)
  }, [shakeActive])

  /**
   * 날짜 이동의 단일 통로. 비활성 날짜로 옮겨가면 필터를 자동으로 풀어 준다 —
   * 안 그러면 도착한 날의 격자가 이유 없이 비어 보인다.
   */
  const goToDate = useCallback(
    (next: Date) => {
      if (!includeDeactiveDates && !isDateActive(next, dates)) {
        setIncludeDeactiveDates(true)
        setShakeActive(true)
        onDeactiveRevealForced?.()
      }
      setCursorDate(next)
    },
    [dates, includeDeactiveDates, onDeactiveRevealForced, setCursorDate, setIncludeDeactiveDates],
  )

  const stepDate = useCallback(
    (dir: -1 | 1) => goToDate(stepCursorDate(cursorDate, dir)),
    [cursorDate, goToDate],
  )

  const handleIncludeDeactiveChange = useCallback(
    (v: boolean) => {
      setIncludeDeactiveDates(v)
      if (!v && dates?.length) {
        const nearest = nearestActiveDateKey(cursorDate, dates)
        if (nearest) setCursorDate(parseDateKey(nearest))
      }
    },
    [cursorDate, dates, setCursorDate, setIncludeDeactiveDates],
  )

  /* ── 날짜 선택 팝오버 open (키보드 소유권) ─────────────────────────────
   * Timetable 이 "지금 키보드를 누가 갖는가"의 단일 소스. 날짜 캘린더가 열리면
   * 셸의 화살표 캡처를 양보(suspend)해 캘린더와 시간표가 동시에 반응하는 중첩을 막는다. */
  const [datePickerOpenInner, setDatePickerOpenInner] = useState(false)
  const datePickerOpen = datePickerOpenControlled ?? datePickerOpenInner
  const setDatePickerOpen = useCallback(
    (v: boolean) => {
      if (datePickerOpenControlled === undefined) setDatePickerOpenInner(v)
      onDatePickerOpenChange?.(v)
    },
    [datePickerOpenControlled, onDatePickerOpenChange],
  )

  const [selectedSlotInner, setSelectedSlotInner] = useState<TimetableSlotSelection | null>(
    defaultSelectedSlot,
  )
  const selectedSlot = selectedSlotControlled ?? selectedSlotInner
  const setSelectedSlot = useCallback(
    (next: TimetableSlotSelection | null) => {
      if (selectedSlotControlled === undefined) setSelectedSlotInner(next)
      onSelectedSlotChange?.(next)
    },
    [selectedSlotControlled, onSelectedSlotChange],
  )

  useEffect(() => {
    if (selectedSlotControlled !== undefined) return
    setSelectedSlotInner(null)
  }, [cursorDate, selectedSlotControlled])

  const handleEmptySlotClick = useCallback(
    (resourceId: string, slotMinute: number) => {
      if (isSlotDisabled?.({ resourceId, slotMinute })) return
      setSelectedSlot({ resourceId, slotMinute })
      onSlotCellClick?.(resourceId, slotMinute)
    },
    [isSlotDisabled, onSlotCellClick, setSelectedSlot],
  )

  const handleAppointmentActivate = useCallback(
    (id: string) => {
      setSelectedSlot(null)
      onAppointmentActivate?.(id)
    },
    [onAppointmentActivate, setSelectedSlot],
  )

  const appointmentsForView = useMemo(() => {
    if (shouldShowAppointmentsForCursor(cursorDate, dates, includeDeactiveDates)) {
      return appointments
    }
    return []
  }, [appointments, cursorDate, dates, includeDeactiveDates])

  /** 지금 보이는 시간 구간 — 스텝 버튼이 무엇을 움직이는지 밝히는 라벨 */
  const rangeLabel = `${formatTimeLabel(viewportStart)} – ${formatTimeLabel(
    viewportStart + visibleSlotCount * slotMinutes,
  )}`

  /* ── 렌더 ────────────────────────────────────────────────────────── */
  return (
    <div
      data-slot="timetable-root"
      data-density={density}
      className={cn('w-full min-w-0', className)}
      {...props}
    >
      <TimetableShell
        autoFocus={autoFocus}
        captureArrowsInDialog={autoFocus}
        keyboardSuspended={datePickerOpen}
        onDeactiveRevealForced={stepDate}
        onHorizontalArrow={stepDate}
        onVerticalArrow={(dir) => {
          setViewportStart(Math.max(0, viewportStart + dir * slotMinutes * VIEWPORT_STEP_SLOTS))
        }}
        onModifierDoublePress={() => handleIncludeDeactiveChange(!includeDeactiveDates)}
        controllerRegion={
          <TimetableController
            dateNavSlot={
              <TimetableDateNav
                cursorDate={cursorDate}
                datePickerOpen={datePickerOpen}
                onDatePickerOpenChange={setDatePickerOpen}
                onDateChange={goToDate}
                onStepDate={stepDate}
                trailing={dateNavTrailing}
              />
            }
            viewToolbarSlot={
              <TimetableViewToolbar
                viewportStart={viewportStart}
                slotMinutes={slotMinutes}
                includeDeactiveDates={includeDeactiveDates}
                onViewportChange={setViewportStart}
                onIncludeDeactiveChange={handleIncludeDeactiveChange}
                rangeLabel={rangeLabel}
                labels={labels}
              />
            }
          />
        }
        legendRegion={legend}
        gridRegion={
          <TimetableGrid
            chrome="bare"
            resources={resources}
            appointments={appointmentsForView}
            viewportStart={viewportStart}
            slotMinutes={slotMinutes}
            visibleSlotCount={visibleSlotCount}
            shakeActive={shakeActive}
            isSlotDisabled={isSlotDisabled}
            selectedSlot={selectedSlot}
            onSlotCellClick={handleEmptySlotClick}
            selectedAppointmentId={selectedAppointmentId}
            onAppointmentActivate={handleAppointmentActivate}
            onAppointmentCopy={onAppointmentCopy}
          />
        }
      />
    </div>
  )
}

export { Timetable }
export type { TimetableProps }
