import { useState } from 'react'

import { Drawer } from './Drawer'

/**
 * Playwright CT fixtures — 각 테스트에 필요한 최소 DOM만 렌더.
 */

/** 기본: 처음부터 열린 Drawer */
export function OpenDrawer({ side = 'right' as 'left' | 'right' | 'top' | 'bottom' }) {
  const [open, setOpen] = useState(true)
  return (
    <Drawer open={open} onOpenChange={setOpen} title="테스트 드로어" side={side}>
      <p data-testid="body">드로어 본문</p>
      <button data-testid="inner-btn">내부 버튼 1</button>
      <button data-testid="inner-btn-2">내부 버튼 2</button>
    </Drawer>
  )
}

/** scroll-lock 테스트: 버튼으로 열기 */
export function ScrollLockDrawer() {
  const [open, setOpen] = useState(false)
  return (
    <div className="p-10">
      <button data-testid="trigger" onClick={() => setOpen(true)}>
        Open
      </button>
      <Drawer open={open} onOpenChange={setOpen} title="스크롤 잠금">
        <p>컨텐츠</p>
      </Drawer>
    </div>
  )
}

/** focus trap 테스트: 내부에 여러 포커스 가능 요소 포함 */
export function FocusTrapDrawer() {
  const [open, setOpen] = useState(true)
  return (
    <Drawer open={open} onOpenChange={setOpen} title="포커스 트랩">
      <button data-testid="btn-a">버튼 A</button>
      <button data-testid="btn-b">버튼 B</button>
      <button data-testid="btn-c">버튼 C</button>
    </Drawer>
  )
}
