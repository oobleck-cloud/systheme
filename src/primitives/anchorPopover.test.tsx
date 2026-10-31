import { fireEvent, render, screen } from '@testing-library/react'
import { useRef, useState } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { useDismissOnEscape, usePointerDownOutside } from './anchorPopover'

/**
 * Anchor popover hooks 단위 테스트.
 *
 * Storybook play로는 다음을 모두 검증하기 어려움:
 *  - cleanup: enabled=false 가 되면 listener 해제됨
 *  - latest closure: handler가 최신 콜백을 항상 참조 (handlerRef 패턴)
 *  - document-level event 리스너 vs container 격리
 */

function PointerDownOutsideHarness({
  onOutside,
  enabled = true,
}: {
  onOutside: () => void
  enabled?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  usePointerDownOutside({ enabled, containerRef: ref, onPointerDownOutside: onOutside })
  return (
    <>
      <div ref={ref} data-testid="inside">
        inside
      </div>
      <div data-testid="outside">outside</div>
    </>
  )
}

describe('usePointerDownOutside', () => {
  test('container 외부 pointerdown에 콜백 호출', () => {
    const cb = vi.fn()
    render(<PointerDownOutsideHarness onOutside={cb} />)
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('container 내부 pointerdown에는 호출 안 됨', () => {
    const cb = vi.fn()
    render(<PointerDownOutsideHarness onOutside={cb} />)
    fireEvent.pointerDown(screen.getByTestId('inside'))
    expect(cb).not.toHaveBeenCalled()
  })

  test('enabled=false면 외부 클릭에도 콜백 안 됨', () => {
    const cb = vi.fn()
    render(<PointerDownOutsideHarness onOutside={cb} enabled={false} />)
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(cb).not.toHaveBeenCalled()
  })

  test('enabled toggle: 활성 → 비활성 시 listener 해제', () => {
    const cb = vi.fn()
    function Toggle() {
      const [on, setOn] = useState(true)
      return (
        <>
          <button data-testid="toggle" onClick={() => setOn(false)}>
            off
          </button>
          <PointerDownOutsideHarness onOutside={cb} enabled={on} />
        </>
      )
    }
    render(<Toggle />)
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(cb).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('toggle')) // enabled=false
    fireEvent.pointerDown(screen.getByTestId('outside'))
    expect(cb).toHaveBeenCalledTimes(1) // 더 이상 호출 안 됨
  })

  test('handler 최신 closure 사용 (handlerRef 패턴)', () => {
    let count = 0
    function Latest() {
      const [val, setVal] = useState(0)
      const ref = useRef<HTMLDivElement>(null)
      usePointerDownOutside({
        enabled: true,
        containerRef: ref,
        onPointerDownOutside: () => {
          count = val + 100
        },
      })
      return (
        <>
          <button data-testid="inc" onClick={() => setVal((v) => v + 1)}>
            inc
          </button>
          <div ref={ref}>inside</div>
          <div data-testid="outside">outside</div>
        </>
      )
    }
    render(<Latest />)
    fireEvent.click(screen.getByTestId('inc')) // val=1
    fireEvent.click(screen.getByTestId('inc')) // val=2
    fireEvent.pointerDown(screen.getByTestId('outside'))
    // 만약 stale closure였다면 count=100, 최신 closure면 count=102
    expect(count).toBe(102)
  })
})

describe('useDismissOnEscape', () => {
  test('Escape 키 → 콜백 호출', () => {
    const cb = vi.fn()
    function Harness() {
      useDismissOnEscape(true, cb)
      return null
    }
    render(<Harness />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(cb).toHaveBeenCalledTimes(1)
  })

  test('다른 키는 무시', () => {
    const cb = vi.fn()
    function Harness() {
      useDismissOnEscape(true, cb)
      return null
    }
    render(<Harness />)
    fireEvent.keyDown(document, { key: 'Enter' })
    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.keyDown(document, { key: 'a' })
    expect(cb).not.toHaveBeenCalled()
  })

  test('enabled=false면 Escape 무시', () => {
    const cb = vi.fn()
    function Harness() {
      useDismissOnEscape(false, cb)
      return null
    }
    render(<Harness />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(cb).not.toHaveBeenCalled()
  })

  test('unmount 시 listener 해제 (메모리/이벤트 누수 방지)', () => {
    const cb = vi.fn()
    function Harness() {
      useDismissOnEscape(true, cb)
      return null
    }
    const { unmount } = render(<Harness />)
    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(cb).not.toHaveBeenCalled()
  })
})
