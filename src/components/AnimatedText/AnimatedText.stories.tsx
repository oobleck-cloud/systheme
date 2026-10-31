'use client'

import { AnimatedText } from './AnimatedText'
import anatomy from './AnimatedText.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof AnimatedText> = {
  title: 'Display/AnimatedText',
  component: AnimatedText,
  tags: ['autodocs'],
  argTypes: {
    speed: { control: { type: 'range', min: 5, max: 100, step: 5 } },
    effect: { control: 'select', options: ['scramble', 'shimmer'] },
    as: { control: 'select', options: ['span', 'p', 'div'] },
  },
  args: {
    value: 'Hello, World!',
    speed: 20,
    effect: 'scramble',
    as: 'span',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof AnimatedText>

export const Default: Story = {}

export const LongText: Story = {
  args: {
    value:
      'AI가 생성한 긴 텍스트가 scramble 효과로 점차 나타납니다. M3 Expressive 모션 레이어의 일부입니다.',
    speed: 15,
  },
}

export const Slow: Story = {
  args: { value: '느리게 나타납니다', speed: 60 },
}

export const AsHeading: Story = {
  args: { value: '단락 텍스트', as: 'p' },
}

export const Shimmer: Story = {
  args: {
    value: '1928892 테스트 4 건 방문 제공',
    effect: 'shimmer',
  },
}
