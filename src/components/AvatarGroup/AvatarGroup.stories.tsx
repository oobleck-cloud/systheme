import { expect, within } from '@storybook/test'

import { AvatarGroup, type AvatarGroupItem } from './AvatarGroup'
import anatomy from './AvatarGroup.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const sampleAvatars: AvatarGroupItem[] = [
  { name: 'Alice Kim' },
  { name: 'Bob Lee' },
  { name: 'Carol Park' },
  { name: 'Dan Choi' },
  { name: 'Eve Han' },
  { name: 'Frank Yoo' },
]

const meta: Meta<typeof AvatarGroup> = {
  title: 'Components/L1/AvatarGroup',
  component: AvatarGroup,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    shape: { control: 'inline-radio', options: ['circle', 'rounded', 'square'] },
    spacing: { control: 'inline-radio', options: ['tight', 'default'] },
    maxCount: { control: { type: 'number', min: 1, max: 10 } },
  },
  args: {
    avatars: sampleAvatars,
    maxCount: 4,
    size: 'sm',
    shape: 'circle',
    spacing: 'tight',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof AvatarGroup>

export const Default: Story = {}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <AvatarGroup key={size} {...args} size={size} />
      ))}
    </div>
  ),
}

export const NoOverflow: Story = {
  args: { avatars: sampleAvatars.slice(0, 3), maxCount: 4 },
}

/**
 * Anatomy 검증 — overflow-badge는 `avatars.length - maxCount > 0`일 때만 노출.
 * +N 텍스트가 정확하고 aria-label로 스크린리더에 알려져야 한다.
 */
export const OverflowContract: Story = {
  args: { avatars: sampleAvatars, maxCount: 3 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 표시되는 avatar는 maxCount(=3)개
    const items = canvasElement.querySelectorAll('[data-slot="avatar-group-item"]')
    await expect(items.length).toBe(3)

    // overflow는 6 - 3 = 3
    const overflow = canvasElement.querySelector('[data-slot="avatar-group-overflow"]')
    await expect(overflow).not.toBeNull()
    await expect(overflow).toHaveAttribute('aria-label', '외 3명')
    await expect(canvas.getByText('+3')).toBeInTheDocument()
  },
}

export const NoOverflowHidesBadge: Story = {
  args: { avatars: sampleAvatars.slice(0, 2), maxCount: 4 },
  play: async ({ canvasElement }) => {
    const overflow = canvasElement.querySelector('[data-slot="avatar-group-overflow"]')
    await expect(overflow).toBeNull()
  },
}
