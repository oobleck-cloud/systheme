import { markerSizeForDensity } from './timeline-density'
import anatomy from './TimelineItem.anatomy.json'
import { TimelineItemBoxed } from './TimelineItemBoxed'

import type { Meta, StoryObj } from '@storybook/react'

import { AccentStripe } from '@/components/AccentStripe'
import { Button } from '@/components/Button'
import { IconBox } from '@/components/IconBox'
import { Timeline } from '@/components/Timeline/Timeline'
import { TimelineMarker } from '@/components/TimelineMarker'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const CalendarGlyph = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden
  >
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" strokeLinecap="round" />
  </svg>
)

const CheckGlyph = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    aria-hidden
  >
    <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const meta: Meta<typeof TimelineItemBoxed> = {
  title: 'Components/L2/TimelineItem/Boxed',
  component: TimelineItemBoxed,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
  args: {
    density: 'default',
    timestamp: '11:19',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TimelineItemBoxed>

function buttonSizeForDensity(d: 'compact' | 'default' | 'loose'): 'sm' | 'md' {
  return d === 'loose' ? 'md' : 'sm'
}

export const Boxed: Story = {
  name: 'Boxed — with AccentStripe slots',
  render: (args) => {
    const d = args.density ?? 'default'
    const ms = markerSizeForDensity(d)
    const bs = buttonSizeForDensity(d)
    return (
      <TimelineItemBoxed
        {...args}
        density={d}
        marker={
          <IconBox shape="circle" size={ms} variant="info">
            <CalendarGlyph />
          </IconBox>
        }
        className="max-w-sm"
      >
        <AccentStripe emphasis="info" density={d}>
          <AccentStripe.Title>Meeting scheduled</AccentStripe.Title>
          <AccentStripe.Description className="mt-1">
            Conference Room B · May 28, 14:00
          </AccentStripe.Description>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size={bs} density={d} variant="outline">
              Reschedule
            </Button>
            <Button type="button" size={bs} density={d} variant="outline">
              Details
            </Button>
          </div>
        </AccentStripe>
      </TimelineItemBoxed>
    )
  },
}

export const BoxedInTimeline: Story = {
  name: 'Boxed — inside Timeline',
  args: { density: 'compact' },
  render: (args) => {
    const d = args.density ?? 'default'
    const ms = markerSizeForDensity(d)
    return (
      <Timeline density={d} className="max-w-sm">
        <TimelineItemBoxed
          timestamp="09:00"
          marker={<TimelineMarker appearance="dot" phase="complete" size={ms} />}
        >
          <AccentStripe emphasis="neutral" density={d}>
            <AccentStripe.Title>Prior milestone</AccentStripe.Title>
          </AccentStripe>
        </TimelineItemBoxed>
        <TimelineItemBoxed
          timestamp="09:30"
          marker={
            <IconBox shape="circle" size={ms} variant="success">
              <CheckGlyph />
            </IconBox>
          }
        >
          <AccentStripe emphasis="success" density={d}>
            <AccentStripe.Title>Checkpoint passed</AccentStripe.Title>
            <AccentStripe.Description className="mt-1">
              All checks completed successfully.
            </AccentStripe.Description>
          </AccentStripe>
        </TimelineItemBoxed>
      </Timeline>
    )
  },
}
