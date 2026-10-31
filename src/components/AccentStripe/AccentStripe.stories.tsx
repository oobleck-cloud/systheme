import { AccentStripe } from './AccentStripe'
import anatomy from './AccentStripe.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof AccentStripe> = {
  title: 'Components/L1/AccentStripe',
  component: AccentStripe,
  tags: ['autodocs'],
  argTypes: {
    emphasis: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error', 'primary', 'neutral'],
    },
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
  args: {
    emphasis: 'info',
    density: 'default',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof AccentStripe>

// ── Default ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: (args) => (
    <AccentStripe {...args} className="max-w-sm">
      <AccentStripe.Title>Panel heading</AccentStripe.Title>
      <AccentStripe.Description className="mt-1">
        Left stripe communicates category or status at a glance.
      </AccentStripe.Description>
    </AccentStripe>
  ),
}

// ── Slot showcase ─────────────────────────────────────────────────────────────

export const AllSlots: Story = {
  render: (args) => (
    <AccentStripe {...args} className="max-w-sm">
      <AccentStripe.Title>Title slot</AccentStripe.Title>
      <AccentStripe.Description className="mt-1">
        Description slot — supporting detail about the event or item.
      </AccentStripe.Description>
      <AccentStripe.Caption className="mt-2">
        Caption slot — footnote or secondary metadata.
      </AccentStripe.Caption>
    </AccentStripe>
  ),
}

// ── All emphasis values ───────────────────────────────────────────────────────

export const EmphasisRow: Story = {
  render: (args) => (
    <div className="flex max-w-xl flex-col gap-3">
      {(['info', 'success', 'warning', 'error', 'primary', 'neutral'] as const).map((e) => (
        <AccentStripe key={e} {...args} emphasis={e}>
          <AccentStripe.Title>{e.charAt(0).toUpperCase() + e.slice(1)}</AccentStripe.Title>
          <AccentStripe.Description className="mt-0.5">
            Supporting text for the {e} emphasis variant.
          </AccentStripe.Description>
        </AccentStripe>
      ))}
    </div>
  ),
}

// ── Slot className override ───────────────────────────────────────────────────

export const SlotClassNameOverride: Story = {
  name: 'Slot className override',
  render: (args) => (
    <AccentStripe {...args} emphasis="error" className="max-w-sm">
      {/* className is merged on top of the slot default via twMerge */}
      <AccentStripe.Title className="text-error-text">Error: validation failed</AccentStripe.Title>
      <AccentStripe.Description className="mt-1 text-fg">
        Check the highlighted fields and resubmit.
      </AccentStripe.Description>
    </AccentStripe>
  ),
}
