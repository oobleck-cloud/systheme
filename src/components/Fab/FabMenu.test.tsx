/**
 * FabMenu — 펼침 계약
 *
 * Test cases:
 * A. 닫힘: 트리거 aria-expanded=false, 아이템 없음, 사각(rounded-xl) 조형
 * B. 트리거 클릭: menu 가 열리고 트리거는 원형(rounded-full) 닫기로 morph
 * C. 아이템 선택: onSelect 발화 + 메뉴 닫힘
 * D. Escape: 닫힘
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FabMenu } from './FabMenu'

const items = [
  { id: 'today', label: '오늘 목록', onSelect: vi.fn() },
  { id: 'map', label: '지도' },
]

describe('FabMenu 펼침 계약', () => {
  it('닫힘 상태는 사각 트리거만 그린다', () => {
    render(<FabMenu items={items} />)
    const trigger = screen.getByRole('button', { name: '메뉴' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger.className).toContain('rounded-xl')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('트리거를 누르면 열리고 원형 닫기로 morph 한다', () => {
    render(<FabMenu items={items} />)
    fireEvent.click(screen.getByRole('button', { name: '메뉴' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: '메뉴 닫기' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger.className).toContain('rounded-full')
    expect(screen.getByRole('menuitem', { name: '오늘 목록' })).toBeInTheDocument()
  })

  it('아이템을 고르면 onSelect 후 닫힌다', () => {
    const onOpenChange = vi.fn()
    render(<FabMenu items={items} defaultOpen onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByRole('menuitem', { name: '오늘 목록' }))
    expect(items[0].onSelect).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('Escape 로 닫힌다', () => {
    const onOpenChange = vi.fn()
    render(<FabMenu items={items} defaultOpen onOpenChange={onOpenChange} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
