import { expect, fn, userEvent, within } from '@storybook/test'

import { Input } from './Input'
import anatomy from './Input.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const SearchIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" strokeLinecap="round" />
  </svg>
)

const AtIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="8" cy="8" r="3" />
    <path d="M11 8c0 2.21.89 4 2 4s2-1.79 2-4a7 7 0 1 0-2 4.9" strokeLinecap="round" />
  </svg>
)

const meta: Meta<typeof Input> = {
  title: 'Components/L1/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'error', 'success'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    variant: 'default',
    size: 'md',
    placeholder: 'Placeholder',
    disabled: false,
    readOnly: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-3">
      <Input {...args} variant="default" placeholder="Default" />
      <Input {...args} variant="error" placeholder="Error" />
      <Input {...args} variant="success" placeholder="Success" />
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-72 flex-col gap-3">
      <Input {...args} size="sm" placeholder="Small" />
      <Input {...args} size="md" placeholder="Medium" />
      <Input {...args} size="lg" placeholder="Large" />
    </div>
  ),
}

export const WithPrefix: Story = {
  args: { prefix: <SearchIcon />, placeholder: 'Search...' },
}

export const WithSuffix: Story = {
  args: { suffix: <AtIcon />, placeholder: 'Email' },
}

export const WithBoth: Story = {
  args: {
    prefix: <SearchIcon />,
    suffix: <span className="text-xs text-fg-muted">⌘K</span>,
    placeholder: 'Search...',
  },
}

export const Disabled: Story = {
  args: { disabled: true, value: 'Disabled value' },
}

export const ReadOnly: Story = {
  args: { readOnly: true, value: 'Read-only value' },
}

/**
 * Anatomy 검증: `input.intent = value-input`, `writes = value`, `emits = onValueChange`.
 * 사용자가 키를 누르면 onValueChange 핸들러가 호출되어야 한다.
 */
export const ValueInputContract: Story = {
  args: { onValueChange: fn(), placeholder: '입력 테스트' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('입력 테스트') as HTMLInputElement
    await userEvent.type(input, '안녕')
    await expect(args.onValueChange).toHaveBeenCalled()
    // controlled가 아닌 uncontrolled이므로 native value만 확인
    await expect(input.value).toBe('안녕')
  },
}

/**
 * variant=error 일 때 aria-invalid 가 자동으로 적용 — 에러 상태 시각화와 별개로
 * 스크린리더 사용자에게도 잘못된 값임이 전달되어야 함.
 */
export const ErrorVariantSetsAriaInvalid: Story = {
  args: { variant: 'error', placeholder: 'invalid' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('invalid')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  },
}

export const DisabledRejectsTyping: Story = {
  args: { disabled: true, onValueChange: fn(), placeholder: 'disabled' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('disabled') as HTMLInputElement
    await expect(input).toBeDisabled()
    await userEvent.type(input, 'x')
    await expect(args.onValueChange).not.toHaveBeenCalled()
  },
}
