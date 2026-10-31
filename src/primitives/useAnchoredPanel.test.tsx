/**
 * useAnchoredPanel — 중첩 포털 패널의 dismiss 판정.
 *
 * 앵커 패널은 전부 document.body 로 포털되므로, "팝오버 안의 Select 드롭다운" 클릭이
 * DOM 포함 관계로는 팝오버 바깥이다. 소유 사슬(중첩 패널의 앵커는 부모 패널 안)을 걷는
 * 레지스트리가 없으면 옵션 클릭 한 번에 팝오버가 닫힌다 — 필터 빌더에서 실제로 겪은 버그.
 *
 * Storybook play 로는 pointerdown capture 단계의 오판(닫힘)을 안정적으로 재현하기
 * 어려워 jsdom 에서 고정한다.
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Popover } from '@/components/Popover'
import { Select } from '@/components/Select'

function NestedHarness({
  onPopoverOpenChange,
  onSelectChange,
}: {
  onPopoverOpenChange: (open: boolean) => void
  onSelectChange?: (v: string) => void
}) {
  return (
    <Popover
      defaultOpen
      onOpenChange={onPopoverOpenChange}
      trigger={({ onClick }) => (
        <button type="button" onClick={onClick}>
          팝오버 열기
        </button>
      )}
    >
      <Select
        options={[
          { value: 'received', label: '접수됨' },
          { value: 'assigned', label: '플래너 배정됨' },
        ]}
        onChange={onSelectChange}
        placeholder="상태 선택"
      />
      <div data-testid="panel-body">패널 본문</div>
    </Popover>
  )
}

describe('useAnchoredPanel 중첩 포털 dismiss', () => {
  it('팝오버 속 Select 옵션 클릭은 팝오버를 닫지 않는다', () => {
    const openChange = vi.fn()
    const selectChange = vi.fn()
    render(<NestedHarness onPopoverOpenChange={openChange} onSelectChange={selectChange} />)

    fireEvent.click(screen.getByRole('combobox'))
    const option = screen.getByRole('option', { name: /접수됨/ })
    // 실제 브라우저의 클릭 시퀀스: pointerdown(여기서 오판이 일어났다) → click(선택)
    fireEvent.pointerDown(option)
    fireEvent.click(option)

    expect(selectChange).toHaveBeenCalledWith('received')
    expect(openChange).not.toHaveBeenCalledWith(false)
  })

  it('진짜 바깥 pointerdown 은 여전히 팝오버를 닫는다', () => {
    const openChange = vi.fn()
    render(
      <>
        <NestedHarness onPopoverOpenChange={openChange} />
        <div data-testid="outside">바깥</div>
      </>,
    )
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(openChange).toHaveBeenCalledWith(false)
  })

  it('Escape 는 중첩 Select 가 열려 있으면 Select 만 닫고, 다음 Escape 에 팝오버가 닫힌다', () => {
    const openChange = vi.fn()
    render(<NestedHarness onPopoverOpenChange={openChange} />)

    const combobox = screen.getByRole('combobox')
    fireEvent.click(combobox)
    const listbox = screen.getByRole('listbox')

    fireEvent.keyDown(listbox, { key: 'Escape' })
    expect(openChange).not.toHaveBeenCalledWith(false)
    expect(combobox).toHaveAttribute('aria-expanded', 'false')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(openChange).toHaveBeenCalledWith(false)
  })
})
