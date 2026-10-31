import { expect, fn, userEvent, within } from '@storybook/test'

import { Popover } from './Popover'
import anatomy from './Popover.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Popover> = {
  title: 'Components/L1/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    side: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    showDismiss: { control: 'boolean' },
  },
  args: {
    trigger: <Button variant="outline">열기</Button>,
    side: 'bottom',
    align: 'center',
    showDismiss: true,
    children: (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">팝오버 콘텐츠</p>
        <p className="text-xs text-fg-muted">바깥을 클릭하거나 Esc로 닫을 수 있습니다.</p>
      </div>
    ),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {}

/**
 * Anatomy 검증 — trigger는 disclosure(boolean writes), panel은 overlay-surface.
 *  - 트리거 클릭 시 panel mount
 *  - aria-expanded ↔ open 동기화
 *  - aria-controls ↔ panel.id 연결
 *  - dismiss 버튼 또는 Esc로 닫힘
 */
export const TriggerOpensPanel: Story = {
  args: { onOpenChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const trigger = canvasElement.querySelector('[data-slot="popover-trigger"]')
    if (!trigger) throw new Error('popover-trigger 슬롯 누락')

    // 초기 상태
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvasElement.querySelector('[data-slot="popover-panel"]')).toBeNull()

    // 트리거 클릭 → 열림
    await userEvent.click(trigger)
    await expect(args.onOpenChange).toHaveBeenCalledWith(true)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const panel = canvasElement.querySelector('[data-slot="popover-panel"]')
    await expect(panel).not.toBeNull()
    await expect(trigger).toHaveAttribute('aria-controls', panel!.id)
    await expect(panel).toHaveAttribute('role', 'dialog')

    // dismiss 버튼 클릭 → 닫힘
    const close = canvas.getByRole('button', { name: '닫기' })
    await userEvent.click(close)
    await expect(args.onOpenChange).toHaveBeenLastCalledWith(false)
    await expect(canvasElement.querySelector('[data-slot="popover-panel"]')).toBeNull()
  },
}

export const KeyboardOpensPanel: Story = {
  args: { onOpenChange: fn() },
  play: async ({ canvasElement, args }) => {
    const trigger = canvasElement.querySelector(
      '[data-slot="popover-trigger"]',
    ) as HTMLElement | null
    if (!trigger) throw new Error('popover-trigger 슬롯 누락')

    trigger.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onOpenChange).toHaveBeenCalledWith(true)
  },
}

/** 로딩 — 패널은 바로 열리고, 내용이 오기 전까지 Skeleton 이 자리를 잡는다(패널 크기가 튀지 않는다). */
export const Loading: Story = {
  args: {
    defaultOpen: true,
    trigger: <Button variant="outline">고객 요약</Button>,
    children: (
      <div className="w-56 pt-4">
        <Skeleton lines={4} />
      </div>
    ),
  },
}
