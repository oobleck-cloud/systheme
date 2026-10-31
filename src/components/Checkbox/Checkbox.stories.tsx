import { expect, fn, userEvent, within } from '@storybook/test'

import { Checkbox } from './Checkbox'
import anatomy from './Checkbox.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Checkbox> = {
  title: 'Components/L1/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'error', 'success'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    indeterminate: { control: 'boolean' },
  },
  args: {
    variant: 'default',
    size: 'md',
    disabled: false,
    indeterminate: false,
    label: '동의합니다',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Checkbox>

export const Default: Story = {}

export const WithDescription: Story = {
  args: {
    label: '마케팅 수신',
    description: '이메일로 프로모션 소식을 받습니다. 언제든 설정에서 끌 수 있습니다.',
  },
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} variant="default" label="Default" />
      <Checkbox {...args} variant="error" label="Error" description="필수 항목입니다." />
      <Checkbox {...args} variant="success" label="Success" />
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <Checkbox {...args} size="sm" label="Small" />
      <Checkbox {...args} size="md" label="Medium" />
      <Checkbox {...args} size="lg" label="Large" />
    </div>
  ),
}

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
    checked: false,
    label: '일부 하위 항목만 선택됨',
  },
}

export const Solo: Story = {
  args: {
    label: undefined,
    description: undefined,
    'aria-label': '알림 받기',
  },
}

/**
 * Anatomy 검증 — control은 toggle intent, writes=checked, emits=onCheckedChange.
 * 클릭 시 onCheckedChange 호출 + DOM checkbox의 aria 상태가 동기화되어야 함.
 */
export const TogglesCheckedState: Story = {
  args: { onCheckedChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')
    await expect(checkbox).not.toBeChecked()
    await userEvent.click(canvas.getByText('동의합니다'))
    await expect(args.onCheckedChange).toHaveBeenCalled()
    await expect(checkbox).toBeChecked()
  },
}

export const ErrorVariantSetsAriaInvalid: Story = {
  args: { variant: 'error', label: '필수' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')
    await expect(checkbox).toHaveAttribute('aria-invalid', 'true')
  },
}
