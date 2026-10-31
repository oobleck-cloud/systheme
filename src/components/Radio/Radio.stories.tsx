import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { Radio } from './Radio'
import anatomy from './Radio.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Radio> = {
  title: 'Components/L1/Radio',
  component: Radio,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['default', 'error'] },
    disabled: { control: 'boolean' },
  },
  args: {
    label: '플랜 A',
    description: '월 $9 — 개인 사용자에게 적합',
    size: 'md',
    variant: 'default',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Radio>

export const Default: Story = {}

export const Group: Story = {
  render: () => {
    const [v, setV] = useState('a')
    return (
      <div className="flex flex-col gap-3">
        {(['a', 'b', 'c'] as const).map((opt) => (
          <Radio
            key={opt}
            name="plan"
            value={opt}
            checked={v === opt}
            onCheckedChange={(checked) => {
              if (checked) setV(opt)
            }}
            label={`플랜 ${opt.toUpperCase()}`}
          />
        ))}
      </div>
    )
  },
}

export const Disabled: Story = {
  args: { disabled: true, checked: true },
}

/**
 * Anatomy 검증 — control은 toggle intent. 클릭 시 checked가 true로 writes,
 * onCheckedChange emit. label 클릭으로도 동작해야 함(htmlFor 연결).
 */
export const SelectsOnClick: Story = {
  args: { name: 'test', value: 'opt1', onCheckedChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const radio = canvas.getByRole('radio')
    await expect(radio).not.toBeChecked()
    await userEvent.click(canvas.getByText('플랜 A'))
    await expect(args.onCheckedChange).toHaveBeenCalled()
    await expect(radio).toBeChecked()
  },
}
