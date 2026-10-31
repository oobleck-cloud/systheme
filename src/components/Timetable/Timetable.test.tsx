/**
 * Timetable — 날짜 이동 동작
 *
 * A. 이전/다음 = 달력 하루. 데이터가 있는 날로 건너뛰지 않는다.
 * B. 비활성 날짜로 이동하면 "활성만 보기" 필터가 자동으로 풀린다.
 */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Timetable } from './Timetable'

import type { TimetableDateMeta } from './timetable-types'

/** 데이터는 8/21·8/28 에만, 활성(고객 희망)은 8/28 하나뿐. */
const DATES: TimetableDateMeta[] = [
  { id: '2026-08-21', active: false },
  { id: '2026-08-28', active: true },
]

const RESOURCES = [{ id: 'p1', label: '플래너1' }]

function renderTimetable(props: Partial<React.ComponentProps<typeof Timetable>> = {}) {
  return render(
    <Timetable
      resources={RESOURCES}
      appointments={[]}
      dates={DATES}
      cursorDate={new Date(2026, 7, 28)}
      includeDeactiveDates={false}
      {...props}
    />,
  )
}

describe('A. 날짜 이동 단위', () => {
  it('이전 날짜는 데이터가 없어도 바로 직전 일자다', () => {
    const onCursorDateChange = vi.fn()
    renderTimetable({ onCursorDateChange })

    fireEvent.click(screen.getByLabelText('이전 날짜'))

    expect(onCursorDateChange).toHaveBeenCalledWith(new Date(2026, 7, 27))
  })

  it('다음 날짜는 바로 다음 일자다', () => {
    const onCursorDateChange = vi.fn()
    renderTimetable({ onCursorDateChange })

    fireEvent.click(screen.getByLabelText('다음 날짜'))

    expect(onCursorDateChange).toHaveBeenCalledWith(new Date(2026, 7, 29))
  })
})

describe('B. 비활성 날짜 진입', () => {
  it('활성만 보기 상태에서 비활성 날짜(8/21)로 가면 필터를 풀어 준다', () => {
    const onIncludeDeactiveDatesChange = vi.fn()
    renderTimetable({ cursorDate: new Date(2026, 7, 22), onIncludeDeactiveDatesChange })

    fireEvent.click(screen.getByLabelText('이전 날짜'))

    expect(onIncludeDeactiveDatesChange).toHaveBeenCalledWith(true)
  })

  it('메타가 없는 날(숨길 것이 없는 날)에는 필터를 건드리지 않는다', () => {
    const onIncludeDeactiveDatesChange = vi.fn()
    renderTimetable({ onIncludeDeactiveDatesChange })

    fireEvent.click(screen.getByLabelText('이전 날짜')) // 8/28 → 8/27, 메타 없음

    expect(onIncludeDeactiveDatesChange).not.toHaveBeenCalled()
  })

  it('이미 비활성 포함 상태면 필터를 건드리지 않는다', () => {
    const onIncludeDeactiveDatesChange = vi.fn()
    renderTimetable({
      cursorDate: new Date(2026, 7, 22),
      includeDeactiveDates: true,
      onIncludeDeactiveDatesChange,
    })

    fireEvent.click(screen.getByLabelText('이전 날짜'))

    expect(onIncludeDeactiveDatesChange).not.toHaveBeenCalled()
  })
})

/**
 * C. 슬롯 선택 — 이 격자에서 키보드 이동은 호버가 아니라 클릭과 동격이다.
 *    포커스가 칸 안에 있으면 화살표는 칸을 옮기고, 옮겨간 칸이 곧 선택이 된다.
 */
describe('C. 슬롯 선택은 포커스를 따라간다', () => {
  const TWO_RESOURCES = [
    { id: 'p1', label: '플래너1' },
    { id: 'p2', label: '플래너2' },
  ]

  function firstCell(container: HTMLElement): HTMLElement {
    const cell = container.querySelector<HTMLElement>(
      '[data-slot="timetable-time-slot-cell"][data-resource-id="p1"][data-slot-minute="480"]',
    )
    if (!cell) throw new Error('슬롯 칸을 찾지 못했습니다')
    return cell
  }

  it('칸 안에서 ↓ 를 누르면 다음 슬롯이 선택된다', () => {
    const onSelectedSlotChange = vi.fn()
    const { container } = renderTimetable({
      resources: TWO_RESOURCES,
      onSelectedSlotChange,
      defaultViewportStart: 8 * 60,
    })

    const cell = firstCell(container)
    act(() => cell.focus())
    fireEvent.keyDown(cell, { key: 'ArrowDown' })

    expect(onSelectedSlotChange).toHaveBeenCalledWith({ resourceId: 'p1', slotMinute: 510 })
  })

  it('칸 안에서 → 를 누르면 옆 리소스의 같은 시각이 선택된다', () => {
    const onSelectedSlotChange = vi.fn()
    const { container } = renderTimetable({
      resources: TWO_RESOURCES,
      onSelectedSlotChange,
      defaultViewportStart: 8 * 60,
    })

    const cell = firstCell(container)
    act(() => cell.focus())
    fireEvent.keyDown(cell, { key: 'ArrowRight' })

    expect(onSelectedSlotChange).toHaveBeenCalledWith({ resourceId: 'p2', slotMinute: 480 })
  })

  it('칸 밖(셸)에서의 ↓ 는 선택이 아니라 보이는 시간 구간을 옮긴다', () => {
    const onSelectedSlotChange = vi.fn()
    const onViewportStartChange = vi.fn()
    renderTimetable({
      resources: TWO_RESOURCES,
      onSelectedSlotChange,
      onViewportStartChange,
      defaultViewportStart: 8 * 60,
    })

    fireEvent.keyDown(screen.getByRole('application', { name: '시간표' }), { key: 'ArrowDown' })

    expect(onViewportStartChange).toHaveBeenCalled()
    expect(onSelectedSlotChange).not.toHaveBeenCalled()
  })

  it('선택 불가 칸으로 옮겨가면 선택을 바꾸지 않는다', () => {
    const onSelectedSlotChange = vi.fn()
    const { container } = renderTimetable({
      resources: TWO_RESOURCES,
      onSelectedSlotChange,
      defaultViewportStart: 8 * 60,
      isSlotDisabled: ({ slotMinute }) => slotMinute === 510,
    })

    const cell = firstCell(container)
    act(() => cell.focus())
    fireEvent.keyDown(cell, { key: 'ArrowDown' })

    expect(onSelectedSlotChange).not.toHaveBeenCalled()
  })

  it('getSlotTone 은 고를 수 있는 칸에만 결을 싣고, 막힌 칸에는 싣지 않는다', () => {
    const { container } = renderTimetable({
      resources: TWO_RESOURCES,
      defaultViewportStart: 8 * 60,
      isSlotDisabled: ({ slotMinute }) => slotMinute === 510,
      getSlotTone: ({ slotMinute }) => (slotMinute === 480 ? 'attention' : 'tentative'),
    })

    const cell = (minute: number) =>
      container.querySelector(
        `[data-slot="timetable-time-slot-cell"][data-resource-id="${TWO_RESOURCES[0]!.id}"][data-slot-minute="${minute}"]`,
      )
    expect(cell(480)?.getAttribute('data-tone')).toBe('attention')
    expect(cell(540)?.getAttribute('data-tone')).toBe('tentative')
    expect(cell(510)?.getAttribute('data-tone')).toBeNull()
  })
})
