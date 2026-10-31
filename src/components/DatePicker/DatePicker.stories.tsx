import { expect, fn, userEvent, waitFor, within } from '@storybook/test'
import { useState } from 'react'

import { DatePicker } from './DatePicker'
import anatomy from './DatePicker.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof DatePicker> = {
  title: 'Components/L1/DatePicker',
  component: DatePicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-64">
        <DatePicker value={date} onChange={setDate} />
      </div>
    )
  },
}

/** value/onChange 없이 defaultValue만으로 단독 동작하는 uncontrolled 모드 */
export const Uncontrolled: Story = {
  render: () => (
    <div className="w-64">
      <DatePicker defaultValue={new Date(2025, 4, 21)} />
    </div>
  ),
}

export const WithValue: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(new Date(2025, 4, 21))
    return (
      <div className="w-64">
        <DatePicker value={date} onChange={setDate} />
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
      <div className="w-64 space-y-1">
        <p className="text-xs text-fg-muted">Only today ~ next 7 days selectable</p>
        <DatePicker value={date} onChange={setDate} min={today} max={nextWeek} />
      </div>
    )
  },
}

export const WithError: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-64">
        <DatePicker variant="error" value={date} onChange={setDate} placeholder="Required" />
      </div>
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-64 space-y-3">
        <DatePicker size="sm" value={date} onChange={setDate} placeholder="Small" />
        <DatePicker size="md" value={date} onChange={setDate} placeholder="Medium" />
        <DatePicker size="lg" value={date} onChange={setDate} placeholder="Large" />
      </div>
    )
  },
}

export const CalendarDensity: Story = {
  name: 'Calendar density',
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-64 space-y-4">
        <p className="text-xs text-fg-muted">
          Popover calendar inherits `density` from DatePicker.
        </p>
        <DatePicker value={date} onChange={setDate} density="compact" placeholder="Compact panel" />
        <DatePicker value={date} onChange={setDate} density="loose" placeholder="Loose panel" />
      </div>
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, placeholder: 'Disabled' },
  render: (args) => (
    <div className="w-64">
      <DatePicker {...args} />
    </div>
  ),
}

/**
 * trigger(disclosure) 클릭 → Calendar 패널(role=dialog) 노출.
 */
export const OpensCalendarPanel: Story = {
  render: () => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-64">
        <DatePicker value={date} onChange={setDate} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('dialog')).toBeNull()

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('dialog', { name: 'Date picker' })).toBeVisible()

    // 다시 클릭 → 닫힘
    await userEvent.click(trigger)
    await waitFor(() => {
      if (canvasElement.querySelector('[role="dialog"]')) throw new Error('패널이 닫히지 않음')
    })
  },
}

/**
 * 날짜 선택 → onChange(Date) 호출 + 패널 자동 닫힘.
 */
export const DaySelectClosesPanel: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [date, setDate] = useState<Date | null>(null)
    return (
      <div className="w-64">
        <DatePicker
          {...args}
          value={date}
          onChange={(d) => {
            args.onChange?.(d)
            setDate(d)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // 패널 열기
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByRole('dialog')).toBeVisible()

    // 첫 활성 날짜 클릭
    const dayButtons = canvasElement.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')
    const firstEnabled = Array.from(dayButtons).find((b) => !b.disabled)
    if (!firstEnabled) throw new Error('활성화된 날짜 버튼 없음')
    await userEvent.click(firstEnabled)

    // onChange가 Date로 호출됨
    await expect(args.onChange).toHaveBeenCalledWith(expect.any(Date))
    // 패널 자동 닫힘
    await waitFor(() => {
      if (canvasElement.querySelector('[role="dialog"]'))
        throw new Error('날짜 선택 후 패널이 닫히지 않음')
    })
  },
}
