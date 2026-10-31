import { Badge } from './Badge'
import anatomy from './Badge.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Badge> = {
  title: 'Components/L1/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'primary',
        'success',
        'warning',
        'error',
        'info',
        'outline',
        'outline-primary',
        'outline-success',
        'outline-warning',
        'outline-error',
        'outline-info',
      ],
    },
    size: { control: 'select', options: ['sm', 'md'] },
    dot: { control: 'boolean' },
    dotColor: {
      control: 'select',
      options: [undefined, 'success', 'warning', 'error', 'info'],
    },
    children: { control: 'text' },
  },
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
    dot: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge {...args} variant="default">
          Default
        </Badge>
        <Badge {...args} variant="primary">
          Primary
        </Badge>
        <Badge {...args} variant="success">
          Success
        </Badge>
        <Badge {...args} variant="warning">
          Warning
        </Badge>
        <Badge {...args} variant="error">
          Error
        </Badge>
        <Badge {...args} variant="info">
          Info
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge {...args} variant="outline">
          Outline
        </Badge>
        <Badge {...args} variant="outline-primary">
          Primary
        </Badge>
        <Badge {...args} variant="outline-success">
          Success
        </Badge>
        <Badge {...args} variant="outline-warning">
          Warning
        </Badge>
        <Badge {...args} variant="outline-error">
          Error
        </Badge>
        <Badge {...args} variant="outline-info">
          Info
        </Badge>
      </div>
    </div>
  ),
}

export const WithDot: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge {...args} variant="default" dot>
          Default
        </Badge>
        <Badge {...args} variant="primary" dot>
          Primary
        </Badge>
        <Badge {...args} variant="success" dot>
          Success
        </Badge>
        <Badge {...args} variant="warning" dot>
          Warning
        </Badge>
        <Badge {...args} variant="error" dot>
          Error
        </Badge>
        <Badge {...args} variant="info" dot>
          Info
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge {...args} variant="outline" dot>
          Outline
        </Badge>
        <Badge {...args} variant="outline-primary" dot>
          Primary
        </Badge>
        <Badge {...args} variant="outline-success" dot>
          Success
        </Badge>
        <Badge {...args} variant="outline-warning" dot>
          Warning
        </Badge>
        <Badge {...args} variant="outline-error" dot>
          Error
        </Badge>
        <Badge {...args} variant="outline-info" dot>
          Info
        </Badge>
      </div>
    </div>
  ),
}

/** 중립 배지 + variant 색과 독립적인 상태 점(dotColor) 조합 */
export const NeutralWithStatusDot: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge {...args} size="sm" dotColor="success">
        v12 활성
      </Badge>
      <Badge {...args} size="sm" dotColor="warning">
        발행 대기 3
      </Badge>
      <Badge {...args} size="sm" dotColor="error">
        검증 실패 1
      </Badge>
      <Badge {...args} size="sm" dotColor="info">
        동기화 중
      </Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Badge {...args} size="sm" dot>
        Small
      </Badge>
      <Badge {...args} size="md" dot>
        Medium
      </Badge>
    </div>
  ),
}

/**
 * 긴 라벨 — 배지는 줄바꿈하지 않는다(whitespace-nowrap). 폭이 모자라면 배지가 늘어나는 게 아니라
 * 부모가 폭을 제한하고 라벨을 잘라야 한다(두 번째 예: 안쪽 span 에 truncate).
 */
export const LongLabel: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <Badge {...args} variant="info" dot>
        방문상담 예약 확정 · 2026-09-03 14:00 · 마포구 성산동 · 담당 김민수
      </Badge>
      <div className="w-48 rounded-md border border-dashed border-border p-2">
        <Badge {...args} variant="outline" className="max-w-full">
          <span className="truncate">
            방문상담 예약 확정 · 2026-09-03 14:00 · 마포구 성산동 · 담당 김민수
          </span>
        </Badge>
      </div>
    </div>
  ),
}
