import { Divider } from './Divider'
import anatomy from './Divider.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Stack } from '@/components/layout/Stack'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Divider> = {
  title: 'Components/Layout/Divider',
  component: Divider,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Divider>

export const Horizontal: Story = {
  render: () => (
    <Stack gap={4}>
      <div className="text-sm text-fg">Above</div>
      <Divider />
      <div className="text-sm text-fg">Below</div>
    </Stack>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <Stack gap={4}>
      <div className="text-sm text-fg">Section A</div>
      <Divider label="or" />
      <div className="text-sm text-fg">Section B</div>
    </Stack>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-4">
      <span className="text-sm text-fg">Left</span>
      <Divider orientation="vertical" />
      <span className="text-sm text-fg">Right</span>
    </div>
  ),
}
