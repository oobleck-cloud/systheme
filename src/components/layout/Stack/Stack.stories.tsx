import { Stack } from './Stack'
import anatomy from './Stack.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const Box = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-10 min-w-10 items-center justify-center rounded-md bg-brand-100 px-3 text-sm font-medium text-primary">
    {children}
  </div>
)

const meta: Meta<typeof Stack> = {
  title: 'Components/Layout/Stack',
  component: Stack,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Stack>

export const Vertical: Story = {
  render: () => (
    <Stack gap={3}>
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Stack>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap={3} align="center">
      <Box>Item 1</Box>
      <Box>Item 2</Box>
      <Box>Item 3</Box>
    </Stack>
  ),
}

export const SpaceBetween: Story = {
  render: () => (
    <Stack direction="horizontal" justify="between" align="center">
      <Box>Left</Box>
      <Box>Right</Box>
    </Stack>
  ),
}

export const Wrapped: Story = {
  render: () => (
    <div className="w-64">
      <Stack direction="horizontal" gap={2} wrap>
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i}>Item {i + 1}</Box>
        ))}
      </Stack>
    </div>
  ),
}
