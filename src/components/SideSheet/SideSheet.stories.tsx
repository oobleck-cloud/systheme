import { expect, userEvent, waitFor } from '@storybook/test'
import { useState } from 'react'

import { SideSheet } from './SideSheet'
import anatomy from './SideSheet.anatomy.json'
import { SideSheetHost } from './SideSheetHost'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import { Skeleton } from '@/components/Skeleton'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SideSheet> = {
  title: 'Components/L2/SideSheet',
  component: SideSheet,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof SideSheet>

/** 시트가 폭을 가져가는 대상 — 실제 앱에서는 헤더+탭+본문이 통째로 들어간다. */
function DemoContent({ onOpen }: { onOpen: () => void }) {
  return (
    <div data-testid="demo-content" className="flex min-w-0 flex-1 flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-fg">주문 상세 · ORD-24817</span>
        <Button type="button" size="sm" variant="outline" onClick={onOpen}>
          고객 이력 보기
        </Button>
      </div>
      <p className="text-sm text-fg-muted">
        시트가 열리면 이 영역이 좁아진다. 덮이지 않으므로 열어둔 채로 계속 조작할 수 있다.
      </p>
    </div>
  )
}

function DemoShell({ children, onOpen }: { children: React.ReactNode; onOpen: () => void }) {
  return (
    <SideSheetHost className="h-96 w-full overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex h-full w-full min-w-0">
        <DemoContent onOpen={onOpen} />
      </div>
      {children}
    </SideSheetHost>
  )
}

export const Right: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="고객 이력">
          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm text-fg-muted">누적 주문 3건 · 계약 2건</p>
            <p className="text-sm text-fg">가정이사 · 마포구 → 성동구 (2025-11-02)</p>
            <p className="text-sm text-fg">원룸이사 · 관악구 → 마포구 (2024-08-19)</p>
          </div>
        </SideSheet>
      </DemoShell>
    )
  },
}

export const Left: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} side="left" title="필터">
          <div className="flex flex-col gap-2 p-4 text-sm text-fg-muted">
            <span>퍼널 · 담당 플래너 · 방문 일자</span>
          </div>
        </SideSheet>
      </DemoShell>
    )
  },
}

export const WithFooter: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet
          open={open}
          onOpenChange={setOpen}
          title="추천 점수"
          footer={
            <div className="flex justify-end p-3">
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
          }
        >
          <div className="p-4 text-sm text-fg-muted">가중치 근거를 여기서 대조한다.</div>
        </SideSheet>
      </DemoShell>
    )
  },
}

export const NotResizable: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="고정 폭" resizable={false}>
          <div className="p-4 text-sm text-fg-muted">폭 조절 핸들이 없다.</div>
        </SideSheet>
      </DemoShell>
    )
  },
}

/**
 * 이 컴포넌트의 핵심 계약 — 열리면 본문이 **좁아진다**(덮지 않는다).
 * Drawer는 본문 폭이 그대로이고 위에 뜬다는 점에서 다르다.
 */
export const PushesContent: Story = {
  render: () => {
    const [open, setOpen] = useState(false)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="고객 이력" animated={false}>
          <div className="p-4 text-sm text-fg-muted">본문을 밀어낸다.</div>
        </SideSheet>
      </DemoShell>
    )
  },
  play: async ({ canvasElement }) => {
    const content = canvasElement.querySelector<HTMLElement>('[data-testid="demo-content"]')
    if (!content) throw new Error('demo-content 누락')
    const before = content.getBoundingClientRect().width

    const trigger = canvasElement.querySelector('button') as HTMLElement
    await userEvent.click(trigger)

    await waitFor(() => {
      const sheet = canvasElement.querySelector('[data-slot="side-sheet-root"]')
      if (!sheet) throw new Error('side-sheet-root가 아직 없음')
    })
    await waitFor(async () => {
      const after = content.getBoundingClientRect().width
      await expect(after).toBeLessThan(before)
    })
  },
}

/** close(dismiss) → onOpenChange(false) 계약. */
export const CloseButtonDismisses: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="닫기 테스트" animated={false}>
          <p className="p-4">닫기 버튼으로 닫기</p>
        </SideSheet>
      </DemoShell>
    )
  },
  play: async ({ canvasElement }) => {
    const closeBtn = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('[data-slot="side-sheet-close"]')
      if (!el) throw new Error('side-sheet-close 슬롯 누락')
      return el
    })
    await userEvent.click(closeBtn)
    await waitFor(() => {
      const sheet = canvasElement.querySelector('[data-slot="side-sheet-root"]')
      if (sheet) throw new Error('닫기 후에도 시트가 남아 있음')
    })
  },
}

/** resize-handle(stepper) → 방향키로 width writes. */
export const KeyboardResize: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="폭 조절" animated={false}>
          <p className="p-4">핸들에 포커스를 두고 ←/→</p>
        </SideSheet>
      </DemoShell>
    )
  },
  play: async ({ canvasElement }) => {
    const handle = await waitFor(() => {
      const el = canvasElement.querySelector<HTMLElement>('[data-slot="side-sheet-resize-handle"]')
      if (!el) throw new Error('side-sheet-resize-handle 슬롯 누락')
      return el
    })
    const before = Number(handle.getAttribute('aria-valuenow'))
    handle.focus()
    await userEvent.keyboard('{ArrowLeft}')
    await waitFor(async () => {
      const after = Number(handle.getAttribute('aria-valuenow'))
      await expect(after).toBeGreaterThan(before)
    })
  },
}

/** 로딩 — 시트는 폭을 먼저 확보하고 본문만 Skeleton 으로 채운다. 본문은 그대로 조작할 수 있다. */
export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="고객 이력">
          <div className="p-4">
            <Skeleton lines={6} />
          </div>
        </SideSheet>
      </DemoShell>
    )
  },
}

/** 빈 상태 — 시트 본문 안에 EmptyState. 시트 자체는 닫지 않는다(비어 있다는 것도 정보다). */
export const Empty: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <DemoShell onOpen={() => setOpen(true)}>
        <SideSheet open={open} onOpenChange={setOpen} title="고객 이력">
          <EmptyState
            className="max-w-none"
            title="이력이 없습니다"
            message="이 고객의 첫 주문입니다. 상담이 끝나면 여기에 쌓입니다."
          />
        </SideSheet>
      </DemoShell>
    )
  },
}

/**
 * 좁은 창 — 시트가 **덮는다**.
 *
 * 창이 좁으면 자리를 나눠 갖는다는 말이 성립하지 않는다. 예전에는 `max-width: 100vw` 로만
 * 막아서, 같은 행에 있는 사이드바 레일까지 더해진 폭이 창을 넘었고 시트 **왼쪽이 레일 밑으로
 * 들어가 글자가 잘렸다**. 본문에 남길 자리가 없으면 나눠 갖지 말고 덮는다.
 *
 * 창을 좁혀 보면(뷰포트 640px 미만) 시트가 레일까지 덮으며 가장자리에서 밀려 들어온다.
 */
export const NarrowViewportCovers: Story = {
  render: () => {
    const [open, setOpen] = useState(true)
    return (
      <SideSheetHost className="h-96 w-full overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex h-full w-full min-w-0">
          {/* 실제 앱의 사이드바 레일 — 줄어들지 않는다. 잘림은 여기서 시작됐다 */}
          <div
            data-testid="rail"
            className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-border py-3"
          >
            <div className="size-6 rounded bg-container-high" />
            <div className="size-6 rounded bg-container-high" />
            <div className="size-6 rounded bg-container-high" />
          </div>
          <DemoContent onOpen={() => setOpen(true)} />
        </div>
        <SideSheet
          open={open}
          onOpenChange={setOpen}
          title="고객 이력"
          defaultWidth={760}
          maxWidth={960}
        >
          <div className="p-4 text-sm text-fg">
            <p className="font-semibold">홍길명희 · 정기 이용 중 1건</p>
            <p className="mt-1 text-fg-muted">누적 이용 103회 · 최근 방문 2026-09-10</p>
          </div>
        </SideSheet>
      </SideSheetHost>
    )
  },
  play: async ({ canvasElement }) => {
    const panel = canvasElement.querySelector('[data-slot="side-sheet-panel"]')!
    await waitFor(() => {
      // 잘림의 조건은 하나다 — 시트가 창 밖으로 나가는 것
      const rect = panel.getBoundingClientRect()
      expect(rect.left).toBeGreaterThanOrEqual(-0.5)
      expect(rect.right).toBeLessThanOrEqual(window.innerWidth + 0.5)
    })
  },
}
