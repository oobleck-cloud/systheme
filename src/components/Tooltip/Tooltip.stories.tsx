import { expect, userEvent, waitFor, within } from '@storybook/test'

import { Button } from '../Button/Button'

import { Tooltip } from './Tooltip'
import anatomy from './Tooltip.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Tooltip> = {
  title: 'Components/L1/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip content="저장하면 즉시 반영됩니다.">
      <Button type="button" variant="outline" size="sm">
        저장
      </Button>
    </Tooltip>
  ),
}

export const SideTop: Story = {
  render: () => (
    <div className="pt-16">
      <Tooltip content="위쪽 툴팁" side="top">
        <Button type="button" variant="secondary" size="sm">
          위쪽
        </Button>
      </Tooltip>
    </div>
  ),
}

/**
 * Anatomy-driven 검증 — Tooltip은 합성 컴포넌트이므로 anatomy의 핵심 계약 3가지를
 * 직접 시뮬레이션한다:
 *   1. trigger(disclosure) — 호버 시 open=true 로 writes 되어야 함
 *   2. bubble(overlay-surface) — open 상태에 binding 되어 가시성 토글
 *   3. trigger.aria-describedby ↔ bubble.id — 스크린리더 연결
 *
 * Storybook test-runner 내 hover 지연을 0으로 설정한다.
 */
export const HoverOpensBubble: Story = {
  render: () => (
    <Tooltip content="저장하면 즉시 반영됩니다." delayDuration={0}>
      <Button type="button" variant="outline" size="sm">
        저장
      </Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: '저장' })
    const triggerSlot = canvasElement.querySelector('[data-slot="tooltip-trigger"]')
    if (!triggerSlot) throw new Error('Tooltip anatomy: data-slot="tooltip-trigger" 누락')

    // 닫힌 초기 상태
    await expect(trigger).not.toHaveAttribute('aria-describedby')
    await expect(canvasElement.querySelector('[role="tooltip"]')).toBeNull()

    // hover → bubble 노출 + aria-describedby 연결
    await userEvent.hover(triggerSlot)
    const bubble = await waitFor(
      () => {
        const el = canvasElement.querySelector('[role="tooltip"]')
        if (!el) throw new Error('still closed')
        return el
      },
      { timeout: 500 },
    )
    await expect(bubble).toHaveAttribute('id')
    const tipId = bubble.getAttribute('id')!
    await expect(triggerSlot).toHaveAttribute('aria-describedby', tipId)

    // unhover → 닫힘
    await userEvent.unhover(triggerSlot)
    await waitFor(
      () => {
        if (canvasElement.querySelector('[role="tooltip"]')) {
          throw new Error('still open')
        }
      },
      { timeout: 500 },
    )
  },
}

/**
 * trigger에 focus가 들어오면 bubble이 열린다.
 * `onFocusCapture` 계약 — 키보드 전용 사용자도 tooltip을 볼 수 있어야 한다.
 */
export const FocusOpensBubble: Story = {
  render: () => (
    <Tooltip content="포커스로 열리는 툴팁" delayDuration={0}>
      <Button type="button" variant="outline" size="sm">
        포커스
      </Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const triggerSlot = canvasElement.querySelector('[data-slot="tooltip-trigger"]') as HTMLElement
    if (!triggerSlot) throw new Error('data-slot="tooltip-trigger" 누락')

    // 초기: bubble 없음
    await expect(canvasElement.querySelector('[role="tooltip"]')).toBeNull()

    // focus → bubble 노출
    const btn = canvasElement.querySelector('button') as HTMLElement
    await userEvent.tab()
    // tab으로 포커스가 버튼에 가면 onFocusCapture가 발동
    await waitFor(
      () => {
        if (!canvasElement.querySelector('[role="tooltip"]'))
          throw new Error('포커스 후 bubble 없음')
      },
      { timeout: 500 },
    )
    const bubble = canvasElement.querySelector('[role="tooltip"]')!
    await expect(bubble).toBeVisible()
    await expect(triggerSlot).toHaveAttribute('aria-describedby', bubble.id)

    // blur (Tab out) → 닫힘
    void btn
    await userEvent.tab()
    await waitFor(
      () => {
        if (canvasElement.querySelector('[role="tooltip"]'))
          throw new Error('blur 후에도 열려 있음')
      },
      { timeout: 500 },
    )
  },
}

/**
 * 포커스로 열린 상태에서 Escape 키 → bubble이 닫힌다.
 */
export const EscClosesWhileFocused: Story = {
  render: () => (
    <Tooltip content="Escape로 닫기" delayDuration={0}>
      <Button type="button" variant="outline" size="sm">
        툴팁 버튼
      </Button>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const triggerSlot = canvasElement.querySelector('[data-slot="tooltip-trigger"]') as HTMLElement
    if (!triggerSlot) throw new Error('data-slot="tooltip-trigger" 누락')

    // focus → bubble 열기
    await userEvent.tab()
    await waitFor(
      () => {
        if (!canvasElement.querySelector('[role="tooltip"]'))
          throw new Error('포커스 후 bubble 없음')
      },
      { timeout: 500 },
    )
    await expect(canvasElement.querySelector('[role="tooltip"]')).not.toBeNull()

    // Escape → 닫힘
    await userEvent.keyboard('{Escape}')
    await waitFor(
      () => {
        if (canvasElement.querySelector('[role="tooltip"]'))
          throw new Error('Escape 후에도 열려 있음')
      },
      { timeout: 500 },
    )
  },
}
