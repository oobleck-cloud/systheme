import { fn } from '@storybook/test'

import { MapEmbedSlot } from './MapEmbedSlot'
import anatomy from './MapEmbedSlot.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof MapEmbedSlot> = {
  title: 'Components/L3/MapEmbedSlot',
  component: MapEmbedSlot,
  tags: ['autodocs'],
  args: {
    isMapReady: false,
    errorMessage: '',
    attributionText: '© Map data',
    onRecenterRequest: fn(),
    onRetryLoad: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MapEmbedSlot>

export const Default: Story = {
  args: {
    children: (
      <div className="flex h-full items-center justify-center text-sm text-fg-muted">
        Map SDK slot
      </div>
    ),
  },
}

export const MapReady: Story = {
  args: {
    ...Default.args,
    isMapReady: true,
  },
}

export const WithError: Story = {
  args: {
    ...Default.args,
    errorMessage: 'Tiles failed to load',
  },
}

export const AnatomyToolbarActions: Story = {
  args: { ...Default.args },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    'native-map': { skip: true },
    loading: { skip: true },
    error: { skip: true },
    attribution: { skip: true },
    recenter: { onPress: 'onRecenterRequest' },
    'retry-load': { onPress: 'onRetryLoad' },
  }),
}
