import { Spinner } from './Spinner'
import anatomy from './Spinner.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Spinner> = {
  title: 'Components/L1/Spinner',
  component: Spinner,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {
    accessibilityLabel: '불러오는 중',
  },
}

export const Inactive: Story = {
  args: {
    active: false,
    accessibilityLabel: '대기',
  },
}
