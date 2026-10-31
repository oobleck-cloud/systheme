import { useState } from 'react'

import { TabList } from './TabList'
import anatomy from './TabList.anatomy.json'
import { TabTrigger } from './TabTrigger'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const tabs = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
]

const meta: Meta<typeof TabList> = {
  title: 'Components/L2/TabList',
  component: TabList,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
    justify: { control: 'select', options: ['start', 'center', 'between', 'end'] },
    scrollable: { control: 'boolean' },
    bordered: { control: 'boolean' },
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TabList>

/** `role="tablist"` + `TabTrigger` children — `TabBar` 없이 최소 합성 */
export const WithTabTriggers: Story = {
  name: '합성 — TabTrigger children',
  render: (args) => {
    const [id, setId] = useState('a')
    return (
      <TabList {...args}>
        {tabs.map((t) => (
          <TabTrigger
            key={t.id}
            tabId={t.id}
            label={t.label}
            selectedTabId={id}
            onSelect={setId}
            density={args.density}
          />
        ))}
      </TabList>
    )
  },
}

/** 가로 스크롤 탭 줄 — 좁은 컨테이너에서 탭이 많을 때 */
export const ScrollableRow: Story = {
  name: '레이아웃 — scrollable',
  render: (args) => {
    const [id, setId] = useState('a')
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: `t-${i}`,
      label: `Tab ${i + 1}`,
    }))
    return (
      <div className="max-w-md overflow-hidden rounded-md border border-border">
        <TabList {...args} scrollable bordered>
          {many.map((t) => (
            <TabTrigger
              key={t.id}
              tabId={t.id}
              label={t.label}
              selectedTabId={id}
              onSelect={setId}
              density="compact"
            />
          ))}
        </TabList>
      </div>
    )
  },
}
