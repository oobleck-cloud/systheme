import { IconBox } from './IconBox'
import anatomy from './IconBox.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const StarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-[55%] w-[55%]">
    <path d="M8 1l1.85 3.75L14 5.4l-3 2.92.71 4.13L8 10.35l-3.71 2.1.71-4.13L2 5.4l4.15-.65L8 1z" />
  </svg>
)

const BellIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    className="h-[55%] w-[55%]"
  >
    <path
      d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2.25L2 10h12l-1.5-1.75V6A4.5 4.5 0 0 0 8 1.5z"
      strokeLinejoin="round"
    />
    <path d="M6.5 10v.5a1.5 1.5 0 0 0 3 0V10" strokeLinecap="round" />
  </svg>
)

const CheckIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-[55%] w-[55%]"
  >
    <path d="M3 8l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const meta: Meta<typeof IconBox> = {
  title: 'Components/L1/IconBox',
  component: IconBox,
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'select', options: ['circle', 'rounded', 'square'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    },
  },
  args: { shape: 'circle', size: 'md', variant: 'default' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof IconBox>

export const Default: Story = {
  args: { children: <StarIcon /> },
}

export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconBox {...args} shape="circle">
        {' '}
        <StarIcon />
      </IconBox>
      <IconBox {...args} shape="rounded">
        {' '}
        <StarIcon />
      </IconBox>
      <IconBox {...args} shape="square">
        {' '}
        <StarIcon />
      </IconBox>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      <IconBox {...args} size="xs">
        <BellIcon />
      </IconBox>
      <IconBox {...args} size="sm">
        <BellIcon />
      </IconBox>
      <IconBox {...args} size="md">
        <BellIcon />
      </IconBox>
      <IconBox {...args} size="lg">
        <BellIcon />
      </IconBox>
      <IconBox {...args} size="xl">
        <BellIcon />
      </IconBox>
    </div>
  ),
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <IconBox {...args} variant="default">
        {' '}
        <StarIcon />
      </IconBox>
      <IconBox {...args} variant="primary">
        {' '}
        <StarIcon />
      </IconBox>
      <IconBox {...args} variant="success">
        {' '}
        <CheckIcon />
      </IconBox>
      <IconBox {...args} variant="warning">
        {' '}
        <BellIcon />
      </IconBox>
      <IconBox {...args} variant="error">
        {' '}
        <BellIcon />
      </IconBox>
      <IconBox {...args} variant="info">
        {' '}
        <BellIcon />
      </IconBox>
    </div>
  ),
}

export const ShapesAndVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['circle', 'rounded', 'square'] as const).map((shape) => (
        <div key={shape} className="flex items-center gap-3">
          <span className="w-16 text-xs text-fg-muted">{shape}</span>
          {(['default', 'primary', 'success', 'warning', 'error', 'info'] as const).map(
            (variant) => (
              <IconBox key={variant} {...args} shape={shape} variant={variant}>
                <StarIcon />
              </IconBox>
            ),
          )}
        </div>
      ))}
    </div>
  ),
}
