import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import anatomy from './Radio.anatomy.json'
import { RadioGroup, type RadioGroupOption } from './RadioGroup'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const options: RadioGroupOption[] = [
  { value: 'free', label: '무료', description: '월 0원' },
  { value: 'pro', label: 'Pro', description: '월 9,900원' },
  { value: 'team', label: '팀', description: '월 39,900원' },
]

const meta: Meta<typeof RadioGroup> = {
  title: 'Components/L1/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: {
    options,
    legend: '플랜',
    orientation: 'vertical',
    onChange: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {}

export const Horizontal: Story = {
  args: { orientation: 'horizontal' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'pro' },
}

/**
 * RadioGroup 계약 — 한 번에 한 옵션만 선택, 다른 옵션 클릭 시 이전 선택 해제.
 */
export const SingleSelectionContract: Story = {
  render: (args) => {
    const [v, setV] = useState('free')
    return (
      <RadioGroup
        {...args}
        value={v}
        onChange={(next) => {
          args.onChange?.(next)
          setV(next)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const radios = canvas.getAllByRole('radio')
    await expect(radios.length).toBe(3)

    // 초기: free 선택됨
    await expect(radios[0]).toBeChecked()

    // pro 클릭 → free 해제, pro 선택
    await userEvent.click(canvas.getByText('Pro'))
    await expect(args.onChange).toHaveBeenCalledWith('pro')
    await expect(radios[1]).toBeChecked()
    await expect(radios[0]).not.toBeChecked()
  },
}
