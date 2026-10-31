import { TableStackedText } from './TableStackedText'
import anatomy from './TableStackedText.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableStackedText> = {
  title: 'Components/L2/Table/TableStackedText',
  component: TableStackedText,
  tags: ['autodocs'],
  args: {
    primary: '2026.05.19',
    secondary: '오전 10:38',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableStackedText>

export const Default: Story = {}

export const PrimaryOnly: Story = {
  args: { primary: '2026.05.19', secondary: undefined },
}

export const LongLabels: Story = {
  args: {
    primary: '2026.05.19 (월)',
    secondary: '근무 11:02 ~ 18:30',
  },
}
