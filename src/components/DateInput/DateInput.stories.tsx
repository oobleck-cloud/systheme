import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { DateInput } from './DateInput'
import anatomy from './DateInput.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'
import { birthDateDigitsToIso } from '@/utils/dateDigits'

const meta: Meta<typeof DateInput> = {
  title: 'Components/L1/DateInput',
  component: DateInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['default', 'error', 'success'] },
  },
  args: {
    size: 'md',
    onChange: fn(),
  },
  render: (args) => {
    const [digits, setDigits] = useState(args.value ?? '')
    const iso = birthDateDigitsToIso(digits)
    return (
      <div className="w-64 space-y-2">
        <DateInput
          {...args}
          value={digits}
          onChange={(v) => {
            args.onChange?.(v)
            setDigits(v)
          }}
        />
        <p className="text-xs text-fg-muted">digits: {digits || '(empty)'}</p>
        <p className="text-xs text-fg-muted">iso: {iso ?? '(incomplete)'}</p>
      </div>
    )
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DateInput>

export const Default: Story = {}

export const WithValue: Story = {
  args: { value: '20050103' },
}

export const FormatsWhileTyping: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '20050103')
    await expect(input).toHaveValue('2005-01-03')
  },
}

/** defaultValue만 제공 — onChange 없이도 자체적으로 포맷을 관리합니다. */
export const Uncontrolled: Story = {
  render: (args) => <DateInput {...args} defaultValue="19901215" />,
}
