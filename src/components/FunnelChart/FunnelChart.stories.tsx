import { fn } from '@storybook/test'

import { FunnelChart } from './FunnelChart'
import anatomy from './FunnelChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const salesFunnel = [
  { category: 'awareness', label: '인지', value: 10000 },
  { category: 'interest', label: '관심', value: 6800 },
  { category: 'consideration', label: '검토', value: 3200 },
  { category: 'intent', label: '의향', value: 1500 },
  { category: 'purchase', label: '구매', value: 620 },
]

const meta: Meta<typeof FunnelChart> = {
  title: 'Components/Charts/FunnelChart',
  component: FunnelChart,
  tags: ['autodocs'],
  args: {
    data: salesFunnel,
    onStageClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof FunnelChart>

export const Default: Story = {
  args: { title: '영업 퍼널' },
}

export const NoConversionRate: Story = {
  args: {
    title: '전환율 없음',
    showConversionRate: false,
  },
}

export const ThreeStage: Story = {
  args: {
    title: '3단계 퍼널',
    data: [
      { category: 'visit', label: '방문', value: 5000 },
      { category: 'signup', label: '가입', value: 1200 },
      { category: 'paid', label: '유료 전환', value: 230 },
    ],
  },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}
