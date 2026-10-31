import { TextBox } from './TextBox'
import anatomy from './TextBox.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TextBox> = {
  title: 'Components/L1/TextBox',
  component: TextBox,
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'select', options: ['circle', 'rounded', 'square'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    },
    children: { control: 'text' },
  },
  args: { shape: 'circle', size: 'md', variant: 'default', children: 'AB' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TextBox>

export const Default: Story = {}

export const Initials: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <TextBox {...args}>JD</TextBox>
      <TextBox {...args}>AB</TextBox>
      <TextBox {...args}>이</TextBox>
      <TextBox {...args}>홍</TextBox>
    </div>
  ),
}

export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <TextBox {...args} shape="circle">
        JD
      </TextBox>
      <TextBox {...args} shape="rounded">
        JD
      </TextBox>
      <TextBox {...args} shape="square">
        JD
      </TextBox>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      <TextBox {...args} size="xs">
        AB
      </TextBox>
      <TextBox {...args} size="sm">
        AB
      </TextBox>
      <TextBox {...args} size="md">
        AB
      </TextBox>
      <TextBox {...args} size="lg">
        AB
      </TextBox>
      <TextBox {...args} size="xl">
        AB
      </TextBox>
    </div>
  ),
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {(['default', 'primary', 'success', 'warning', 'error', 'info'] as const).map((variant) => (
        <TextBox key={variant} {...args} variant={variant}>
          JD
        </TextBox>
      ))}
    </div>
  ),
}
