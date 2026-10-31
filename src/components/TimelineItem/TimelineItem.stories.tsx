/**
 * L2 — TimelineItem.Inline stories.
 *
 * Boxed: `Components/TimelineItem/Boxed`
 * Compositions: `Components/Timeline`
 */
import { markerSizeForDensity } from './timeline-density'
import anatomy from './TimelineItem.anatomy.json'

import { TimelineItem, TimelineItemInline } from '.'

import type { Meta, StoryObj } from '@storybook/react'

import { Timeline } from '@/components/Timeline/Timeline'
import { TimelineMarker } from '@/components/TimelineMarker'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const inlineMeta: Meta<typeof TimelineItemInline> = {
  title: 'Components/L2/TimelineItem/Inline',
  component: TimelineItemInline,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
  args: {
    timestamp: '09:42',
    density: 'default',
    marker: <TimelineMarker appearance="dot" phase="neutral" size="md" />,
    children: 'Record synced with external service.',
  },
}

mergeAnatomyMeta(inlineMeta, anatomy as Record<string, unknown>)

export default inlineMeta
type InlineStory = StoryObj<typeof TimelineItemInline>

export const Inline: InlineStory = {
  render: (args) => {
    const d = args.density ?? 'default'
    const ms = markerSizeForDensity(d)
    return (
      <TimelineItemInline
        {...args}
        density={d}
        marker={<TimelineMarker appearance="dot" phase="neutral" size={ms} />}
      />
    )
  },
}

export const InlineInTimeline: InlineStory = {
  name: 'Inline — inside Timeline (with spine)',
  args: { density: 'default' },
  render: (args) => {
    const d = args.density ?? 'default'
    const ms = markerSizeForDensity(d)
    return (
      <Timeline density={d} className="max-w-md">
        <TimelineItem.Inline
          timestamp="09:40"
          marker={<TimelineMarker appearance="dot" phase="complete" size={ms} />}
        >
          Step one completed
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="09:42"
          marker={<TimelineMarker appearance="dot" phase="active" size={ms} />}
        >
          <span className="font-medium">Step two in progress</span>
          <span className="text-fg-subtle"> — awaiting response.</span>
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="—"
          marker={<TimelineMarker appearance="dot" phase="pending" size={ms} />}
        >
          <span className="text-fg-muted">Step three pending</span>
        </TimelineItem.Inline>
      </Timeline>
    )
  },
}
