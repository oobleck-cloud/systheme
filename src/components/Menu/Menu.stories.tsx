import { expect, fn, screen, userEvent, waitFor, within } from '@storybook/test'

import { Menu, type MenuEntry } from './Menu'
import anatomy from './Menu.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { EyeOff, Pencil, Trash2, Users } from '@/icons'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Menu> = {
  title: 'Components/L2/Menu',
  component: Menu,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof Menu>

const sampleItems = [
  { id: '1', label: '편집' },
  { id: '2', label: '복제' },
  { id: '3', label: '삭제', disabled: true },
]

/**
 * 아무 옵션도 쓰지 않은 기존 형태 — severity/description/separator 를 더한 뒤에도
 * 이 스토리는 픽셀이 그대로여야 한다(시각 회귀 비교 기준선).
 */
export const Default: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="outline">메뉴</Button>}
      items={sampleItems}
      onSelect={() => undefined}
    />
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="secondary">작업</Button>}
      items={[
        {
          id: 'a',
          label: '새 탭',
          icon: (
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M8 3v10M3 8h10" strokeLinecap="round" />
            </svg>
          ),
        },
        { id: 'b', label: '설정' },
      ]}
      onSelect={() => undefined}
    />
  ),
}

/**
 * trigger(disclosure) 클릭 → panel(role=menu) 노출 + aria-expanded 동기화.
 */
export const OpensOnTriggerClick: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="outline">메뉴</Button>}
      items={sampleItems}
      onSelect={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: '메뉴' })

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvasElement.querySelector('[role="menu"]')).toBeNull()

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('menu')).toBeVisible()

    // 다시 클릭 시 닫힌다
    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => {
      if (canvasElement.querySelector('[role="menu"]')) throw new Error('메뉴가 아직 열려 있음')
    })
  },
}

/**
 * item 클릭 → onSelect(id) 호출 + 메뉴 자동 닫힘.
 */
export const ItemClickCallsOnSelect: Story = {
  args: { onSelect: fn() },
  render: (args) => (
    <Menu {...args} trigger={<Button variant="outline">메뉴</Button>} items={sampleItems} />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: '메뉴' })

    await userEvent.click(trigger)
    await expect(canvas.getByRole('menu')).toBeVisible()

    const items = canvas.getAllByRole('menuitem')
    await userEvent.click(items[0])

    await expect(args.onSelect).toHaveBeenCalledWith('1')
    await waitFor(() => {
      if (canvasElement.querySelector('[role="menu"]'))
        throw new Error('클릭 후 메뉴가 닫히지 않음')
    })
  },
}

/**
 * 비활성화된 항목 클릭 시 onSelect가 호출되지 않는다.
 */
export const DisabledItemIgnored: Story = {
  args: { onSelect: fn() },
  render: (args) => (
    <Menu {...args} trigger={<Button variant="outline">메뉴</Button>} items={sampleItems} />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '메뉴' }))
    await expect(canvas.getByRole('menu')).toBeVisible()

    const disabledItem = canvas.getAllByRole('menuitem')[2]
    await expect(disabledItem).toBeDisabled()
    await userEvent.click(disabledItem, { pointerEventsCheck: 0 })
    await expect(args.onSelect).not.toHaveBeenCalled()
  },
}

/* ── 위험 항목 · 구분선 · 설명줄 ───────────────────────────────────────────── */

const iconClass = 'size-3.5'

/**
 * 실제 동기가 된 배치(collections 의 뷰 탭 메뉴): 위는 "뷰를 손보는 것",
 * 아래는 "치우거나 없애는 것". 라벨만으로는 "탭에서 제거"(내 화면만)와
 * "뷰 삭제"(공유면 남의 화면에서도 사라짐)가 구분되지 않으므로 설명줄로 결과를 적는다.
 */
const destructiveEntries: MenuEntry[] = [
  { id: 'rename', label: '이름 변경', icon: <Pencil className={iconClass} aria-hidden /> },
  { id: 'share', label: '전체 공유로 전환', icon: <Users className={iconClass} aria-hidden /> },
  { type: 'separator' },
  {
    id: 'unpin',
    label: '탭에서 제거',
    description: '내 화면에서만 감춥니다. 다시 열 수 있어요.',
    icon: <EyeOff className={iconClass} aria-hidden />,
  },
  {
    id: 'delete',
    label: '뷰 삭제(모두에게서)',
    description: '되돌릴 수 없습니다. 이 뷰를 쓰던 다른 사람 화면에서도 사라집니다.',
    icon: <Trash2 className={iconClass} aria-hidden />,
    severity: 'danger',
  },
]

/**
 * 위험 항목(severity='danger') + 구분선 + 설명줄을 모두 쓴 형태.
 */
export const DestructiveGroup: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="outline">뷰 메뉴</Button>}
      items={destructiveEntries}
      onSelect={() => undefined}
    />
  ),
}

/**
 * 구분선은 고를 수 없다 — 방향키가 구분선을 건너뛰고, 구분선 자체는 포커스를 받지 않는다.
 *
 * roving focus 가 인덱스 기반이라 구분선을 items 와 함께 세면 방향키가 빈 칸에서
 * 한 번 멈추게 된다. 이 스토리가 그 회귀를 막는다.
 */
export const ArrowKeysSkipSeparator: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="outline">뷰 메뉴</Button>}
      items={destructiveEntries}
      onSelect={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '뷰 메뉴' }))

    // 패널은 portal 로 body 에 붙으므로 canvasElement 가 아니라 document 기준으로 찾는다.
    const menu = await screen.findByRole('menu')
    const items = screen.getAllByRole('menuitem')

    // 항목 4개 + 구분선 1개 — 구분선은 menuitem 이 아니다.
    await expect(items).toHaveLength(4)
    const separator = menu.querySelector('[data-slot="menu-separator"]') as HTMLElement
    await expect(separator).toBeInTheDocument()
    await expect(separator).not.toHaveAttribute('tabindex')
    await expect(within(menu).getByRole('separator')).toBeInTheDocument()

    // 키 이벤트가 목록(ul)까지 올라가야 하므로 먼저 항목에 포커스를 준다.
    items[0].focus()

    // 구분선 바로 위(share, index 1) → ArrowDown 한 번에 구분선 바로 아래(unpin, index 2)
    await expect(items[0]).toHaveAttribute('tabindex', '0')
    await userEvent.keyboard('{ArrowDown}')
    await expect(items[1]).toHaveAttribute('tabindex', '0')
    await userEvent.keyboard('{ArrowDown}')
    await expect(items[2]).toHaveAttribute('tabindex', '0')
    await expect(items[2]).toHaveAccessibleName('탭에서 제거')

    // End → 마지막 항목이 구분선이 아니라 위험 항목
    await userEvent.keyboard('{End}')
    await expect(items[3]).toHaveAttribute('tabindex', '0')
    await expect(items[3]).toHaveAttribute('data-severity', 'danger')

    // 역방향도 마찬가지 — 위험 항목에서 ArrowUp 한 번에 구분선을 건너뛴다
    await userEvent.keyboard('{ArrowUp}')
    await expect(items[2]).toHaveAttribute('tabindex', '0')
  },
}

/**
 * 설명줄은 이름이 아니라 설명으로 읽힌다 — 이름은 라벨로 고정(aria-labelledby),
 * 설명은 aria-describedby 로 연결.
 */
export const DescriptionIsDescribedNotNamed: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="outline">뷰 메뉴</Button>}
      items={destructiveEntries}
      onSelect={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '뷰 메뉴' }))
    await screen.findByRole('menu')

    const items = screen.getAllByRole('menuitem')

    // 설명줄이 없는 항목은 종전과 같이 aria 연결이 붙지 않는다(무옵션 회귀 보호)
    await expect(items[0]).not.toHaveAttribute('aria-describedby')
    await expect(items[0]).not.toHaveAttribute('aria-labelledby')

    const unpin = items[2]
    await expect(unpin).toHaveAccessibleName('탭에서 제거')
    await expect(unpin).toHaveAccessibleDescription('내 화면에서만 감춥니다. 다시 열 수 있어요.')
  },
}

/**
 * Escape 키 → 메뉴 닫힘.
 */
export const EscapeCloses: Story = {
  render: () => (
    <Menu
      trigger={<Button variant="outline">메뉴</Button>}
      items={sampleItems}
      onSelect={() => undefined}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: '메뉴' })

    await userEvent.click(trigger)
    await expect(canvas.getByRole('menu')).toBeVisible()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      if (canvasElement.querySelector('[role="menu"]')) throw new Error('Escape 후에도 열려 있음')
    })
  },
}
