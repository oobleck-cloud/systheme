import { expect, fn, userEvent, within } from '@storybook/test'

import { Textarea } from './Textarea'
import anatomy from './Textarea.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Textarea> = {
  title: 'Components/L1/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    resize: {
      control: 'select',
      options: ['none', 'vertical', 'both'],
    },
    disabled: { control: 'boolean' },
    readOnly: { control: 'boolean' },
    autoResize: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    variant: 'default',
    size: 'md',
    resize: 'vertical',
    placeholder: 'Enter text...',
    disabled: false,
    readOnly: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {}

export const WithError: Story = {
  args: {
    variant: 'error',
    placeholder: 'This field has an error',
  },
}

export const WithSuccess: Story = {
  args: {
    variant: 'success',
  },
}

export const ResizeVariants: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      <div>
        <p className="mb-1 text-xs text-fg-muted">resize: none</p>
        <Textarea {...args} resize="none" placeholder="resize: none" />
      </div>
      <div>
        <p className="mb-1 text-xs text-fg-muted">resize: vertical</p>
        <Textarea {...args} resize="vertical" placeholder="resize: vertical" />
      </div>
      <div>
        <p className="mb-1 text-xs text-fg-muted">resize: both</p>
        <Textarea {...args} resize="both" placeholder="resize: both" />
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      <Textarea {...args} size="sm" placeholder="Small" />
      <Textarea {...args} size="md" placeholder="Medium" />
      <Textarea {...args} size="lg" placeholder="Large" />
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
}

/** Chat-style composer: grows with content, scrolls once max-height is reached. */
export const AutoResize: Story = {
  args: {
    autoResize: true,
    rows: 1,
    placeholder: 'Enter: send, Shift+Enter: newline',
    className: 'max-h-32 min-h-10 rounded-2xl',
  },
}

export const AutoResizeMaxHeight: Story = {
  render: (args) => (
    <div className="w-96">
      <p className="mb-2 text-xs text-fg-muted">max-h-32 — 내용이 넘치면 세로 스크롤이 생깁니다.</p>
      <Textarea
        {...args}
        autoResize
        rows={1}
        className="max-h-32 min-h-10 rounded-2xl"
        defaultValue={
          '첫 줄\n둘째 줄\n셋째 줄\n넷째 줄\n다섯째 줄\n여섯째 줄\n일곱째 줄\n여덟째 줄'
        }
      />
    </div>
  ),
}

/**
 * Anatomy 검증 — root는 value-input, writes=value, emits=onValueChange.
 * 입력 시 onValueChange 호출, error variant는 aria-invalid 자동 적용.
 */
export const ValueInputContract: Story = {
  args: { onValueChange: fn(), placeholder: 'type here' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const ta = canvas.getByPlaceholderText('type here') as HTMLTextAreaElement
    await userEvent.type(ta, '안녕')
    await expect(args.onValueChange).toHaveBeenCalled()
    await expect(ta.value).toBe('안녕')
  },
}

export const ErrorVariantSetsAriaInvalid: Story = {
  args: { variant: 'error', placeholder: 'error' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const ta = canvas.getByPlaceholderText('error')
    await expect(ta).toHaveAttribute('aria-invalid', 'true')
  },
}
