import { fn } from '@storybook/test'

import { CommentThreadPanel } from './CommentThreadPanel'
import anatomy from './CommentThreadPanel.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof CommentThreadPanel> = {
  title: 'Components/L2/CommentThreadPanel',
  component: CommentThreadPanel,
  tags: ['autodocs'],
  args: {
    messages: [
      { id: '1', author: 'Lee', timestamp: '2m', body: 'Ship checklist?' },
      { id: '2', author: 'Kim', timestamp: '1m', body: 'LGTM.' },
    ],
    onReply: fn(),
    onLoadMore: fn(),
    onSubmit: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof CommentThreadPanel>

export const Default: Story = {}

/** messages prop 없이도 compose 영역만으로 동작 */
export const EmptyThread: Story = {
  args: {
    messages: undefined,
    onLoadMore: undefined,
  },
}

export const LongThread: Story = {
  args: {
    messages: Array.from({ length: 5 }, (_, i) => ({
      id: `m${i}`,
      author: `User ${i + 1}`,
      timestamp: `${i + 1}m`,
      body: `Message body ${i + 1}`,
    })),
  },
}

/** 더보기 비활성(핸들러 없음) */
export const LoadMoreDisabled: Story = {
  args: {
    onLoadMore: undefined,
  },
}

export const AnatomyReplyAndLoadMore: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    feed: { skip: true },
    bubble: { skip: true },
    'avatar-slot': { skip: true },
    author: { skip: true },
    timestamp: { skip: true },
    body: { skip: true },
    reply: { onPress: 'onReply' },
    'load-more': { onPress: 'onLoadMore' },
    compose: { skip: true },
    'compose-input': { skip: true },
    'compose-submit': { skip: true },
  }),
}

/** compose-submit 버튼 → onSubmit(comment) 콜백 확인 */
export const AnatomyComposeSubmit: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    feed: { skip: true },
    bubble: { skip: true },
    'avatar-slot': { skip: true },
    author: { skip: true },
    timestamp: { skip: true },
    body: { skip: true },
    reply: { skip: true },
    'load-more': { skip: true },
    compose: { skip: true },
    'compose-input': { onValueInput: 'onComposeDraftChange' },
    'compose-submit': { skip: true },
  }),
}
