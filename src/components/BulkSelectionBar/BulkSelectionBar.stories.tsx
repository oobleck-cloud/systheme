import { expect, fn, within } from '@storybook/test'

import { BulkSelectionBar } from './BulkSelectionBar'
import anatomy from './BulkSelectionBar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button/Button'
import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof BulkSelectionBar> = {
  title: 'Components/L1/BulkSelectionBar',
  component: BulkSelectionBar,
  tags: ['autodocs'],
  args: {
    selectedCount: 3,
    primaryLabel: 'Export',
    clearLabel: 'Clear selection',
    onPrimaryAction: fn(),
    onClearSelection: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof BulkSelectionBar>

export const Default: Story = {}

export const WithSlotActions: Story = {
  args: {
    children: (
      <Button type="button" variant="ghost" size="sm">
        Add tag
      </Button>
    ),
  },
}

export const Floating: Story = {
  args: { floating: true, selectedCount: 3, selectedSuffix: '건 선택', primaryLabel: '참여 확정' },
  render: (args) => (
    <div className="h-64 overflow-y-auto bg-surface">
      <div className="h-96 p-4 text-sm text-fg-muted">스크롤되는 목록</div>
      <BulkSelectionBar {...args} />
    </div>
  ),
}

export const ZeroSelection: Story = {
  args: { selectedCount: 0 },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    count: { skip: true },
    actions: { skip: true },
    primary: { onPress: 'onPrimaryAction' },
    clear: { onPress: 'onClearSelection' },
  }),
}

export const CountAnnounced: Story = {
  args: { selectedCount: 12 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('12 selected')).toBeVisible()
  },
}
