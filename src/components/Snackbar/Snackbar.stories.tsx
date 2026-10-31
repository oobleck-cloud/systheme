import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { SnackbarRegion, type SnackRecord } from './Snackbar'
import anatomy from './Snackbar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SnackbarRegion> = {
  title: 'Components/L2/SnackbarRegion',
  component: SnackbarRegion,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof SnackbarRegion>

export const Default: Story = {
  render: () => {
    const [snacks, setSnacks] = useState<SnackRecord[]>([
      { id: '1', message: '항목이 삭제되었습니다.' },
    ])
    return (
      <div>
        <Button
          type="button"
          onClick={() => setSnacks([{ id: String(Date.now()), message: '짧은 알림입니다.' }])}
        >
          스낵바 표시
        </Button>
        <SnackbarRegion
          snacks={snacks}
          onDismiss={(id) => setSnacks((s) => s.filter((x) => x.id !== id))}
          onAction={(id) => setSnacks((s) => s.filter((x) => x.id !== id))}
        />
      </div>
    )
  },
}

export const MessageOnly: Story = {
  render: () => (
    <SnackbarRegion
      snacks={[{ id: 'a', message: '액션 없이 메시지만 표시합니다.' }]}
      onDismiss={() => undefined}
    />
  ),
}

/**
 * dismiss 버튼 클릭 → onDismiss(id) 호출 + 스낵바 제거.
 */
export const DismissCallsOnDismiss: Story = {
  args: { onDismiss: fn() },
  render: (args) => {
    const [snacks, setSnacks] = useState<SnackRecord[]>([
      { id: 'x', message: '스낵바 메시지입니다.' },
    ])
    return (
      <div className="h-32">
        <SnackbarRegion
          {...args}
          snacks={snacks}
          onDismiss={(id) => {
            args.onDismiss?.(id)
            setSnacks((s) => s.filter((x) => x.id !== id))
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeInTheDocument()

    const dismissBtn = canvas.getByRole('button', { name: 'Dismiss' })
    await userEvent.click(dismissBtn)
    await expect(args.onDismiss).toHaveBeenCalledWith('x')

    // 스낵바 제거됨
    await expect(canvas.queryByRole('status')).toBeNull()
  },
}

/**
 * action 버튼 클릭 → onAction(id) 호출.
 */
export const ActionCallsOnAction: Story = {
  args: { onDismiss: fn(), onAction: fn() },
  render: (args) => {
    const [snacks, setSnacks] = useState<SnackRecord[]>([
      { id: 'y', message: '작업을 완료하시겠습니까?' },
    ])
    return (
      <div className="h-32">
        <SnackbarRegion
          {...args}
          snacks={snacks}
          onDismiss={(id) => {
            args.onDismiss?.(id)
            setSnacks((s) => s.filter((x) => x.id !== id))
          }}
          onAction={(id) => {
            args.onAction?.(id)
          }}
          actionLabel="실행"
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toBeInTheDocument()

    const actionBtn = canvas.getByRole('button', { name: '실행' })
    await userEvent.click(actionBtn)
    await expect(args.onAction).toHaveBeenCalledWith('y')
  },
}
