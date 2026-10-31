import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { BirthDateScrollPicker } from './BirthDateScrollPicker'
import anatomy from './BirthDateScrollPicker.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'
import { formatBirthDateDisplay } from '@/utils/dateDigits'

const meta: Meta<typeof BirthDateScrollPicker> = {
  title: 'Components/L3/BirthDateScrollPicker',
  component: BirthDateScrollPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['default', 'error', 'success'] },
    density: { control: 'inline-radio', options: ['compact', 'default', 'loose'] },
  },
  args: {
    size: 'md',
    onChange: fn(),
    minYear: 1900,
    maxYear: 2026,
  },
  render: (args) => {
    const [digits, setDigits] = useState(args.value ?? '')
    return (
      <div className="w-72 space-y-2">
        <BirthDateScrollPicker
          {...args}
          value={digits}
          onChange={(v) => {
            args.onChange?.(v)
            setDigits(v)
          }}
        />
        <p className="text-xs text-fg-muted">
          value: {digits ? formatBirthDateDisplay(digits) : '(empty)'} ({digits || '—'})
        </p>
      </div>
    )
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof BirthDateScrollPicker>

export const Default: Story = {}

export const WithValue: Story = {
  args: { value: '19900115' },
}

export const OpensWheelPanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '생년월일' }))
    await expect(canvas.getByRole('dialog', { name: '생년월일 선택' })).toBeInTheDocument()
    await expect(canvas.getByRole('listbox', { name: '년' })).toBeInTheDocument()
  },
}

export const MobileSheet: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '생년월일' }))
    const confirm = await canvas.findByRole('button', { name: '확인' })
    await expect(confirm).toBeInTheDocument()
  },
}
