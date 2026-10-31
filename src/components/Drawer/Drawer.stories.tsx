import { expect, userEvent, waitFor } from '@storybook/test'
import { useState } from 'react'

import { Drawer } from './Drawer'
import anatomy from './Drawer.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Drawer> = {
  title: 'Components/L2/Drawer',
  component: Drawer,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof Drawer>

export const Right: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          드로어 (오른쪽)
        </Button>
        <Drawer
          open={open}
          onOpenChange={setOpen}
          side="right"
          title="필터"
          footer={<Button onClick={() => setOpen(false)}>적용</Button>}
        >
          <p className="text-fg-muted">측면 패널 본문입니다.</p>
        </Drawer>
      </div>
    )
  },
}

export const Left: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          드로어 (왼쪽)
        </Button>
        <Drawer open={open} onOpenChange={setOpen} side="left" title="내비게이션">
          <nav className="flex flex-col gap-1 text-sm">
            <a className="rounded-md px-2 py-2 hover:bg-surface" href="#home">
              홈
            </a>
            <a className="rounded-md px-2 py-2 hover:bg-surface" href="#settings">
              설정
            </a>
          </nav>
        </Drawer>
      </div>
    )
  },
}

/**
 * Drawer는 createPortal로 document.body에 렌더링되므로
 * play 함수는 document.body에서 요소를 탐색한다.
 *
 * backdrop(dismiss) 클릭 → onOpenChange(false) 계약 검증.
 */
export const BackdropCloses: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        <span data-testid="drawer-status">{open ? 'open' : 'closed'}</span>
        <Drawer open={open} onOpenChange={setOpen} title="닫기 테스트">
          <p>배경 클릭으로 닫기</p>
        </Drawer>
      </div>
    )
  },
  play: async () => {
    await waitFor(() => {
      const panel = document.body.querySelector('[data-slot="drawer-panel"]')
      if (!panel) throw new Error('drawer-panel이 아직 없음')
    })
    const backdrop = document.body.querySelector<HTMLElement>('[data-slot="drawer-backdrop"]')
    if (!backdrop) throw new Error('drawer-backdrop 슬롯 누락')
    await userEvent.click(backdrop)
    await waitFor(() => {
      const panel = document.body.querySelector('[data-slot="drawer-panel"]')
      if (panel) throw new Error('backdrop 클릭 후에도 패널이 남아 있음')
    })
  },
}

/**
 * close(dismiss) 버튼 클릭 → onOpenChange(false) 계약 검증.
 */
export const CloseButtonDismisses: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        <Drawer open={open} onOpenChange={setOpen} title="닫기 버튼 테스트">
          <p>닫기 버튼으로 닫기</p>
        </Drawer>
      </div>
    )
  },
  play: async () => {
    await waitFor(() => {
      const panel = document.body.querySelector('[data-slot="drawer-panel"]')
      if (!panel) throw new Error('drawer-panel이 아직 없음')
    })
    const closeBtn = document.body.querySelector<HTMLElement>('[data-slot="drawer-close"]')
    if (!closeBtn) throw new Error('drawer-close 슬롯 누락')
    await userEvent.click(closeBtn)
    await waitFor(() => {
      const panel = document.body.querySelector('[data-slot="drawer-panel"]')
      if (panel) throw new Error('닫기 버튼 클릭 후에도 패널이 남아 있음')
    })
  },
}

/**
 * side prop 별 패널 위치 검증 — left/right/bottom.
 * Playwright CT의 scroll lock / focus trap 계약은 Drawer.ct.tsx에서 검증.
 */
export const SideLeft: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          왼쪽 드로어
        </Button>
        <Drawer open={open} onOpenChange={setOpen} side="left" title="왼쪽">
          <p>왼쪽 패널</p>
        </Drawer>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button') as HTMLElement
    await userEvent.click(trigger)
    await waitFor(() => {
      const panel = document.body.querySelector('[data-slot="drawer-panel"]')
      if (!panel) throw new Error('패널이 아직 없음')
      return panel
    })
    const panel = document.body.querySelector('[data-slot="drawer-panel"]') as HTMLElement
    await expect(panel).toBeVisible()
    const rect = panel.getBoundingClientRect()
    await expect(rect.left).toBe(0)
  },
}

export const SideBottom: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          아래쪽 드로어
        </Button>
        <Drawer open={open} onOpenChange={setOpen} side="bottom" title="아래쪽">
          <p>아래쪽 패널</p>
        </Drawer>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const trigger = canvasElement.querySelector('button') as HTMLElement
    await userEvent.click(trigger)
    await waitFor(() => {
      const panel = document.body.querySelector('[data-slot="drawer-panel"]')
      if (!panel) throw new Error('패널이 아직 없음')
      return panel
    })
    const panel = document.body.querySelector('[data-slot="drawer-panel"]') as HTMLElement
    await expect(panel).toBeVisible()
  },
}

/** 로딩 — 헤더(제목·닫기)는 그대로 두고 본문만 Skeleton 으로 채운다. 기다리는 동안에도 닫을 수 있다. */
export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <div>
        <Button type="button" onClick={() => setOpen(true)}>
          고객 이력 열기
        </Button>
        <Drawer open={open} onOpenChange={setOpen} title="고객 이력">
          <Skeleton lines={6} />
        </Drawer>
      </div>
    )
  },
}
