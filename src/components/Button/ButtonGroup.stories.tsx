import { Button } from './Button'
import { ButtonGroup } from './ButtonGroup'
import anatomy from './ButtonGroup.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ButtonGroup> = {
  title: 'Components/L2/ButtonGroup',
  component: ButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'select', options: ['horizontal', 'vertical'] },
    gap: { control: 'select', options: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16] },
    endShape: { control: 'select', options: ['none', 'md', 'full'] },
  },
  args: {
    orientation: 'horizontal',
    gap: 0,
    endShape: 'md',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ButtonGroup>

export const Default: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">One</Button>
      <Button variant="outline">Two</Button>
      <Button variant="outline">Three</Button>
    </ButtonGroup>
  ),
}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary">Top</Button>
      <Button variant="secondary">Middle</Button>
      <Button variant="secondary">Bottom</Button>
    </ButtonGroup>
  ),
}

export const SquareEnds: Story = {
  name: 'Square ends',
  args: { endShape: 'none' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">A</Button>
      <Button variant="outline">B</Button>
    </ButtonGroup>
  ),
}

export const PillEnds: Story = {
  name: 'Pill ends (full)',
  args: { endShape: 'full' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
}

export const WithGap: Story = {
  name: 'With gap (Stack scale)',
  args: { gap: 2 },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">A</Button>
      <Button variant="outline">B</Button>
      <Button variant="outline">C</Button>
    </ButtonGroup>
  ),
}

export const WithGapPillEnds: Story = {
  name: 'Gap + pill ends',
  args: { gap: 2, endShape: 'full' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="secondary">One</Button>
      <Button variant="secondary">Two</Button>
    </ButtonGroup>
  ),
}

export const Connected: Story = {
  name: 'Connected box',
  args: { connected: true, boxSize: 'md' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Left</Button>
      <Button variant="primary">Right</Button>
    </ButtonGroup>
  ),
}

export const SingleChild: Story = {
  name: 'Single child',
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="primary">Only</Button>
    </ButtonGroup>
  ),
}

export const SingleChildPill: Story = {
  name: 'Single child · pill',
  args: { endShape: 'full' },
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="primary">Only</Button>
    </ButtonGroup>
  ),
}
