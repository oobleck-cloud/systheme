import { Grid } from './Grid'
import anatomy from './Grid.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const Cell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-12 items-center justify-center rounded-md bg-brand-100 text-sm font-medium text-primary">
    {children}
  </div>
)

const meta: Meta<typeof Grid> = {
  title: 'Components/Layout/Grid',
  component: Grid,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Grid>

export const ThreeColumns: Story = {
  render: () => (
    <Grid cols={3} gap={4}>
      {Array.from({ length: 6 }, (_, i) => (
        <Cell key={i}>Cell {i + 1}</Cell>
      ))}
    </Grid>
  ),
}

export const TwoColumns: Story = {
  render: () => (
    <Grid cols={2} gapX={6} gapY={4}>
      {Array.from({ length: 4 }, (_, i) => (
        <Cell key={i}>Cell {i + 1}</Cell>
      ))}
    </Grid>
  ),
}

export const Responsive: Story = {
  render: () => (
    <Grid cols={4} gap={3}>
      {Array.from({ length: 8 }, (_, i) => (
        <Cell key={i}>Cell {i + 1}</Cell>
      ))}
    </Grid>
  ),
}
