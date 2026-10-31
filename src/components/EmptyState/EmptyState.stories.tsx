import { Button } from '../Button/Button'

import { EmptyState } from './EmptyState'
import anatomy from './EmptyState.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof EmptyState> = {
  title: 'Components/L1/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof EmptyState>

const BoxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
)

export const Default: Story = {
  args: {
    title: '결과가 없습니다',
    message: '필터를 바꾸거나 검색어를 조정해 보세요.',
    illustration: <BoxIcon />,
    secondaryAction: (
      <Button type="button" variant="outline" size="sm">
        필터 초기화
      </Button>
    ),
    primaryAction: (
      <Button type="button" variant="primary" size="sm">
        새로 만들기
      </Button>
    ),
  },
}

const AlertTriangleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
)

/** 오류 — 제목이 "무엇이" 실패했는지 말하고, 주 액션은 항상 "다시 시도" 다. */
export const LoadError: Story = {
  args: {
    title: '상담 목록을 불러오지 못했습니다',
    message:
      '네트워크 연결을 확인한 뒤 다시 시도해 주세요. 문제가 계속되면 관리자에게 알려 주세요.',
    illustration: <AlertTriangleIcon />,
    primaryAction: (
      <Button type="button" variant="primary" size="sm">
        다시 시도
      </Button>
    ),
  },
}
