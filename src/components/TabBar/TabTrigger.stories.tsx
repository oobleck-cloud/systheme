import { useState } from 'react'

import { TabTrigger } from './TabTrigger'
import anatomy from './TabTrigger.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TabTrigger> = {
  title: 'Components/L2/TabTrigger',
  component: TabTrigger,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TabTrigger>

export const Default: Story = {
  render: (args) => {
    const [id, setId] = useState('x')
    return (
      <div className="flex gap-1 border-b border-border">
        <TabTrigger {...args} tabId="x" label="Alpha" selectedTabId={id} onSelect={setId} />
        <TabTrigger {...args} tabId="y" label="Beta" selectedTabId={id} onSelect={setId} />
      </div>
    )
  },
}
