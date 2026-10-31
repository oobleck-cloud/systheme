import { fn } from '@storybook/test'

import { ApprovalStepChain } from './ApprovalStepChain'
import anatomy from './ApprovalStepChain.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const steps = [
  { id: 's1', roleLabel: 'Manager', status: 'pending' },
  { id: 's2', roleLabel: 'Finance', status: 'waiting' },
]

const meta: Meta<typeof ApprovalStepChain> = {
  title: 'Components/L2/ApprovalStepChain',
  component: ApprovalStepChain,
  tags: ['autodocs'],
  args: {
    steps,
    onApprove: fn(),
    onReject: fn(),
    onDelegate: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ApprovalStepChain>

export const Default: Story = {}

/** 단일 단계 */
export const SingleStep: Story = {
  args: {
    steps: [{ id: 'only', roleLabel: 'Owner', status: 'approved' }],
  },
}

/** 상태 라벨 매트릭스 */
export const StatusApproved: Story = {
  args: {
    steps: [{ id: 'x', roleLabel: 'Legal', status: 'approved' }],
  },
}

export const StatusRejected: Story = {
  args: {
    steps: [{ id: 'x', roleLabel: 'Legal', status: 'rejected' }],
  },
}

/** 첫 행의 승인·반려·위임 버튼 (동일 행에 연속 클릭) */
export const AnatomyRowActions: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    row: { skip: true },
    role: { skip: true },
    status: { skip: true },
    approve: { onPress: 'onApprove' },
    reject: { onPress: 'onReject' },
    delegate: { onPress: 'onDelegate' },
  }),
}
