import { useState } from 'react'

import { IconButton } from '../IconButton'

import { TabTrigger } from './TabTrigger'
import { WorkspaceTabRowShell } from './workspaceTabShell'
import anatomy from './workspaceTabShell.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof WorkspaceTabRowShell> = {
  title: 'Components/L2/WorkspaceTabRowShell',
  component: WorkspaceTabRowShell,
  tags: ['autodocs'],
  argTypes: {
    selected: { control: 'boolean' },
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
    fixedWidth: { control: 'number' },
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof WorkspaceTabRowShell>

export const Default: Story = {
  render: (args) => (
    <div className="flex h-9 items-center border-b border-border bg-surface px-1">
      <WorkspaceTabRowShell {...args} selected={true}>
        <TabTrigger
          appearance="workspace"
          tabId="home"
          label="홈"
          isSelected={true}
          role={undefined}
          tabIndex={-1}
          aria-selected={undefined}
        />
      </WorkspaceTabRowShell>
    </div>
  ),
}

export const Unselected: Story = {
  render: (args) => (
    <div className="flex h-9 items-center border-b border-border bg-surface px-1">
      <WorkspaceTabRowShell {...args} selected={false}>
        <TabTrigger
          appearance="workspace"
          tabId="home"
          label="홈"
          isSelected={false}
          role={undefined}
          tabIndex={-1}
          aria-selected={undefined}
        />
      </WorkspaceTabRowShell>
    </div>
  ),
}

export const TabStrip: Story = {
  render: (args) => {
    const [activeId, setActiveId] = useState('orders')

    const tabs = [
      { id: 'home', label: '홈' },
      { id: 'orders', label: '주문 목록' },
      { id: 'settings', label: '설정' },
    ]

    return (
      <div className="flex h-9 items-center border-b border-border bg-surface px-1">
        {tabs.map((tab) => (
          <WorkspaceTabRowShell key={tab.id} {...args} selected={activeId === tab.id}>
            <TabTrigger
              appearance="workspace"
              tabId={tab.id}
              label={tab.label}
              isSelected={activeId === tab.id}
              role={undefined}
              tabIndex={-1}
              aria-selected={undefined}
              onSelect={setActiveId}
            />
          </WorkspaceTabRowShell>
        ))}
      </div>
    )
  },
}

export const DensityMatrix: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['compact', 'default', 'loose'] as const).map((density) => (
        <div key={density} className="flex flex-col gap-1">
          <span className="text-xs text-fg-muted">{density}</span>
          <div className="flex h-9 items-center border-b border-border bg-surface px-1">
            <WorkspaceTabRowShell density={density} selected={true}>
              <TabTrigger
                appearance="workspace"
                density={density}
                tabId="active"
                label="활성 탭"
                isSelected={true}
                role={undefined}
                tabIndex={-1}
                aria-selected={undefined}
              />
            </WorkspaceTabRowShell>
            <WorkspaceTabRowShell density={density} selected={false}>
              <TabTrigger
                appearance="workspace"
                density={density}
                tabId="inactive"
                label="비활성 탭"
                isSelected={false}
                role={undefined}
                tabIndex={-1}
                aria-selected={undefined}
              />
            </WorkspaceTabRowShell>
          </div>
        </div>
      ))}
    </div>
  ),
}

/** 실제 워크스페이스 탭 헤더: TabTrigger + IconButton(닫기) 조합 */
export const WithCloseButton: Story = {
  render: () => {
    const [activeId, setActiveId] = useState('orders')
    const [tabs, setTabs] = useState([
      { id: 'home', label: '홈' },
      { id: 'orders', label: '주문 목록' },
      { id: 'settings', label: '설정' },
    ])

    const close = (id: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id)
        if (activeId === id && next.length > 0) setActiveId(next[0].id)
        return next
      })
    }

    return (
      <div className="flex h-9 items-center border-b border-border bg-surface px-1">
        {tabs.map((tab) => {
          const selected = activeId === tab.id
          return (
            <WorkspaceTabRowShell key={tab.id} selected={selected} className="pr-1">
              <TabTrigger
                appearance="workspace"
                tabId={tab.id}
                label={tab.label}
                isSelected={selected}
                role={undefined}
                tabIndex={-1}
                aria-selected={undefined}
                onSelect={setActiveId}
              />
              <IconButton
                variant="ghost"
                size="xs"
                shape="square"
                aria-label={`${tab.label} 탭 닫기`}
                className="h-4 w-4"
                onClick={(e) => {
                  e.stopPropagation()
                  close(tab.id)
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                  <path
                    d="M2 2l6 6M8 2l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
            </WorkspaceTabRowShell>
          )
        })}
      </div>
    )
  },
}
