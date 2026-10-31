import { expect, fn, userEvent, within } from '@storybook/test'

import { IconButton } from './IconButton'
import anatomy from './IconButton.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const StarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-[45%] w-[45%]">
    <path d="M8 1l1.85 3.75L14 5.4l-3 2.92.71 4.13L8 10.35l-3.71 2.1.71-4.13L2 5.4l4.15-.65L8 1z" />
  </svg>
)

const EditIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-[45%] w-[45%]"
  >
    <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" strokeLinejoin="round" />
  </svg>
)

const TrashIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-[45%] w-[45%]"
  >
    <path d="M3 4h10M6 4V2h4v2M5 4v9h6V4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const PlusIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="h-[45%] w-[45%]"
  >
    <path d="M8 3v10M3 8h10" strokeLinecap="round" />
  </svg>
)

const meta: Meta<typeof IconButton> = {
  title: 'Components/L1/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'destructive-outline'],
    },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'select', options: ['circle', 'rounded', 'square'] },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    'aria-label': 'action',
    variant: 'ghost',
    size: 'md',
    shape: 'rounded',
    isLoading: false,
    disabled: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof IconButton>

export const Default: Story = {
  args: { children: <EditIcon />, 'aria-label': 'Edit' },
}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton {...args} variant="primary" aria-label="add">
        <PlusIcon />
      </IconButton>
      <IconButton {...args} variant="secondary" aria-label="add">
        <PlusIcon />
      </IconButton>
      <IconButton {...args} variant="outline" aria-label="edit">
        <EditIcon />
      </IconButton>
      <IconButton {...args} variant="ghost" aria-label="edit">
        <EditIcon />
      </IconButton>
      <IconButton {...args} variant="destructive" aria-label="delete">
        <TrashIcon />
      </IconButton>
      <IconButton {...args} variant="destructive-outline" aria-label="delete">
        <TrashIcon />
      </IconButton>
    </div>
  ),
}

export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <IconButton {...args} shape="circle" aria-label="star">
        <StarIcon />
      </IconButton>
      <IconButton {...args} shape="rounded" aria-label="star">
        <StarIcon />
      </IconButton>
      <IconButton {...args} shape="square" aria-label="star">
        <StarIcon />
      </IconButton>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      <IconButton {...args} size="xs" aria-label="edit">
        <EditIcon />
      </IconButton>
      <IconButton {...args} size="sm" aria-label="edit">
        <EditIcon />
      </IconButton>
      <IconButton {...args} size="md" aria-label="edit">
        <EditIcon />
      </IconButton>
      <IconButton {...args} size="lg" aria-label="edit">
        <EditIcon />
      </IconButton>
      <IconButton {...args} size="xl" aria-label="edit">
        <EditIcon />
      </IconButton>
    </div>
  ),
}

export const ShapesAndVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['circle', 'rounded', 'square'] as const).map((shape) => (
        <div key={shape} className="flex items-center gap-3">
          <span className="w-16 text-xs text-fg-muted">{shape}</span>
          <IconButton {...args} shape={shape} variant="primary" aria-label="add">
            <PlusIcon />
          </IconButton>
          <IconButton {...args} shape={shape} variant="secondary" aria-label="add">
            <PlusIcon />
          </IconButton>
          <IconButton {...args} shape={shape} variant="outline" aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton {...args} shape={shape} variant="ghost" aria-label="edit">
            <EditIcon />
          </IconButton>
          <IconButton {...args} shape={shape} variant="destructive" aria-label="delete">
            <TrashIcon />
          </IconButton>
          <IconButton {...args} shape={shape} variant="destructive-outline" aria-label="delete">
            <TrashIcon />
          </IconButton>
        </div>
      ))}
    </div>
  ),
}

export const Loading: Story = {
  args: { isLoading: true, 'aria-label': 'Loading' },
}

export const Disabled: Story = {
  args: { disabled: true, children: <EditIcon />, 'aria-label': 'Edit' },
}

/**
 * Anatomy 검증 — root는 press-action. 클릭 시 onClick 호출, aria-label은
 * 시각적 라벨이 없는 IconButton의 핵심 a11y 계약(필수).
 */
export const PressActionContract: Story = {
  args: { children: <EditIcon />, 'aria-label': 'Edit', onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const btn = canvas.getByRole('button', { name: 'Edit' })
    await userEvent.click(btn)
    await expect(args.onClick).toHaveBeenCalled()
  },
}
