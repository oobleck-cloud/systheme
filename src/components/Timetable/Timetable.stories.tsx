/**
 * L3 — Timetable
 */
import { useCallback, useMemo, useState } from 'react'

import { dateKey } from './timetable-utils'
import shellAnatomy from './TimetableShell/TimetableShell.anatomy.json'

import {
  Timetable,
  type TimetableAppointment,
  type TimetableDateMeta,
  type TimetableResource,
  type TimetableSlotSelection,
} from './index'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Timetable> = {
  title: 'Components/L3/Timetable',
  component: Timetable,
  tags: ['autodocs'],
  args: {
    density: 'default',
    slotMinutes: 30,
    visibleSlotCount: 10,
    defaultViewportStart: 9 * 60,
  },
}

mergeAnatomyMeta(meta, shellAnatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Timetable>

// ── 리소스(플래너) ─────────────────────────────────────────────────────────────

const resources: TimetableResource[] = [
  { id: 'p1', label: '함성일' },
  { id: 'p2', label: '이종석' },
  { id: 'p3', label: '박민준' },
]

// ── 날짜 유틸 ─────────────────────────────────────────────────────────────────

function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

/** 30분 단위 슬롯 분 배열 생성 */
function slots(from: number, to: number): number[] {
  const r: number[] = []
  for (let m = from; m < to; m += 30) r.push(m)
  return r
}

// ── 고객 희망 방문일 (active dates) ───────────────────────────────────────────
//
// 실 서비스: order.visit 타임슬롯 배열에서 날짜만 파싱.
// -2일, 오늘, +3일, +7일을 고객이 원하는 날짜로 가정.

const ACTIVE_OFFSETS = [-2, 0, 3, 7] as const

/** 날짜 목록 — cursor와 무관한 고정 목록. 범위: -7 ~ +14 */
function buildDates(anchor: Date): TimetableDateMeta[] {
  const activeKeys = new Set(ACTIVE_OFFSETS.map((o) => dateKey(addDays(anchor, o))))
  return Array.from({ length: 22 }, (_, i) => {
    const d = addDays(anchor, i - 7)
    const id = dateKey(d)
    return { id, active: activeKeys.has(id) }
  })
}

// ── 날짜별·플래너별 추가 비활성 슬롯 ─────────────────────────────────────────
//
// 실 서비스: slot.status === 'unavailable' → disabled.
// 날짜마다 플래너 사정(반차·출장·휴가·미팅)이 다르게 적용됨.
//
// 날짜 프로파일 요약:
//   D-3 (비활성): 전원 정상
//   D-2 (활성)  : 이종석 오후 반차, 박민준 오전 교육
//   D-1 (비활성): 전원 정상
//   D+0 (활성)  : 함성일 13-14 회의, 이종석 13시 이후 off — 바쁜 날
//   D+1 (비활성): 함성일 오후 off
//   D+2 (비활성): 전원 정상, 예약 없음
//   D+3 (활성)  : 전원 정상 — 여유로운 날
//   D+5 (비활성): 박민준 출장 전일
//   D+7 (활성)  : 이종석 휴가 전일

function buildExtraDisabled(anchor: Date): Map<string, Map<string, Set<number>>> {
  const map = new Map<string, Map<string, Set<number>>>()

  function add(offset: number, resourceId: string, minutes: number[]) {
    const dk = dateKey(addDays(anchor, offset))
    if (!map.has(dk)) map.set(dk, new Map())
    const rMap = map.get(dk)!
    if (!rMap.has(resourceId)) rMap.set(resourceId, new Set())
    const set = rMap.get(resourceId)!
    minutes.forEach((m) => set.add(m))
  }

  // D-2: 이종석 오후 반차(14:00~), 박민준 오전 교육(~13:00)
  add(-2, 'p2', slots(14 * 60, 18 * 60))
  add(-2, 'p3', slots(9 * 60, 13 * 60))

  // D+0 today: 함성일 13:00-14:30 내부 회의, 이종석 13:00 이후 off
  add(0, 'p1', slots(13 * 60, 15 * 60))
  add(0, 'p2', slots(13 * 60, 18 * 60))

  // D+1: 함성일 오후 반차
  add(1, 'p1', slots(13 * 60, 18 * 60))

  // D+5: 박민준 출장 (전일)
  add(5, 'p3', slots(9 * 60, 18 * 60))

  // D+7: 이종석 휴가 (전일)
  add(7, 'p2', slots(9 * 60, 18 * 60))

  return map
}

// ── 날짜별 예약 목록 ──────────────────────────────────────────────────────────
//
// 실 서비스: slot.status === 'appointed' → TimetableAppointmentBlock.
// label = 구역 코드 (서초-1, 강남-3 …).
//
// 예약 밀도 요약:
//   D-3: 가벼움 (2건)
//   D-2: 보통 (6건, 함성일 2 + 이종석 2 + 박민준 2)
//   D-1: 가벼움 (2건)
//   D+0: 빽빽함 (6건, 오전 집중)
//   D+1: 보통 (3건)
//   D+2: 없음
//   D+3: 가벼움 (2건)
//   D+5: 보통 (3건, 박민준 전일 출장이라 p1·p2만)
//   D+7: 보통 (4건, 이종석 휴가라 p1·p3만)

function buildAppointmentsByDate(anchor: Date): Map<string, TimetableAppointment[]> {
  const m = new Map<string, TimetableAppointment[]>()
  const dk = (o: number) => dateKey(addDays(anchor, o))

  // D-3 (비활성): 조용한 날
  m.set(dk(-3), [
    {
      id: 'm3-1',
      resourceId: 'p2',
      startMinute: 10 * 60,
      endMinute: 10 * 60 + 30,
      label: '서초-3',
      color: 'success',
    },
    {
      id: 'm3-2',
      resourceId: 'p3',
      startMinute: 14 * 60,
      endMinute: 14 * 60 + 30,
      label: '마포-1',
      color: 'warning',
    },
  ])

  // D-2 (활성): 이종석·박민준 각각 오전/오후 제한 속 적당한 예약
  m.set(dk(-2), [
    {
      id: 'm2-1',
      resourceId: 'p1',
      startMinute: 10 * 60,
      endMinute: 10 * 60 + 30,
      label: '서초-2',
      color: 'primary',
    },
    {
      id: 'm2-2',
      resourceId: 'p1',
      startMinute: 11 * 60 + 30,
      endMinute: 12 * 60,
      label: '강남-1',
      color: 'primary',
    },
    {
      id: 'm2-3',
      resourceId: 'p2',
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60,
      label: '마포-2',
      color: 'success',
    },
    {
      id: 'm2-4',
      resourceId: 'p2',
      startMinute: 11 * 60,
      endMinute: 11 * 60 + 30,
      label: '용산-1',
      color: 'success',
    },
    {
      id: 'm2-5',
      resourceId: 'p3',
      startMinute: 14 * 60 + 30,
      endMinute: 15 * 60,
      label: '서초-1',
      color: 'warning',
    },
    {
      id: 'm2-6',
      resourceId: 'p3',
      startMinute: 16 * 60 + 30,
      endMinute: 17 * 60,
      label: '송파-3',
      color: 'warning',
    },
  ])

  // D-1 (비활성): 두 건
  m.set(dk(-1), [
    {
      id: 'm1-1',
      resourceId: 'p2',
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60,
      label: '강남-2',
      color: 'success',
    },
    {
      id: 'm1-2',
      resourceId: 'p3',
      startMinute: 15 * 60,
      endMinute: 15 * 60 + 30,
      label: '서초-1',
      color: 'warning',
    },
  ])

  // D+0 (활성, 바쁜 날): 오전에 예약 집중, 함성일·이종석 오후 일부 off
  m.set(dk(0), [
    {
      id: 'p0-1',
      resourceId: 'p1',
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60,
      label: '서초-2',
      color: 'primary',
    },
    {
      id: 'p0-2',
      resourceId: 'p1',
      startMinute: 11 * 60,
      endMinute: 11 * 60 + 30,
      label: '강남-3',
      color: 'primary',
    },
    {
      id: 'p0-3',
      resourceId: 'p2',
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60,
      label: '마포-2',
      color: 'success',
    },
    {
      id: 'p0-4',
      resourceId: 'p2',
      startMinute: 10 * 60 + 30,
      endMinute: 11 * 60,
      label: '용산-1',
      color: 'success',
    },
    {
      id: 'p0-5',
      resourceId: 'p3',
      startMinute: 14 * 60,
      endMinute: 14 * 60 + 30,
      label: '송파-1',
      color: 'warning',
    },
    {
      id: 'p0-6',
      resourceId: 'p3',
      startMinute: 15 * 60 + 30,
      endMinute: 16 * 60,
      label: '서초-3',
      color: 'warning',
    },
  ])

  // D+1 (비활성): 이종석·박민준 활동, 함성일 오후 off
  m.set(dk(1), [
    {
      id: 'p1-1',
      resourceId: 'p1',
      startMinute: 10 * 60,
      endMinute: 10 * 60 + 30,
      label: '강남-1',
      color: 'primary',
    },
    {
      id: 'p1-2',
      resourceId: 'p2',
      startMinute: 11 * 60 + 30,
      endMinute: 12 * 60,
      label: '마포-3',
      color: 'success',
    },
    {
      id: 'p1-3',
      resourceId: 'p3',
      startMinute: 16 * 60 + 30,
      endMinute: 17 * 60,
      label: '서초-2',
      color: 'info',
    },
  ])

  // D+2 (비활성): 예약 없음 (전원 빈 슬롯)
  // m.set(dk(2), [])  — 생략하면 [] 반환

  // D+3 (활성, 여유로운 날): 전원 정상 영업, 예약 적음
  m.set(dk(3), [
    {
      id: 'p3-1',
      resourceId: 'p1',
      startMinute: 10 * 60,
      endMinute: 10 * 60 + 30,
      label: '서초-1',
      color: 'primary',
    },
    {
      id: 'p3-2',
      resourceId: 'p3',
      startMinute: 13 * 60 + 30,
      endMinute: 14 * 60,
      label: '용산-2',
      color: 'info',
    },
  ])

  // D+5 (비활성): 박민준 출장, p1·p2만 활동
  m.set(dk(5), [
    {
      id: 'p5-1',
      resourceId: 'p1',
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60,
      label: '강남-1',
      color: 'primary',
    },
    {
      id: 'p5-2',
      resourceId: 'p1',
      startMinute: 11 * 60,
      endMinute: 11 * 60 + 30,
      label: '서초-2',
      color: 'primary',
    },
    {
      id: 'p5-3',
      resourceId: 'p2',
      startMinute: 10 * 60 + 30,
      endMinute: 11 * 60,
      label: '마포-1',
      color: 'success',
    },
  ])

  // D+7 (활성): 이종석 휴가, p1·p3 충실
  m.set(dk(7), [
    {
      id: 'p7-1',
      resourceId: 'p1',
      startMinute: 9 * 60 + 30,
      endMinute: 10 * 60,
      label: '서초-1',
      color: 'primary',
    },
    {
      id: 'p7-2',
      resourceId: 'p1',
      startMinute: 11 * 60 + 30,
      endMinute: 12 * 60,
      label: '강남-2',
      color: 'primary',
    },
    {
      id: 'p7-3',
      resourceId: 'p3',
      startMinute: 14 * 60,
      endMinute: 14 * 60 + 30,
      label: '마포-1',
      color: 'info',
    },
    {
      id: 'p7-4',
      resourceId: 'p3',
      startMinute: 15 * 60 + 30,
      endMinute: 16 * 60,
      label: '용산-2',
      color: 'info',
    },
  ])

  return m
}

// ── Demo render ───────────────────────────────────────────────────────────────

export const Default: Story = {
  render: function TimetableDemo(args) {
    const today = useMemo(() => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d
    }, [])

    const dates = useMemo(() => buildDates(today), [today])
    const extraDisabled = useMemo(() => buildExtraDisabled(today), [today])
    const appointmentsByDate = useMemo(() => buildAppointmentsByDate(today), [today])

    const [cursor, setCursor] = useState<Date>(today)
    const [includeDeactive, setIncludeDeactive] = useState(false)
    const [selected, setSelected] = useState<string | null>(null)
    const [lastSlot, setLastSlot] = useState<TimetableSlotSelection | null>(null)

    const appointments = useMemo(
      () => appointmentsByDate.get(dateKey(cursor)) ?? [],
      [appointmentsByDate, cursor],
    )

    /**
     * 슬롯 비활성 여부 — 날짜 이동 스위치(includeDeactiveDates)와 무관하게 고정.
     *
     * 1. 전역: 업무시간 외(09:00 이전·18:00 이후), 점심(12:00–12:30)
     * 2. 날짜·플래너별: buildExtraDisabled 맵 참조
     */
    const isSlotDisabled = useCallback(
      ({ resourceId, slotMinute }: { resourceId: string; slotMinute: number }): boolean => {
        if (slotMinute < 9 * 60 || slotMinute >= 18 * 60) return true
        if (slotMinute >= 12 * 60 && slotMinute < 12 * 60 + 30) return true
        const extra = extraDisabled.get(dateKey(cursor))?.get(resourceId)
        return extra?.has(slotMinute) ?? false
      },
      [cursor, extraDisabled],
    )

    return (
      <div className="max-w-5xl p-4">
        <p className="mb-2 text-sm text-fg-muted">
          활성 날짜(고객 희망 방문일): <strong>-2일 · 오늘 · +3일 · +7일</strong>. 같은 방향
          화살표를 200ms 이내 연타하면 비활성 날짜 포함으로 전환됩니다.
        </p>
        <p className="mb-3 text-sm text-fg-muted">
          날짜마다 플래너 가용 패턴이 다릅니다 — D-2 이종석 오후 반차·박민준 오전 교육 / D+0 오늘
          함성일·이종석 오후 일부 off (바쁜 날) / D+3 전원 정상 (여유) / D+5 박민준 출장 / D+7
          이종석 휴가.
        </p>
        {lastSlot ? (
          <p className="mb-3 text-xs text-fg-subtle" data-testid="last-slot-pick">
            마지막 빈 슬롯: <code className="rounded bg-muted px-1">{lastSlot.resourceId}</code> ·{' '}
            <code className="rounded bg-muted px-1">{lastSlot.slotMinute}</code> 분
          </p>
        ) : (
          <p className="mb-3 text-xs text-fg-subtle">빈 슬롯을 클릭해 보세요.</p>
        )}
        <Timetable
          {...args}
          resources={resources}
          appointments={appointments}
          dates={dates}
          cursorDate={cursor}
          onCursorDateChange={setCursor}
          includeDeactiveDates={includeDeactive}
          onIncludeDeactiveDatesChange={setIncludeDeactive}
          selectedAppointmentId={selected}
          onAppointmentActivate={setSelected}
          isSlotDisabled={isSlotDisabled}
          onSlotCellClick={(resourceId, slotMinute) => setLastSlot({ resourceId, slotMinute })}
        />
      </div>
    )
  },
}

export const Compact: Story = {
  args: { density: 'compact', visibleSlotCount: 12 },
  render: Default.render,
}

export const Comfortable: Story = {
  args: { density: 'comfortable', visibleSlotCount: 10 },
  render: Default.render,
}

/**
 * 방문 확정 잠금 — 고객에게 알린 방문은 자물쇠 + 실선, 아직 18:30 전인 방문은 점선.
 * 구역 색은 그대로 두고 테두리로만 가른다(주황은 주의 칸 몫).
 */
const LOCK_APPOINTMENTS: TimetableAppointment[] = [
  {
    id: 'a1',
    resourceId: 'p1',
    startMinute: 10 * 60 + 30,
    endMinute: 11 * 60,
    label: '#2117959 (서구)',
    lock: 'confirmed',
    note: '확정 · 10/30 (금) 18:30 고객 안내함\n고객 조율 없이 옮길 수 없습니다',
  },
  {
    id: 'a2',
    resourceId: 'p2',
    startMinute: 10 * 60 + 30,
    endMinute: 11 * 60,
    label: '#2119298 (일산동구)',
    lock: 'pending',
    note: '확정 전 — 18:30 전까지 자유롭게 옮길 수 있음',
  },
]

export const VisitConfirmLock: Story = {
  args: { density: 'compact', visibleSlotCount: 8, defaultViewportStart: 10 * 60 },
  render: function TimetableLockDemo(args) {
    const [cursor, setCursor] = useState<Date>(() => new Date())
    return (
      <div className="max-w-3xl p-4">
        <Timetable
          {...args}
          resources={resources.slice(0, 2)}
          appointments={LOCK_APPOINTMENTS}
          cursorDate={cursor}
          onCursorDateChange={setCursor}
        />
      </div>
    )
  },
}
