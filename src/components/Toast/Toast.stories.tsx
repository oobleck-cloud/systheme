import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { ToastRegion, type ToastRecord } from './Toast'
import anatomy from './Toast.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ToastRegion> = {
  title: 'Components/L2/ToastRegion',
  component: ToastRegion,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof ToastRegion>

export const Default: Story = {
  render: () => {
    const [items, setItems] = useState<ToastRecord[]>([
      { id: '1', severity: 'success', title: '저장됨', description: '변경 사항이 반영되었습니다.' },
      { id: '2', severity: 'warning', title: '주의', description: '네트워크가 불안정합니다.' },
    ])
    return (
      <div className="space-y-3">
        <Button
          type="button"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                severity: 'info',
                title: '알림',
                description: '새 토스트가 추가되었습니다.',
              },
            ])
          }
        >
          토스트 추가
        </Button>
        <ToastRegion
          toasts={items}
          onDismiss={(id) => setItems((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    )
  },
}

/**
 * dismiss 버튼 클릭 → onDismiss(id) 호출.
 * ToastRegion은 fixed 위치이지만 portal 미사용이므로 canvasElement 내부에서 쿼리 가능.
 */
export const DismissCallsOnDismiss: Story = {
  args: { onDismiss: fn() },
  render: (args) => {
    const [items, setItems] = useState<ToastRecord[]>([
      { id: 'a', severity: 'success', title: '완료', description: '작업이 완료되었습니다.' },
      { id: 'b', severity: 'info', title: '정보', description: '두 번째 알림입니다.' },
    ])
    return (
      <div className="h-64">
        <ToastRegion
          {...args}
          position="top-right"
          toasts={items}
          onDismiss={(id) => {
            args.onDismiss?.(id)
            setItems((prev) => prev.filter((t) => t.id !== id))
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // 두 개의 토스트가 렌더됨
    const statuses = canvas.getAllByRole('status')
    await expect(statuses).toHaveLength(2)

    // 첫 번째 토스트의 dismiss 버튼 클릭
    const dismissBtns = canvas.getAllByRole('button', { name: 'Dismiss notification' })
    await userEvent.click(dismissBtns[0])
    await expect(args.onDismiss).toHaveBeenCalledWith('a')

    // 토스트 하나 남음
    await expect(canvas.getAllByRole('status')).toHaveLength(1)
  },
}

/**
 * 스택 순서: 나중에 추가된 토스트가 목록에 마지막에 위치.
 */
export const StackingOrder: Story = {
  render: () => {
    const [items, setItems] = useState<ToastRecord[]>([
      { id: '1', severity: 'info', title: '첫 번째' },
    ])
    return (
      <div className="h-64">
        <Button
          type="button"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              { id: String(Date.now()), severity: 'success', title: '두 번째' },
            ])
          }
        >
          추가
        </Button>
        <ToastRegion
          position="top-right"
          toasts={items}
          onDismiss={(id) => setItems((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('status')).toHaveLength(1)

    await userEvent.click(canvas.getByRole('button', { name: '추가' }))
    const statuses = canvas.getAllByRole('status')
    await expect(statuses).toHaveLength(2)
    await expect(statuses[0]).toHaveTextContent('첫 번째')
    await expect(statuses[1]).toHaveTextContent('두 번째')
  },
}

/**
 * 오류 — severity=danger. 자동으로 사라지지 않고 사용자가 닫을 때까지 남는다
 * (ToastRegion 은 타이머가 없다 — 생명주기는 호출자가 `open`/목록으로 제어하고, 오류는 지우지 않는다).
 */
export const ErrorToast: Story = {
  render: () => {
    const [items, setItems] = useState<ToastRecord[]>([
      {
        id: 'err-1',
        severity: 'danger',
        title: '견적 발송에 실패했습니다',
        description: '카카오톡 채널이 응답하지 않습니다. 닫기 전까지 이 알림은 유지됩니다.',
      },
    ])
    return (
      <div className="h-64">
        <ToastRegion
          position="top-right"
          toasts={items}
          onDismiss={(id) => setItems((prev) => prev.filter((t) => t.id !== id))}
        />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const status = canvas.getByRole('status')
    await expect(status).toHaveTextContent('견적 발송에 실패했습니다')
    // 자동 닫힘이 없다 — 잠시 기다려도 그대로 남아 있고, 닫기 버튼만이 유일한 출구다
    await new Promise((resolve) => setTimeout(resolve, 300))
    await expect(canvas.getByRole('status')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Dismiss notification' })).toBeVisible()
  },
}
