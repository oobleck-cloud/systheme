import { fn } from '@storybook/test'

import { PieChart } from './PieChart'
import anatomy from './PieChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const data = [
  { category: 'direct', label: '직접', value: 4200 },
  { category: 'organic', label: '자연 검색', value: 3100 },
  { category: 'referral', label: '추천', value: 1800 },
  { category: 'social', label: '소셜', value: 900 },
  { category: 'email', label: '이메일', value: 600 },
]

const meta: Meta<typeof PieChart> = {
  title: 'Components/Charts/PieChart',
  component: PieChart,
  tags: ['autodocs'],
  args: {
    data,
    onSliceClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof PieChart>

export const Default: Story = {
  args: { title: '트래픽 소스별 비율', variant: 'pie' },
}

export const Donut: Story = {
  args: {
    title: '트래픽 소스별 비율 (도넛)',
    variant: 'donut',
    centerLabel: '10,600',
    centerSublabel: '전체 방문자',
  },
}

export const DonutNoCenter: Story = {
  args: {
    title: '도넛 (중앙 라벨 없음)',
    variant: 'donut',
  },
}

export const FewSlices: Story = {
  args: {
    title: '2개 슬라이스',
    data: [
      { category: 'a', label: '성공', value: 78 },
      { category: 'b', label: '실패', value: 22 },
    ],
    variant: 'donut',
    centerLabel: '78%',
    centerSublabel: '성공률',
  },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}
