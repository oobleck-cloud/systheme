import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { RichList } from './RichList'
import anatomy from './RichList.anatomy.json'

import type { RichListItem } from './RichList'
import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const SAMPLE_ITEMS: RichListItem[] = [
  {
    id: 'alpha',
    title: 'Alpha',
    description: 'Supporting line for the first row',
    tags: ['Draft'],
    timestamp: '10:24',
  },
  {
    id: 'beta',
    title: 'Beta',
    description: 'Second row with multiple tags and trailing metadata',
    tags: ['Active', 'Primary'],
    trailingText: '2.4k',
  },
  {
    id: 'gamma',
    title: 'Gamma',
    description: 'Disabled row example',
    tags: ['Archived'],
    disabled: true,
  },
  {
    id: 'delta',
    title: 'Delta',
    description: 'Title and description only',
  },
]

const meta: Meta<typeof RichList> = {
  title: 'Components/L2/RichList',
  component: RichList,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    chrome: { control: 'inline-radio', options: ['floating', 'embedded'] },
  },
  args: {
    chrome: 'floating',
    density: 'default',
    selectionMode: 'none',
    loading: false,
    items: SAMPLE_ITEMS,
    'aria-label': '옵션 목록',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof RichList>

export const Default: Story = {
  render: (args) => (
    <div className="w-80">
      <RichList {...args} />
    </div>
  ),
}

export const TitleOnly: Story = {
  name: 'Title only',
  args: {
    items: SAMPLE_ITEMS.map(({ id, title, disabled }) => ({ id, title, disabled })),
  },
  render: (args) => (
    <div className="w-80">
      <RichList {...args} />
    </div>
  ),
}

export const WithActivation: Story = {
  name: 'With row activation',
  args: {
    onItemActivate: fn(),
  },
  render: (args) => (
    <div className="w-80">
      <RichList {...args} />
    </div>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const options = canvas.getAllByRole('option')
    await userEvent.click(options[0])
    await expect(args.onItemActivate).toHaveBeenCalledWith('alpha')
  },
}

export const SingleSelection: Story = {
  name: 'Single selection',
  render: (args) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['beta'])
    return (
      <div className="w-80">
        <RichList
          {...args}
          selectionMode="single"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    )
  },
}

export const MultipleSelection: Story = {
  name: 'Multiple selection',
  render: (args) => {
    const [selectedIds, setSelectedIds] = useState<string[]>(['alpha'])
    return (
      <div className="w-80">
        <RichList
          {...args}
          selectionMode="multiple"
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    )
  },
}

export const Empty: Story = {
  args: {
    items: [],
    emptyMessage: 'No items',
  },
  render: (args) => (
    <div className="w-80">
      <RichList {...args} />
    </div>
  ),
}

export const Loading: Story = {
  args: {
    loading: true,
    items: [],
  },
  render: (args) => (
    <div className="w-80">
      <RichList {...args} />
    </div>
  ),
}

export const Embedded: Story = {
  name: 'Embedded (Box chrome)',
  args: {
    chrome: 'embedded',
    items: Array.from({ length: 14 }, (_, i) => ({
      id: `row-${i}`,
      title: `주문 ${1000 + i}`,
      subtitle: '서울 강남',
      trailingText: '010-1234-5678',
    })),
  },
  render: (args) => (
    <div className="w-80 overflow-hidden rounded-lg border border-border-subtle bg-background">
      <RichList {...args} />
    </div>
  ),
}

export const Densities: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-6">
      {(['compact', 'default', 'loose'] as const).map((density) => (
        <RichList
          key={density}
          density={density}
          items={SAMPLE_ITEMS.slice(0, 2)}
          aria-label={`${density} density list`}
        />
      ))}
    </div>
  ),
}
