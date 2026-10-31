/**
 * Menu — Interaction Grammar PR4
 *
 * Test cases:
 * A. Keyboard navigation: ArrowDown/Up navigate between items when open
 * B. Keyboard activation: Enter calls onSelect(items[focusedIndex].id)
 * C. Keyboard close: Escape closes menu (Escape → cancel → setOpen(false))
 * D. Roving tabindex: Focused item gets tabIndex=0, others -1
 * E. No navigation when closed: ArrowDown does nothing when menu is closed
 * F. Disabled items: Skipped or not selectable with Enter
 * G. Separator: 방향키가 구분선을 건너뛰고, 구분선은 포커스/선택 대상이 아니다
 * H. Danger/description: 위험 항목 색 구분 + 설명줄이 이름이 아닌 설명으로 읽힘
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Menu } from './Menu'

const ITEMS = [
  { id: 'copy', label: 'Copy' },
  { id: 'paste', label: 'Paste' },
  { id: 'delete', label: 'Delete' },
]

function renderMenu(props: Partial<React.ComponentProps<typeof Menu>> = {}) {
  return render(
    <Menu items={ITEMS} onSelect={props.onSelect ?? vi.fn()} trigger="Open Menu" {...props} />,
  )
}

function openMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Open Menu' }))
}

function getMenuList() {
  return screen.getByRole('menu').querySelector('ul') as HTMLElement
}

// ---------------------------------------------------------------------------
// A. Keyboard navigation
// ---------------------------------------------------------------------------

describe('A. Keyboard navigation', () => {
  it('ArrowDown moves focus to next item', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    // Initially index 0 is focused
    expect(items[0]).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(ul, { key: 'ArrowDown' })

    expect(items[0]).toHaveAttribute('tabindex', '-1')
    expect(items[1]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp moves focus to previous item', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    // Move to index 1 first
    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    expect(items[1]).toHaveAttribute('tabindex', '0')

    // Move back
    fireEvent.keyDown(ul, { key: 'ArrowUp' })
    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
  })

  it('ArrowDown does not go past the last item', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    fireEvent.keyDown(ul, { key: 'ArrowDown' })

    // Should be at last item (Delete, index 2)
    expect(items[2]).toHaveAttribute('tabindex', '0')
  })

  it('ArrowUp does not go before the first item', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'ArrowUp' })
    expect(items[0]).toHaveAttribute('tabindex', '0')
  })

  it('Home moves focus to first item', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    fireEvent.keyDown(ul, { key: 'ArrowDown' })

    fireEvent.keyDown(ul, { key: 'Home' })
    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })

  it('End moves focus to last item', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'End' })
    expect(items[2]).toHaveAttribute('tabindex', '0')
    expect(items[0]).toHaveAttribute('tabindex', '-1')
  })
})

// ---------------------------------------------------------------------------
// B. Keyboard activation
// ---------------------------------------------------------------------------

describe('B. Keyboard activation', () => {
  it('Enter on focused item calls onSelect with that item id', () => {
    const onSelect = vi.fn()
    renderMenu({ onSelect })
    openMenu()

    const ul = getMenuList()

    // Focused on index 0 (copy)
    fireEvent.keyDown(ul, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith('copy')
  })

  it('Enter after ArrowDown calls onSelect with focused item id', () => {
    const onSelect = vi.fn()
    renderMenu({ onSelect })
    openMenu()

    const ul = getMenuList()
    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    fireEvent.keyDown(ul, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith('paste')
  })

  it('Space on focused item calls onSelect', () => {
    const onSelect = vi.fn()
    renderMenu({ onSelect })
    openMenu()

    const ul = getMenuList()
    fireEvent.keyDown(ul, { key: ' ' })

    expect(onSelect).toHaveBeenCalledWith('copy')
  })
})

// ---------------------------------------------------------------------------
// C. Keyboard close: Escape
// ---------------------------------------------------------------------------

describe('C. Keyboard close', () => {
  it('Escape closes the menu (trigger aria-expanded becomes false)', () => {
    renderMenu()
    openMenu()

    expect(screen.queryByRole('menu')).toBeInTheDocument()

    const ul = getMenuList()
    fireEvent.keyDown(ul, { key: 'Escape' })

    // AnimatePresence keeps the element in DOM during exit animation.
    // Verify the state change via aria-expanded on the trigger button.
    expect(screen.getByRole('button', { name: 'Open Menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('onOpenChange is called with false when Escape is pressed', () => {
    const onOpenChange = vi.fn()
    renderMenu({ onOpenChange })
    openMenu()

    const ul = getMenuList()
    fireEvent.keyDown(ul, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ---------------------------------------------------------------------------
// D. Roving tabindex
// ---------------------------------------------------------------------------

describe('D. Roving tabindex', () => {
  it('first item has tabIndex=0, others have -1 when menu first opens', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    expect(items[0]).toHaveAttribute('tabindex', '0')
    expect(items[1]).toHaveAttribute('tabindex', '-1')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })

  it('after ArrowDown, second item has tabIndex=0', () => {
    renderMenu()
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'ArrowDown' })

    expect(items[0]).toHaveAttribute('tabindex', '-1')
    expect(items[1]).toHaveAttribute('tabindex', '0')
    expect(items[2]).toHaveAttribute('tabindex', '-1')
  })
})

// ---------------------------------------------------------------------------
// E. No navigation when closed
// ---------------------------------------------------------------------------

describe('E. No navigation when closed', () => {
  it('ArrowDown does nothing when menu is closed', () => {
    renderMenu()

    // Menu is not open — no menu element in DOM
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    // There's nothing to fire keyDown on in the menu — it's not rendered
    // Just verify the menu remains closed after trigger interaction other than click
    const trigger = screen.getByRole('button', { name: 'Open Menu' })
    fireEvent.keyDown(trigger, { key: 'ArrowDown' })

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// F. Disabled items
// ---------------------------------------------------------------------------

describe('F. Disabled items', () => {
  it('Enter on disabled item does not call onSelect', () => {
    const onSelect = vi.fn()
    const itemsWithDisabled = [
      { id: 'copy', label: 'Copy', disabled: true },
      { id: 'paste', label: 'Paste' },
    ]
    renderMenu({ items: itemsWithDisabled, onSelect })
    openMenu()

    const ul = getMenuList()
    // Focused on index 0 (copy, disabled)
    fireEvent.keyDown(ul, { key: 'Enter' })

    expect(onSelect).not.toHaveBeenCalled()
  })

  it('clicking disabled item does not call onSelect', () => {
    const onSelect = vi.fn()
    const itemsWithDisabled = [
      { id: 'copy', label: 'Copy', disabled: true },
      { id: 'paste', label: 'Paste' },
    ]
    renderMenu({ items: itemsWithDisabled, onSelect })
    openMenu()

    const items = screen.getAllByRole('menuitem')
    fireEvent.click(items[0])

    expect(onSelect).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// G. Separator
//
// roving focus 가 인덱스 기반이라 구분선을 items 와 함께 세면 방향키가 빈 칸에서 한 번
// 멈춘다. 아래 테스트가 그 회귀를 막는다 — 이게 이 확장에서 유일하게 비자명한 지점.
// ---------------------------------------------------------------------------

const ITEMS_WITH_SEPARATOR: React.ComponentProps<typeof Menu>['items'] = [
  { id: 'rename', label: 'Rename' },
  { id: 'share', label: 'Share' },
  { type: 'separator' },
  { id: 'unpin', label: 'Remove from tabs', description: 'Only hides it for you.' },
  { id: 'delete', label: 'Delete view', description: 'Cannot be undone.', severity: 'danger' },
]

describe('G. Separator', () => {
  it('구분선은 menuitem 이 아니고 포커스를 받지 않는다', () => {
    renderMenu({ items: ITEMS_WITH_SEPARATOR })
    openMenu()

    expect(screen.getAllByRole('menuitem')).toHaveLength(4)

    const separator = screen.getByRole('menu').querySelector('[data-slot="menu-separator"]')!
    expect(separator).toBeInTheDocument()
    expect(separator).not.toHaveAttribute('tabindex')
    expect(separator.querySelector('[role="separator"], hr')).toBeInTheDocument()
  })

  it('ArrowDown 이 구분선을 건너뛴다', () => {
    renderMenu({ items: ITEMS_WITH_SEPARATOR })
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    expect(items[0]).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(ul, { key: 'ArrowDown' }) // rename → share (구분선 바로 위)
    expect(items[1]).toHaveAttribute('tabindex', '0')

    // 여기서 한 번 더 누르면 구분선이 아니라 그 아래 항목으로 바로 간다
    fireEvent.keyDown(ul, { key: 'ArrowDown' })
    expect(items[2]).toHaveAttribute('tabindex', '0')
    expect(items[2]).toHaveAccessibleName('Remove from tabs')
  })

  it('ArrowUp 도 구분선을 건너뛴다', () => {
    renderMenu({ items: ITEMS_WITH_SEPARATOR })
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'End' })
    expect(items[3]).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(ul, { key: 'ArrowUp' })
    expect(items[2]).toHaveAttribute('tabindex', '0')

    fireEvent.keyDown(ul, { key: 'ArrowUp' })
    expect(items[1]).toHaveAttribute('tabindex', '0')
  })

  it('End 는 구분선이 아니라 마지막 항목으로 간다', () => {
    renderMenu({ items: ITEMS_WITH_SEPARATOR })
    openMenu()

    const ul = getMenuList()
    const items = ul.querySelectorAll('[role="menuitem"]')

    fireEvent.keyDown(ul, { key: 'End' })
    expect(items[3]).toHaveAttribute('tabindex', '0')
  })

  it('구분선 뒤 항목도 Enter 로 정확히 선택된다(인덱스 어긋남 방지)', () => {
    const onSelect = vi.fn()
    renderMenu({ items: ITEMS_WITH_SEPARATOR, onSelect })
    openMenu()

    const ul = getMenuList()
    fireEvent.keyDown(ul, { key: 'End' })
    fireEvent.keyDown(ul, { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith('delete')
  })

  it('구분선만 있고 항목이 없어도 터지지 않는다', () => {
    renderMenu({ items: [{ type: 'separator' }] })
    openMenu()

    expect(screen.queryAllByRole('menuitem')).toHaveLength(0)
    fireEvent.keyDown(getMenuList(), { key: 'ArrowDown' })
    fireEvent.keyDown(getMenuList(), { key: 'Enter' })
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// H. severity / description
// ---------------------------------------------------------------------------

describe('H. Danger and description', () => {
  it('severity=danger 항목만 위험 색을 갖는다', () => {
    renderMenu({ items: ITEMS_WITH_SEPARATOR })
    openMenu()

    const items = screen.getAllByRole('menuitem')
    expect(items[3]).toHaveAttribute('data-severity', 'danger')
    expect(items[3].className).toContain('text-error-text')
    expect(items[0]).not.toHaveAttribute('data-severity')
    expect(items[0].className).not.toContain('text-error-text')
  })

  it('설명줄은 이름이 아니라 설명으로 읽힌다', () => {
    renderMenu({ items: ITEMS_WITH_SEPARATOR })
    openMenu()

    const unpin = screen.getAllByRole('menuitem')[2]
    expect(unpin).toHaveAccessibleName('Remove from tabs')
    expect(unpin).toHaveAccessibleDescription('Only hides it for you.')
  })

  it('설명줄이 없는 항목은 종전과 같이 aria 연결이 붙지 않는다', () => {
    renderMenu()
    openMenu()

    const items = screen.getAllByRole('menuitem')
    for (const item of items) {
      expect(item).not.toHaveAttribute('aria-describedby')
      expect(item).not.toHaveAttribute('aria-labelledby')
      expect(item).not.toHaveAttribute('data-severity')
      expect(item.querySelector('[data-slot="menu-description"]')).toBeNull()
    }
  })
})
