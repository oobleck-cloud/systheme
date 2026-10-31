import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { TabBar } from './TabBar'
import anatomy from './TabBar.anatomy.json'
import { TabTrigger, type TabTriggerProps } from './TabTrigger'

import type { Meta, StoryObj } from '@storybook/react'

import { AnchorContextSurface } from '@/primitives/anchorContextSurface'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const tabs = [
  { id: 'a', label: 'Overview' },
  { id: 'b', label: 'Settings' },
  { id: 'c', label: 'Billing' },
]

const meta: Meta<typeof TabBar> = {
  title: 'Components/L2/TabBar',
  component: TabBar,
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
type Story = StoryObj<typeof TabBar>

/** `tabs` + `onTabChange` 편의 API — 합성 없음 */
export const ItemsApiDefault: Story = {
  name: 'Items API — 기본',
  render: (args) => {
    const [id, setId] = useState('a')
    return <TabBar {...args} tabs={tabs} selectedTabId={id} onTabChange={setId} />
  },
}

/**
 * tab 클릭 → onTabChange(id) + aria-selected 동기화.
 */
export const TabClickCallsOnTabChange: Story = {
  name: 'Tab 클릭 → onTabChange + aria-selected',
  args: { onTabChange: fn() },
  render: (args) => {
    const [id, setId] = useState('a')
    return (
      <TabBar
        {...args}
        tabs={tabs}
        selectedTabId={id}
        onTabChange={(tabId) => {
          args.onTabChange?.(tabId)
          setId(tabId)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const tabButtons = canvas.getAllByRole('tab')

    // 초기: Overview(a)가 선택됨
    await expect(tabButtons[0]).toHaveAttribute('aria-selected', 'true')
    await expect(tabButtons[1]).toHaveAttribute('aria-selected', 'false')

    // Settings 탭 클릭
    await userEvent.click(tabButtons[1])
    await expect(args.onTabChange).toHaveBeenCalledWith('b')

    // Settings이 선택됨, Overview는 해제
    await expect(tabButtons[1]).toHaveAttribute('aria-selected', 'true')
    await expect(tabButtons[0]).toHaveAttribute('aria-selected', 'false')
  },
}

export const ItemsApiCentered: Story = {
  name: 'Items API — 중앙 정렬',
  render: (args) => {
    const [id, setId] = useState('a')
    return (
      <TabBar
        {...args}
        tabs={tabs}
        selectedTabId={id}
        onTabChange={setId}
        justify="center"
        className="max-w-xl"
      />
    )
  },
}

/** `tabWidth`에 숫자를 지정하면 각 탭이 해당 px 너비로 고정되고 긴 이름은 `…` 처리된다. */
export const ItemsApiFixedWidth: Story = {
  name: 'Items API — 고정 너비 (tabWidth)',
  render: (args) => {
    const [id, setId] = useState('a')
    return (
      <TabBar
        {...args}
        tabs={[
          { id: 'a', label: 'Overview Dashboard' },
          { id: 'b', label: 'Account Settings & Preferences' },
          { id: 'c', label: 'Billing' },
        ]}
        selectedTabId={id}
        onTabChange={setId}
        tabWidth={120}
      />
    )
  },
}

/** `TabBar`가 `TabList`를 감싸고, 탭은 `children`으로만 전달 */
export const CompositionTabBarChildren: Story = {
  name: '합성 — TabBar + children (TabTrigger)',
  render: (args) => {
    const [id, setId] = useState('a')
    return (
      <TabBar
        density={args.density}
        justify={args.justify}
        scrollable={args.scrollable}
        bordered={args.bordered}
      >
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
      </TabBar>
    )
  },
}

function TabContextMenuRow({
  tab,
  selectedId,
  onSelect,
  density,
}: {
  tab: (typeof tabs)[number]
  selectedId: string
  onSelect: (id: string) => void
  density: TabTriggerProps['density']
}) {
  const [open, setOpen] = useState(false)
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
  return (
    <AnchorContextSurface
      layout="inline"
      open={open}
      onOpenChange={setOpen}
      panelAnchor="pointer"
      pointerAnchor={pointer}
      surface={
        <div
          className="inline-flex min-w-0"
          onContextMenu={(e) => {
            e.preventDefault()
            setPointer({ x: e.clientX, y: e.clientY })
            setOpen(true)
          }}
        >
          <TabTrigger
            tabId={tab.id}
            label={tab.label}
            selectedTabId={selectedId}
            onSelect={onSelect}
            density={density}
          />
        </div>
      }
      panel={
        <ul className="py-1">
          <li>
            <button
              type="button"
              className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface"
              onClick={() => {
                setOpen(false)
                onSelect(tab.id)
              }}
            >
              이 탭으로 포커스
            </button>
          </li>
        </ul>
      }
    />
  )
}

/**
 * 탭 라벨 영역에서 우클릭 → `AnchorContextSurface` 패널로 컨텍스트 메뉴 표시.
 * Dockview 탭에 DS 스타일 메뉴를 입힐 때 동일한 패턴을 사용한다.
 */
export const CompositionWithRightClick: Story = {
  name: '합성 — 탭 우클릭 (AnchorContextSurface)',
  render: (args) => {
    const [id, setId] = useState('a')
    return (
      <TabBar
        density={args.density}
        justify={args.justify}
        scrollable={args.scrollable}
        bordered={args.bordered}
      >
        {tabs.map((t) => (
          <TabContextMenuRow
            key={t.id}
            tab={t}
            selectedId={id}
            onSelect={setId}
            density={args.density}
          />
        ))}
      </TabBar>
    )
  },
}
