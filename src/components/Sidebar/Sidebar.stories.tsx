import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { Sidebar, type SidebarItem, type SidebarNavigateOptions } from './Sidebar'
import anatomy from './Sidebar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Home, Settings, createIconElement } from '@/icons'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Sidebar> = {
  title: 'Components/L2/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="h-80 max-w-md rounded-lg border border-border bg-background">
        <Story />
      </div>
    ),
  ],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof Sidebar>

const demoItems: SidebarItem[] = [
  {
    id: 'home',
    label: '홈',
    href: '/',
    icon: createIconElement(Home, 'md'),
  },
  {
    id: 'settings',
    label: '설정',
    href: '/settings',
    icon: createIconElement(Settings, 'md'),
  },
]

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState('home')
    const [collapsed, setCollapsed] = useState(false)
    return (
      <Sidebar
        items={demoItems}
        activeItemId={active}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        onNavigate={(id) => setActive(id)}
        brandBlock={
          <span className="px-1 text-xs font-semibold tracking-wide text-fg-muted uppercase">
            App
          </span>
        }
      />
    )
  },
}

/**
 * 선택된 아이템은 하늘색 배경(info-subtle)에 파란색 텍스트(info-text),
 * 비선택 아이템은 연회색(fg-subtle) 텍스트.
 */
export const ActiveItemStyle: Story = {
  render: () => <Sidebar items={demoItems} activeItemId="settings" onNavigate={() => undefined} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const settingsLink = canvas.getByRole('link', { name: /설정/ })
    const homeLink = canvas.getByRole('link', { name: /홈/ })

    await expect(settingsLink).toHaveAttribute('aria-current', 'page')
    await expect(homeLink).not.toHaveAttribute('aria-current')
  },
}

/**
 * nav-item(routing-link) 클릭 → onNavigate(id, href) 호출 + aria-current 동기화.
 */
export const ItemClickCallsOnNavigate: Story = {
  args: { onNavigate: fn() },
  render: (args) => {
    const [active, setActive] = useState('home')
    return (
      <Sidebar
        {...args}
        items={demoItems}
        activeItemId={active}
        onNavigate={(id, href, options) => {
          args.onNavigate?.(id, href, options)
          setActive(id)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const links = canvas.getAllByRole('link')

    // 초기: '홈' 링크가 aria-current="page"
    const homeLink = canvas.getByRole('link', { name: /홈/ })
    await expect(homeLink).toHaveAttribute('aria-current', 'page')

    // '설정' 링크 클릭
    const settingsLink = canvas.getByRole('link', { name: /설정/ })
    await userEvent.click(settingsLink)
    await expect(args.onNavigate).toHaveBeenCalledWith('settings', '/settings', {
      openInNewTab: false,
      openInBackground: false,
    })

    // aria-current 업데이트
    await expect(settingsLink).toHaveAttribute('aria-current', 'page')
    await expect(homeLink).not.toHaveAttribute('aria-current')
    void links
  },
}

/**
 * Ctrl/Cmd + 클릭 시 modifier 정보를 그대로 호출자에게 전달합니다.
 *
 * 워크스페이스 호스트는 이 modifier를 보고 새 탭 / 백그라운드 탭을 분기합니다.
 */
export const ItemClickPassesModifiers: Story = {
  args: { onNavigate: fn() },
  render: (args) => {
    const [active, setActive] = useState('home')
    const [last, setLast] = useState<string>('')
    return (
      <div className="flex h-full flex-col">
        <Sidebar
          {...args}
          items={demoItems}
          activeItemId={active}
          onNavigate={(id, href, options: SidebarNavigateOptions) => {
            args.onNavigate?.(id, href, options)
            const mods = [
              options.openInNewTab ? 'new-tab' : null,
              options.openInBackground ? 'background' : null,
            ]
              .filter(Boolean)
              .join('+')
            setLast(`${id} (${mods || 'none'})`)
            setActive(id)
          }}
        />
        <p className="border-t border-border bg-background px-3 py-1.5 text-xs text-fg-muted">
          last: <span className="font-mono">{last || '\u2013'}</span>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const settings = canvas.getByRole('link', { name: /설정/ })

    await userEvent.keyboard('[MetaLeft>]')
    await userEvent.click(settings)
    await userEvent.keyboard('[/MetaLeft]')
    await expect(args.onNavigate).toHaveBeenCalledWith(
      'settings',
      '/settings',
      expect.objectContaining({ metaKey: true }),
    )
  },
}

/**
 * collapse-toggle 클릭 → onCollapseChange(!collapsed).
 */
const treeItems: SidebarItem[] = [
  {
    id: 'home',
    label: '홈',
    href: '#home',
    icon: createIconElement(Home, 'md'),
  },
  {
    id: 'workspace',
    label: '워크스페이스',
    href: '#workspace',
    icon: createIconElement(Settings, 'md'),
    children: [
      { id: 'orders', label: '주문', href: '#orders' },
      {
        id: 'ops',
        label: '운영',
        href: '#ops',
        children: [
          { id: 'planners', label: '플래너', href: '#planners' },
          { id: 'schedule', label: '근무 배정', href: '#schedule' },
        ],
      },
    ],
  },
]

export const TreeNavigation: Story = {
  render: () => {
    const [active, setActive] = useState('orders')
    const [collapsed, setCollapsed] = useState(false)
    return (
      <Sidebar
        items={treeItems}
        activeItemId={active}
        collapsed={collapsed}
        onCollapseChange={setCollapsed}
        onNavigate={(id) => setActive(id)}
      />
    )
  },
}

/**
 * collapse-toggle 클릭 → onCollapseChange(!collapsed).
 */
export const CollapseToggle: Story = {
  args: { onCollapseChange: fn() },
  render: (args) => {
    const [collapsed, setCollapsed] = useState(false)
    return (
      <Sidebar
        {...args}
        items={demoItems}
        activeItemId="home"
        collapsed={collapsed}
        onNavigate={() => undefined}
        onCollapseChange={(c) => {
          args.onCollapseChange?.(c)
          setCollapsed(c)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const toggleBtn = canvas.getByRole('button', { name: 'Collapse sidebar' })

    await expect(toggleBtn).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(toggleBtn)
    await expect(args.onCollapseChange).toHaveBeenCalledWith(true)

    // 레이블이 'Expand sidebar'로 변경됨
    await expect(canvas.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument()

    // 다시 클릭 → 펼침
    await userEvent.click(canvas.getByRole('button', { name: 'Expand sidebar' }))
    await expect(args.onCollapseChange).toHaveBeenCalledWith(false)
  },
}
