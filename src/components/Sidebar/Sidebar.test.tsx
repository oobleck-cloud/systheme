/**
 * Sidebar — 접힌 상태의 3-depth 플라이아웃이 **터치에서도** 열리는가.
 *
 * 회귀 대상: 서브메뉴를 `pointerenter` 로 열고 `click` 으로 토글했더니, 터치의
 * `pointerenter → click` 순서 때문에 탭 한 번에 열렸다가 곧바로 닫혔다(=아무 일도 안 일어남).
 */
import { createEvent, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Sidebar, type SidebarItem } from './Sidebar'

const ITEMS: SidebarItem[] = [
  {
    id: 'ops',
    label: '운영',
    href: '#ops',
    children: [
      { id: 'orders', label: '주문', href: '/orders' },
      {
        id: 'planners',
        label: '플래너',
        href: '#planners',
        children: [
          { id: 'planner-list', label: '플래너 목록', href: '/planners' },
          { id: 'planner-schedule', label: '일정', href: '/planner-schedule' },
        ],
      },
    ],
  },
]

function renderCollapsed() {
  return render(<Sidebar items={ITEMS} activeItemId="orders" collapsed onNavigate={vi.fn()} />)
}

/**
 * jsdom 에는 PointerEvent 가 없어 `fireEvent.pointerEnter(el, { pointerType })` 의
 * pointerType 이 이벤트에 실리지 않는다 — 실제 브라우저에서는 항상 실린다.
 * 그래서 이벤트를 만들어 직접 붙인 뒤 던진다. 이 테스트가 재는 것이 바로 그 값이다.
 */
function pointerEnterAs(el: Element, pointerType: 'mouse' | 'touch') {
  // React 는 pointerover 에서 enter 를 합성한다 — over 를 던져야 합성 이벤트에 값이 실린다
  const event = createEvent.pointerOver(el, { bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(el, event)
}

/** 접힌 레일의 그룹 아이콘을 눌러 2-depth 플라이아웃을 연다 */
function openFlyout() {
  // 접힌 레일 버튼의 이름은 "머리글자 + sr-only 라벨" 로 읽힌다
  fireEvent.click(screen.getByRole('button', { name: /운영/ }))
}

describe('Sidebar — 접힌 플라이아웃', () => {
  it('터치로 3-depth 서브메뉴를 연다 (pointerenter → click 순서에도 닫히지 않는다)', () => {
    renderCollapsed()
    openFlyout()

    const trigger = screen.getByRole('menuitem', { name: /플래너/ })
    const row = trigger.closest('li')!

    // 터치 탭이 실제로 만드는 순서
    pointerEnterAs(row, 'touch')
    fireEvent.click(trigger)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('menuitem', { name: '플래너 목록' })).toBeInTheDocument()
  })

  it('마우스는 hover 만으로 열린다', () => {
    renderCollapsed()
    openFlyout()

    const trigger = screen.getByRole('menuitem', { name: /플래너/ })
    pointerEnterAs(trigger.closest('li')!, 'mouse')

    expect(screen.getByRole('menuitem', { name: '플래너 목록' })).toBeInTheDocument()
  })

  it('터치로 다시 누르면 닫힌다', () => {
    renderCollapsed()
    openFlyout()

    const trigger = screen.getByRole('menuitem', { name: /플래너/ })
    const row = trigger.closest('li')!

    pointerEnterAs(row, 'touch')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    pointerEnterAs(row, 'touch')
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
