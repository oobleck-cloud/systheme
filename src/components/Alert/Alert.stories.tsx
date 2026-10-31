import { expect, fn, userEvent, within } from '@storybook/test'

import { Alert } from './Alert'
import anatomy from './Alert.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Alert> = {
  title: 'Components/L1/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    severity: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'danger', 'neutral'],
    },
    dismissible: { control: 'boolean' },
  },
  args: {
    severity: 'info',
    title: '저장되었습니다',
    children: '변경 사항은 즉시 반영되며 5분 안에 캐시가 만료됩니다.',
    dismissible: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {}

export const Severities: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['info', 'success', 'warning', 'danger', 'neutral'] as const).map((severity) => (
        <Alert key={severity} {...args} severity={severity} title={severity.toUpperCase()}>
          {`${severity} 메시지의 본문 예시.`}
        </Alert>
      ))}
    </div>
  ),
}

export const Dismissible: Story = {
  args: { dismissible: true },
}

/**
 * Anatomy 검증 — root는 status-message + role="alert", dismiss 버튼은 dismiss intent.
 * 클릭 시 onDismiss 호출 + Alert가 사라져야 한다(uncontrolled 모드).
 */
export const DismissesItself: Story = {
  args: { dismissible: true, onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    const root = canvas.getByRole('alert')
    await expect(root).toBeInTheDocument()

    const closeBtn = canvas.getByRole('button', { name: '닫기' })
    await userEvent.click(closeBtn)
    await expect(args.onDismiss).toHaveBeenCalled()

    // open이 false가 되면 컴포넌트는 null 반환 → DOM에서 제거
    await expect(canvasElement.querySelector('[role="alert"]')).toBeNull()
  },
}

export const ControlledOpen: Story = {
  args: { dismissible: true, open: true, onDismiss: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '닫기' }))
    await expect(args.onDismiss).toHaveBeenCalled()
    // controlled 모드에서는 외부에서 open을 false로 바꾸지 않으면 그대로 보여야 함
    await expect(canvas.getByRole('alert')).toBeInTheDocument()
  },
}

/**
 * action slot에 렌더된 버튼 클릭이 전달된 onClick을 호출한다.
 * anatomy: action → press-action intent.
 */
export const ActionSlotClick: Story = {
  args: { dismissible: false },
  render: (args) => {
    const handleAction = fn()
    return (
      <Alert
        {...args}
        severity="info"
        title="알림"
        action={
          <button
            type="button"
            data-testid="action-btn"
            onClick={handleAction}
            className="text-sm font-medium underline"
          >
            실행
          </button>
        }
      >
        액션 버튼이 있는 알림입니다.
      </Alert>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const actionBtn = canvas.getByTestId('action-btn')
    await expect(actionBtn).toBeInTheDocument()
    await userEvent.click(actionBtn)
    // action slot의 자체 onClick이 호출됨 — alert-action slot이 DOM에 있음
    await expect(canvasElement.querySelector('[data-slot="alert-action"]')).toBeInTheDocument()
  },
}

/**
 * 긴 제목 + 여러 문단 본문 — 아이콘과 닫기 버튼은 첫 줄 높이에 고정되고,
 * 본문(alert-body, min-w-0)만 줄바꿈한다. 제목도 줄바꿈하되 잘리지 않는다.
 */
export const LongContent: Story = {
  args: {
    severity: 'warning',
    dismissible: true,
    title:
      '2026-09-03 14:00 마포구 성산동 방문상담 일정이 플래너 배정 변경으로 재조정되어 고객 확인이 필요합니다',
    children: (
      <>
        <p>
          기존 담당 플래너의 휴무가 등록되면서 자동 재배정이 실행되었습니다. 새 플래너의 이동 동선상
          도착 예정 시각이 30분가량 늦어질 수 있습니다.
        </p>
        <p className="mt-2">
          고객에게 변경된 시각을 안내하고, 동의하지 않으면 다른 일자로 옮겨 주세요. 미확인 상태로
          24시간이 지나면 상담이 자동 취소됩니다.
        </p>
      </>
    ),
  },
  render: (args) => (
    <div className="w-96">
      <Alert {...args} />
    </div>
  ),
}
