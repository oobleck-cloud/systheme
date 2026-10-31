/**
 * BottomSheet — 모달 계약
 *
 * Test cases:
 * A. 열리면 role="dialog" + aria-modal, 핸들·타이틀·본문이 그려진다
 * B. container 를 주면 body 가 아니라 그 요소 안에 absolute 로 뜬다
 * C. Escape / backdrop 클릭이 onOpenChange(false) 를 발화한다
 * D. container 모달은 body 스크롤을 잠그지 않는다
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { BottomSheet } from './BottomSheet'

describe('BottomSheet 모달 계약', () => {
  it('열리면 dialog 시맨틱과 핸들·타이틀을 그린다', async () => {
    render(
      <BottomSheet defaultOpen title="방 추가">
        <p>본문</p>
      </BottomSheet>,
    )
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('방 추가')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="bottom-sheet-handle"]')).not.toBeNull()
  })

  it('container 를 주면 그 요소 안에 absolute 로 뜬다', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    render(
      <BottomSheet defaultOpen container={host}>
        <p>본문</p>
      </BottomSheet>,
    )
    await waitFor(() => {
      const root = host.querySelector('[data-slot="bottom-sheet-root"]')
      expect(root).not.toBeNull()
      expect(root!.className).toContain('absolute')
      expect(root!.className).not.toContain('fixed')
    })
    expect(document.body.style.overflow).not.toBe('hidden')
    host.remove()
  })

  it('Escape 와 backdrop 클릭이 닫힘을 발화한다', async () => {
    const onOpenChange = vi.fn()
    render(
      <BottomSheet open onOpenChange={onOpenChange} title="시트">
        <p>본문</p>
      </BottomSheet>,
    )
    await screen.findByRole('dialog')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    onOpenChange.mockClear()
    fireEvent.click(document.querySelector('[data-slot="bottom-sheet-backdrop"]')!)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
