import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { Calendar } from './Calendar'
import anatomy from './Calendar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Calendar> = {
  title: 'Components/L1/Calendar',
  component: Calendar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Calendar>

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-72 rounded-md border border-border p-3">
        <Calendar value={date} onChange={setDate} />
      </div>
    )
  },
}

export const WithSelectedDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(new Date())
    return (
      <div className="w-72 rounded-md border border-border p-3">
        <Calendar value={date} onChange={setDate} />
      </div>
    )
  },
}

export const HideTodayIndicator: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-72 rounded-md border border-border p-3">
        <Calendar value={date} onChange={setDate} showToday={false} />
      </div>
    )
  },
}

export const WithMinMax: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return (
      <div className="w-72 space-y-2">
        <p className="text-xs text-fg-muted">Selectable: today ~ +7 days</p>
        <div className="rounded-md border border-border p-3">
          <Calendar value={date} onChange={setDate} min={today} max={nextWeek} />
        </div>
      </div>
    )
  },
}

export const Controlled: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    const [month, setMonth] = useState(new Date())
    return (
      <div className="space-y-3">
        <p className="text-xs text-fg-muted">
          Controlled month: {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </p>
        <div className="w-72 rounded-md border border-border p-3">
          <Calendar value={date} onChange={setDate} month={month} onMonthChange={setMonth} />
        </div>
      </div>
    )
  },
}

/**
 * day(select-option) 클릭 → onChange(Date) 호출.
 * 고정 월(2025-01)로 렌더하여 결정론적 테스트 보장.
 */
export const DayClickCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => (
    <div className="w-72 rounded-md border border-border p-3">
      <Calendar {...args} defaultMonth={new Date(2025, 0, 1)} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    // aria-pressed를 가진 버튼들이 날짜 버튼 — 첫 번째 활성 날짜 클릭
    const dayButtons = canvasElement.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')
    const firstEnabled = Array.from(dayButtons).find((b) => !b.disabled)
    if (!firstEnabled) throw new Error('활성화된 날짜 버튼 없음')
    await userEvent.click(firstEnabled)
    await expect(args.onChange).toHaveBeenCalledWith(expect.any(Date))
    const calledDate = (args.onChange as ReturnType<typeof fn>).mock.calls[0][0] as Date
    await expect(calledDate.getFullYear()).toBe(2025)
    await expect(calledDate.getMonth()).toBe(0) // January
  },
}

/**
 * prev/next month stepper 클릭 → 월 헤더 레이블 변경.
 */
export const PrevNextMonthNavigation: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-72 rounded-md border border-border p-3">
        <Calendar value={date} onChange={setDate} defaultMonth={new Date(2025, 5, 1)} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 현재 월: June 2025
    await expect(canvasElement.querySelector('span.font-semibold')?.textContent).toContain('June')

    // Next month → July
    const nextBtn = canvas.getByRole('button', { name: 'Next month' })
    await userEvent.click(nextBtn)
    await expect(canvasElement.querySelector('span.font-semibold')?.textContent).toContain('July')

    // Prev month × 2 → May
    const prevBtn = canvas.getByRole('button', { name: 'Previous month' })
    await userEvent.click(prevBtn)
    await userEvent.click(prevBtn)
    await expect(canvasElement.querySelector('span.font-semibold')?.textContent).toContain('May')
  },
}

/** defaultValue만 제공 — onChange 없이도 날짜 선택 시각 피드백이 동작합니다. */
export const Uncontrolled: Story = {
  render: () => (
    <div className="w-72 rounded-md border border-border p-3">
      <Calendar defaultValue={new Date(2025, 0, 15)} defaultMonth={new Date(2025, 0, 1)} />
    </div>
  ),
}

export const Density: Story = {
  render: () => {
    const [a, setA] = useState<Date | null>(null)
    const [b, setB] = useState<Date | null>(null)
    const [c, setC] = useState<Date | null>(null)
    return (
      <div className="flex flex-wrap gap-6">
        <div className="w-64 rounded-md border border-border p-2">
          <p className="mb-2 text-xs font-medium text-fg-muted">compact</p>
          <Calendar value={a} onChange={setA} density="compact" />
        </div>
        <div className="w-72 rounded-md border border-border p-3">
          <p className="mb-2 text-xs font-medium text-fg-muted">default</p>
          <Calendar value={b} onChange={setB} density="default" />
        </div>
        <div className="w-80 rounded-md border border-border p-4">
          <p className="mb-2 text-xs font-medium text-fg-muted">loose</p>
          <Calendar value={c} onChange={setC} density="loose" />
        </div>
      </div>
    )
  },
}
