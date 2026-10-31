import { fn } from '@storybook/test'

import { DiffInlinePanel } from './DiffInlinePanel'
import anatomy from './DiffInlinePanel.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const lines = [
  { id: '1', kind: 'context' as const, leftText: 'foo', rightText: 'foo' },
  { id: '2', kind: 'change' as const, leftText: 'bar', rightText: 'baz' },
]

const meta: Meta<typeof DiffInlinePanel> = {
  title: 'Components/L2/DiffInlinePanel',
  component: DiffInlinePanel,
  tags: ['autodocs'],
  args: {
    lines,
    onLineActivate: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DiffInlinePanel>

export const Default: Story = {}

/** 변경 종류(kind) 매트릭스 */
export const KindAdd: Story = {
  args: { lines: [{ id: 'a', kind: 'add', leftText: '', rightText: 'new line' }] },
}
export const KindRemove: Story = {
  args: { lines: [{ id: 'b', kind: 'remove', leftText: 'removed', rightText: '' }] },
}
export const KindChange: Story = {
  args: { lines: [{ id: 'c', kind: 'change', leftText: 'old', rightText: 'new' }] },
}
export const KindContext: Story = {
  args: { lines: [{ id: 'd', kind: 'context', leftText: 'ctx', rightText: 'ctx' }] },
}

export const MultipleRows: Story = {
  args: {
    lines: [...lines, { id: '3', kind: 'add' as const, leftText: '', rightText: 'tail' }],
  },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    row: { skip: true },
    kind: { skip: true },
    left: { skip: true },
    right: { skip: true },
    open: { onPress: 'onLineActivate' },
  }),
}
