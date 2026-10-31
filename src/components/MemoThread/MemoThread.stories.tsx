import { fn } from '@storybook/test'

import { MemoThread } from './MemoThread'
import anatomy from './MemoThread.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const comments = Array.from({ length: 6 }, (_, i) => ({
  id: `c${i + 1}`,
  author: i % 2 === 0 ? '김플래너' : '이운영',
  timestamp: `${i + 1}시간 전`,
  body: `댓글 본문 ${i + 1} — 고객 통화 후 메모입니다.`,
}))

const meta: Meta<typeof MemoThread> = {
  title: 'Components/L2/MemoThread',
  component: MemoThread,
  tags: ['autodocs'],
  args: {
    author: '박운영',
    timestamp: '2026.05.24 13:11',
    body: '고객 통화 완료. 이사일 6/15 확정, 방문 상담 희망.',
    comments,
    onSubmitComment: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-lg border border-border bg-background p-4">
        <Story />
      </div>
    ),
  ],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MemoThread>

/** Facebook 패턴 — 접힘 시 최근 2개만, 상단에 "N개 모두 보기" */
export const Default: Story = {}

export const Expanded: Story = {
  args: { defaultExpanded: true },
}

export const FewComments: Story = {
  args: { comments: comments.slice(0, 2) },
}

export const NoComments: Story = {
  args: { comments: [] },
}

export const DeletedMemo: Story = {
  args: { deleted: true, comments: comments.slice(0, 2) },
}

export const LongThread: Story = {
  args: {
    comments: Array.from({ length: 22 }, (_, i) => ({
      id: `c${i + 1}`,
      author: i % 2 === 0 ? '김플래너' : '이운영',
      timestamp: `${i + 1}시간 전`,
      body: `댓글 ${i + 1}`,
      createdAt: new Date(Date.now() - (22 - i) * 3_600_000).toISOString(),
    })),
  },
}
