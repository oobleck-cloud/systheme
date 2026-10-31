import { Blockquote } from './Blockquote'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof Blockquote> = {
  title: 'Components/L1/Blockquote',
  component: Blockquote,
  parameters: { layout: 'padded' },
  args: {
    children:
      '"짐이 많은 편이고 저희 부부가 둘 다 직장을 다녀서 포장이나 정리할 시간이 전혀 없어요."',
  },
}
export default meta

type Story = StoryObj<typeof Blockquote>

export const Default: Story = {}

export const Neutral: Story = { args: { tone: 'neutral' } }

export const WithCitation: Story = {
  args: { citation: '고객 발화 · 방문 상담 교육 Part 1' },
}

export const MultiLine: Story = {
  args: {
    children:
      '(가) 가구 몇 개, 가전 몇 개 등 특정 살림만 골라 이전\n(나) 세대 구성원 일부만 이동\n(다) 도착지가 2곳으로 나뉘는 이사',
  },
}
