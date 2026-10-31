import { expect, fn, userEvent, within } from '@storybook/test'

import { FilterChipGroup } from './FilterChipGroup'
import anatomy from './FilterChipGroup.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const sampleOptions = [
  { id: 'a', label: 'Received' },
  { id: 'b', label: 'Scheduled' },
  { id: 'c', label: 'Closed' },
]

const meta: Meta<typeof FilterChipGroup> = {
  title: 'Components/L2/FilterChipGroup',
  component: FilterChipGroup,
  tags: ['autodocs'],
  args: {
    options: sampleOptions,
    value: ['a'],
    onChange: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof FilterChipGroup>

export const Default: Story = {}

export const AllSelected: Story = {
  args: {
    value: sampleOptions.map((o) => o.id),
  },
}

export const ToggleEmitsChange: Story = {
  play: async ({ canvasElement, args }) => {
    const chips = within(canvasElement).getAllByRole('button')
    await userEvent.click(chips[1]!)
    expect(args.onChange).toHaveBeenCalled()
  },
}

/** 첫 칩 클릭(toggle) → onChange */
export const AnatomyFirstChipToggle: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    chip: { onToggle: 'onChange' },
    label: { skip: true },
  }),
}
