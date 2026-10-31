import { Skeleton } from './Skeleton'
import anatomy from './Skeleton.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Skeleton> = {
  title: 'Components/L1/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  args: { lines: 4 },
}
