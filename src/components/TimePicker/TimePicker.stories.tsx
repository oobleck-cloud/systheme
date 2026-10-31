import { expect, fn, userEvent, waitFor, within } from '@storybook/test'
import { useState } from 'react'

import { TimePicker } from './TimePicker'
import anatomy from './TimePicker.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TimePicker> = {
  title: 'Components/L1/TimePicker',
  component: TimePicker,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TimePicker>

export const Default: Story = {
  render: () => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48">
        <TimePicker value={time} onChange={setTime} />
      </div>
    )
  },
}

/** value/onChange 없이 defaultValue만으로 단독 동작하는 uncontrolled 모드 */
export const Uncontrolled: Story = {
  render: () => (
    <div className="w-48">
      <TimePicker defaultValue="09:30" />
    </div>
  ),
}

export const WithValue: Story = {
  render: () => {
    const [time, setTime] = useState('09:30')
    return (
      <div className="w-48">
        <TimePicker value={time} onChange={setTime} />
      </div>
    )
  },
}

export const Step5Minutes: Story = {
  render: () => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48 space-y-1">
        <p className="text-xs text-fg-muted">5-minute steps</p>
        <TimePicker value={time} onChange={setTime} step={5} />
      </div>
    )
  },
}

export const Use12Hour: Story = {
  render: () => {
    const [time, setTime] = useState('14:00')
    return (
      <div className="w-52 space-y-1">
        <p className="text-xs text-fg-muted">12-hour display</p>
        <TimePicker value={time} onChange={setTime} use12Hour />
      </div>
    )
  },
}

export const WithError: Story = {
  render: () => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48">
        <TimePicker variant="error" value={time} onChange={setTime} placeholder="Required" />
      </div>
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48 space-y-3">
        <TimePicker size="sm" value={time} onChange={setTime} placeholder="Small" />
        <TimePicker size="md" value={time} onChange={setTime} placeholder="Medium" />
        <TimePicker size="lg" value={time} onChange={setTime} placeholder="Large" />
      </div>
    )
  },
}

/**
 * trigger(disclosure) 클릭 → 패널(role=dialog) 노출.
 */
export const OpensPanel: Story = {
  render: () => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48">
        <TimePicker value={time} onChange={setTime} />
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
    await expect(canvas.getByRole('dialog', { name: 'Time picker' })).toBeVisible()

    // 다시 클릭 → 닫힘
    await userEvent.click(trigger)
    await waitFor(() => {
      if (canvasElement.querySelector('[role="dialog"]')) throw new Error('패널이 닫히지 않음')
    })
  },
}

/**
 * hour-option 클릭 → onChange("HH:00") 호출.
 */
export const HourClickCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48">
        <TimePicker
          {...args}
          value={time}
          onChange={(v) => {
            args.onChange?.(v)
            setTime(v)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByRole('dialog')).toBeVisible()

    // Hours listbox 안의 첫 번째 option(00시) 클릭
    const hoursListbox = canvas.getByRole('listbox', { name: 'Hours' })
    const hourOptions = within(hoursListbox).getAllByRole('option')
    await userEvent.click(hourOptions[9]) // 09시

    await expect(args.onChange).toHaveBeenCalledWith('09:00')
  },
}

/**
 * minute-option 클릭 → onChange("00:MM") 호출.
 */
export const MinuteClickCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [time, setTime] = useState<string | undefined>(undefined)
    return (
      <div className="w-48">
        <TimePicker
          {...args}
          value={time}
          onChange={(v) => {
            args.onChange?.(v)
            setTime(v)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByRole('dialog')).toBeVisible()

    // Minutes listbox 안의 두 번째 option(15분, step=15) 클릭
    const minutesListbox = canvas.getByRole('listbox', { name: 'Minutes' })
    const minuteOptions = within(minutesListbox).getAllByRole('option')
    await userEvent.click(minuteOptions[1]) // 15분

    await expect(args.onChange).toHaveBeenCalledWith('00:15')
  },
}

export const Density: Story = {
  render: () => {
    const [t1, setT1] = useState<string | undefined>(undefined)
    const [t2, setT2] = useState<string | undefined>(undefined)
    const [t3, setT3] = useState<string | undefined>(undefined)
    return (
      <div className="flex flex-wrap items-start gap-6">
        <div className="w-44 space-y-1">
          <p className="text-xs text-fg-muted">compact</p>
          <TimePicker value={t1} onChange={setT1} density="compact" />
        </div>
        <div className="w-48 space-y-1">
          <p className="text-xs text-fg-muted">default</p>
          <TimePicker value={t2} onChange={setT2} density="default" />
        </div>
        <div className="w-52 space-y-1">
          <p className="text-xs text-fg-muted">loose</p>
          <TimePicker value={t3} onChange={setT3} density="loose" />
        </div>
      </div>
    )
  },
}
