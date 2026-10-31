/**
 * L3 — Timeline compositions
 *
 * Layer map:
 *   L1  TimelineMarker, IconBox, Button, AccentStripe, DescriptionRow
 *   L2  TimelineItem.Inline, TimelineItem.Boxed
 *   L3  Timeline
 *
 * Typography inside AccentStripe cards uses compound slots:
 *   AccentStripe.Title / .Description / .Caption
 */
import { Timeline } from './Timeline'
import anatomy from './Timeline.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { AccentStripe } from '@/components/AccentStripe'
import { Button } from '@/components/Button'
import { DescriptionRow } from '@/components/DescriptionRow'
import { IconBox } from '@/components/IconBox'
import { TimelineItem, markerSizeForDensity } from '@/components/TimelineItem'
import { TimelineMarker } from '@/components/TimelineMarker'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

// ── Icon fragments ─────────────────────────────────────────────────────────

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

const SyncGlyph = () => (
  <svg
    className="h-3.5 w-3.5"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden
  >
    <path d="M13 8A5 5 0 0 1 3.5 11.3" strokeLinecap="round" />
    <path d="M3 8a5 5 0 0 1 9.5-2.3" strokeLinecap="round" />
    <path d="M1 9.5l2.5 2L6 8.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 6.5l-2.5-2L10 7.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function buttonSizeForDensity(d: 'compact' | 'default' | 'loose'): 'sm' | 'md' {
  return d === 'loose' ? 'md' : 'sm'
}

// ── Meta ───────────────────────────────────────────────────────────────────

const meta: Meta<typeof Timeline> = {
  title: 'Components/L3/Timeline',
  component: Timeline,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
  args: {
    density: 'default',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Timeline>

// ── ActivityFeed ───────────────────────────────────────────────────────────

export const ActivityFeed: Story = {
  render: (args) => {
    const d = args.density ?? 'default'
    const ms = markerSizeForDensity(d)
    const bs = buttonSizeForDensity(d)
    return (
      <Timeline density={d} className="max-w-xl">
        {/* Inline — simple log entries */}
        <TimelineItem.Inline
          timestamp="11:24"
          marker={<TimelineMarker appearance="dot" phase="neutral" size={ms} />}
        >
          <span className="font-medium text-fg">Record synced</span>
          <span className="text-fg-subtle"> — external service responded successfully.</span>
        </TimelineItem.Inline>

        <TimelineItem.Inline
          timestamp="11:22"
          marker={<TimelineMarker appearance="dot" phase="neutral" size={ms} />}
        >
          <span className="font-medium text-fg">Notification queued</span>
          <span className="text-fg-subtle"> — will be delivered on next batch run.</span>
        </TimelineItem.Inline>

        {/* Boxed — card with structured slots */}
        <TimelineItem.Boxed
          timestamp="11:19"
          marker={
            <IconBox shape="circle" size={ms} variant="info">
              <CalendarGlyph />
            </IconBox>
          }
        >
          <AccentStripe emphasis="info" density={d}>
            <AccentStripe.Title>Meeting scheduled</AccentStripe.Title>
            <div className="mt-2 flex flex-col gap-0.5">
              <DescriptionRow density={d} label="Attendee" value="Jane Smith" columns="fixed" />
              <DescriptionRow
                density={d}
                label="When"
                value="May 28 · 14:00 – 15:00"
                columns="fixed"
              />
              <DescriptionRow density={d} label="Where" value="Conference Room B" columns="fixed" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size={bs} density={d} variant="outline">
                Reschedule
              </Button>
              <Button type="button" size={bs} density={d} variant="outline">
                View details
              </Button>
            </div>
          </AccentStripe>
        </TimelineItem.Boxed>

        <TimelineItem.Inline
          timestamp="11:09"
          marker={<TimelineMarker appearance="dot" phase="pending" size={ms} />}
        >
          <span className="font-medium text-fg">Scheduling attempt failed</span>
          <span className="text-fg-subtle"> — will retry at next cycle.</span>
        </TimelineItem.Inline>

        <TimelineItem.Boxed
          timestamp="11:09"
          marker={
            <IconBox shape="circle" size={ms} variant="success">
              <CheckGlyph />
            </IconBox>
          }
        >
          <AccentStripe emphasis="success" density={d}>
            <AccentStripe.Title>Record accepted</AccentStripe.Title>
            <div className="mt-2 flex flex-col gap-0.5">
              <DescriptionRow density={d} label="Record ID" value="ORD-2024-0192" columns="fixed" />
              <DescriptionRow density={d} label="Due date" value="2024-05-31" columns="fixed" />
              <DescriptionRow density={d} label="Origin" value="Seoul, Branch A" columns="fixed" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size={bs} density={d} variant="outline">
                View record
              </Button>
              <Button type="button" size={bs} density={d} variant="destructive-outline">
                Cancel
              </Button>
            </div>
          </AccentStripe>
        </TimelineItem.Boxed>
      </Timeline>
    )
  },
}

// ── Stack ──────────────────────────────────────────────────────────────────

export const Stack: Story = {
  args: { density: 'compact' },
  render: (args) => {
    const d = args.density ?? 'compact'
    const ms = markerSizeForDensity(d)
    return (
      <Timeline density={d} className="max-w-sm">
        <TimelineItem.Inline
          timestamp="09:40"
          marker={<TimelineMarker appearance="dot" phase="complete" size={ms} />}
        >
          Build started
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="09:41"
          marker={<TimelineMarker appearance="dot" phase="complete" size={ms} />}
        >
          Dependencies installed
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="09:43"
          marker={<TimelineMarker appearance="dot" phase="active" size={ms} />}
        >
          <span className="font-medium">Running tests</span>
          <span className="text-fg-subtle"> (3 / 12 suites)</span>
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="—"
          marker={<TimelineMarker appearance="dot" phase="pending" size={ms} />}
        >
          <span className="text-fg-muted">Deploy to staging</span>
        </TimelineItem.Inline>
      </Timeline>
    )
  },
}

// ── MilestoneOnly ──────────────────────────────────────────────────────────

export const MilestoneOnly: Story = {
  render: (args) => {
    const d = args.density ?? 'default'
    const ms = markerSizeForDensity(d)
    return (
      <Timeline density={d} className="max-w-sm">
        <TimelineItem.Inline
          timestamp="09:00"
          marker={
            <TimelineMarker appearance="milestone" size={ms} phase="complete" showPhaseDot={false}>
              <CheckGlyph />
            </TimelineMarker>
          }
        >
          Project kickoff
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="10:30"
          marker={
            <TimelineMarker appearance="milestone" size={ms} phase="active" showPhaseDot={false}>
              <SyncGlyph />
            </TimelineMarker>
          }
        >
          <span className="font-medium">Data migration</span>
          <span className="text-fg-subtle"> — in progress</span>
        </TimelineItem.Inline>
        <TimelineItem.Inline
          timestamp="—"
          marker={
            <TimelineMarker appearance="milestone" size={ms} phase="pending" showPhaseDot={false} />
          }
        >
          <span className="text-fg-muted">QA review</span>
        </TimelineItem.Inline>
      </Timeline>
    )
  },
}
