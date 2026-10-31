import { expect, within } from '@storybook/test'

import { FormField } from './FormField'
import anatomy from './FormField.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Input } from '@/components/Input'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof FormField> = {
  title: 'Components/L1/FormField',
  component: FormField,
  tags: ['autodocs'],
  argTypes: {
    required: { control: 'boolean' },
  },
  args: {
    label: '이메일',
    required: false,
    helper: '계정 인증에 사용됩니다.',
  },
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="hello@example.com" />
    </FormField>
  ),
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof FormField>

export const Default: Story = {}

export const Required: Story = {
  args: { required: true },
}

export const WithError: Story = {
  args: { error: '올바른 이메일 형식이 아닙니다.' },
}

/**
 * Anatomy 검증 — root는 field-rhythm, error 슬롯은 status-message + role="alert".
 * error가 있으면 helper는 가려지고 error만 노출. aria-invalid가 control 래퍼에 적용됨.
 */
export const ErrorOverridesHelper: Story = {
  args: { helper: '도움말 텍스트', error: '에러 메시지' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByText('도움말 텍스트')).toBeNull()
    await expect(canvas.getByRole('alert').textContent).toBe('에러 메시지')
    const control = canvasElement.querySelector('[data-slot="form-field-control"]')
    await expect(control).toHaveAttribute('aria-invalid', 'true')
  },
}

export const HelperLinkedByAria: Story = {
  args: { helper: '5자 이상 입력' },
  play: async ({ canvasElement }) => {
    const helper = canvasElement.querySelector('[data-slot="form-field-helper"]')
    const control = canvasElement.querySelector('[data-slot="form-field-control"]')
    await expect(helper).not.toBeNull()
    await expect(control).toHaveAttribute('aria-describedby', helper!.id)
  },
}
