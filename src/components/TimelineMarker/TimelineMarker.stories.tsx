import { TimelineMarker } from './TimelineMarker'
import anatomy from './TimelineMarker.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TimelineMarker> = {
  title: 'Components/L1/TimelineMarker',
  component: TimelineMarker,
  tags: ['autodocs'],
  argTypes: {
    phase: { control: 'select', options: ['pending', 'active', 'complete', 'neutral'] },
    appearance: { control: 'select', options: ['dot', 'milestone'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
  args: {
    appearance: 'milestone',
    phase: 'active',
    size: 'md',
    density: 'default',
    glyph: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M3 8l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TimelineMarker>

export const Default: Story = {}

export const Phases: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <TimelineMarker appearance="milestone" phase="pending" />
      <TimelineMarker appearance="milestone" phase="active" />
      <TimelineMarker appearance="milestone" phase="complete" />
      <TimelineMarker appearance="milestone" phase="neutral" />
    </div>
  ),
}

export const DotsOnSpine: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <TimelineMarker appearance="dot" phase="neutral" size="md" />
      <TimelineMarker appearance="dot" phase="complete" size="md" />
      <TimelineMarker appearance="dot" phase="active" size="md" />
    </div>
  ),
}
