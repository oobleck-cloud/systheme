import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { PhoneNumberInput } from './PhoneNumberInput'
import anatomy from './PhoneNumberInput.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof PhoneNumberInput> = {
  title: 'Components/L1/PhoneNumberInput',
  component: PhoneNumberInput,
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
    return (
      <div className="w-64 space-y-2">
        <PhoneNumberInput
          {...args}
          value={digits}
          onChange={(v) => {
            args.onChange?.(v)
            setDigits(v)
          }}
        />
        <p className="text-xs text-fg-muted">digits: {digits || '(empty)'}</p>
      </div>
    )
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof PhoneNumberInput>

export const Default: Story = {}

export const WithValue: Story = {
  args: { value: '01012345678' },
}

export const FormatsWhileTyping: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '01012345678')
    await expect(input).toHaveValue('010-1234-5678')
  },
}
