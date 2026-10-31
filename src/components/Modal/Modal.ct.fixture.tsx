import { useState } from 'react'

import { Modal } from './Modal'

/**
 * Playwright CT fixtures — 각 테스트가 필요한 최소한의 DOM만 렌더.
 * 하나의 fixture가 여러 테스트를 커버하려 하면 DOM 레이아웃이 충돌.
 */

/** 기본: 처음부터 열린 Modal */
export function OpenModal() {
  const [open, setOpen] = useState(true)
  return (
    <Modal open={open} onOpenChange={setOpen} title="알림">
      <p data-testid="body">모달 본문 텍스트</p>
      <button data-testid="inner-action">내부 액션</button>
    </Modal>
  )
}

/** scroll-lock 테스트: 버튼 클릭으로 열기 — trigger는 항상 viewport 안 */
export function ScrollLockModal() {
  const [open, setOpen] = useState(false)
  return (
    // eslint-disable-next-line design-system/no-inline-style -- Playwright CT fixture: padding for trigger button visibility
    <div style={{ padding: '40px' }}>
      <button data-testid="trigger" onClick={() => setOpen(true)}>
        Open
      </button>
      <Modal open={open} onOpenChange={setOpen} title="스크롤 잠금 테스트">
        <p>컨텐츠</p>
      </Modal>
    </div>
  )
}

/** focus trap 테스트: dialog 안에 여러 포커스 가능 요소 포함 */
export function FocusTrapModal() {
  const [open, setOpen] = useState(true)
  return (
    <Modal open={open} onOpenChange={setOpen} title="포커스 트랩">
      <button data-testid="btn-a">버튼 A</button>
      <button data-testid="btn-b">버튼 B</button>
      <button data-testid="btn-c">버튼 C</button>
    </Modal>
  )
}
