import { fn } from '@storybook/test'

import { ResizableSplitPane } from './ResizableSplitPane'
import anatomy from './ResizableSplitPane.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ResizableSplitPane> = {
  title: 'Components/L3/ResizableSplitPane',
  component: ResizableSplitPane,
  tags: ['autodocs'],
  args: {
    defaultSplitRatio: 0.4,
    onDragStart: fn(),
    onDragEnd: fn(),
    leading: <div className="text-sm text-fg-muted">Leading pane</div>,
    trailing: <div className="text-sm text-fg-muted">Trailing pane</div>,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ResizableSplitPane>

export const Default: Story = {}

export const EvenSplit: Story = {
  args: { defaultSplitRatio: 0.5 },
}

export const DraggingState: Story = {
  args: { defaultSplitRatio: 0.25 },
}

export const AnatomySplitterControls: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    leading: { skip: true },
    splitter: { skip: true },
    trailing: { skip: true },
    grip: { onPress: 'onDragStart' },
    commit: { onPress: 'onDragEnd' },
  }),
}
