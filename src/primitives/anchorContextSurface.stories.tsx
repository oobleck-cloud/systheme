import { useState } from 'react'

import { AnchorContextSurface } from './anchorContextSurface'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof AnchorContextSurface> = {
  title: 'Primitives/AnchorContextSurface',
  component: AnchorContextSurface,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof AnchorContextSurface>

/** 우클릭으로 `open` — 커스텀 탭/리스트 행에서 쓰는 컨텍스트 메뉴 패턴 */
export const RightClickToOpen: Story = {
  name: '우클릭 — 패널 열기',
  render: () => {
    const [open, setOpen] = useState(false)
    const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null)
    return (
      <div className="p-8">
        <p className="mb-2 text-sm text-fg-muted">
          영역을 우클릭하면 커서 바로 아래에 glass 패널이 열립니다.
        </p>
        <AnchorContextSurface
          open={open}
          onOpenChange={setOpen}
          panelAnchor="pointer"
          pointerAnchor={pointer}
          surface={
            <div
              className="rounded-md border border-border bg-background px-4 py-8 text-sm text-fg"
              onContextMenu={(e) => {
                e.preventDefault()
                setPointer({ x: e.clientX, y: e.clientY })
                setOpen(true)
              }}
            >
              Context target area
            </div>
          }
          panel={
            <ul className="py-1">
              <li>
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  액션 1
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  액션 2
                </button>
              </li>
            </ul>
          }
        />
      </div>
    )
  },
}

/** 외부에서 `open` 제어 — 스트립/탭 여러 개가 메뉴 하나만 열리게 묶을 때 */
export const ControlledOpen: Story = {
  name: '제어 — controlled open',
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div className="p-8">
        <p className="mb-2 text-sm text-fg-muted">
          부모가 `open` / `onOpenChange`로 메뉴를 직렬화할 때 예시입니다.
        </p>
        <button
          type="button"
          className="mb-3 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
          onClick={() => setOpen((o) => !o)}
        >
          토글 패널
        </button>
        <AnchorContextSurface
          open={open}
          onOpenChange={setOpen}
          surface={
            <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm">
              Surface
            </div>
          }
          panel={
            <ul className="py-1">
              <li>
                <button
                  type="button"
                  className="flex w-full px-3 py-2 text-left text-sm hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  닫기
                </button>
              </li>
            </ul>
          }
        />
      </div>
    )
  },
}
