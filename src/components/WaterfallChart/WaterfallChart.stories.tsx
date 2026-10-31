import { fn } from '@storybook/test'

import { WaterfallChart } from './WaterfallChart'
import anatomy from './WaterfallChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const financialData = [
  { category: '매출', value: 5000 },
  { category: '원가', value: -2100 },
  { category: '인건비', value: -800 },
  { category: '마케팅', value: -450 },
  { category: '관리비', value: -320 },
  { category: '순이익', value: 0, type: 'total' as const },
]

const meta: Meta<typeof WaterfallChart> = {
  title: 'Components/Charts/WaterfallChart',
  component: WaterfallChart,
  tags: ['autodocs'],
  args: {
    data: financialData,
    onBarClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof WaterfallChart>

export const Default: Story = {
  args: { title: '손익 분석' },
}

export const WithPositiveChanges: Story = {
  args: {
    title: '월별 수익 변화',
    data: [
      { category: '1월', value: 1000 },
      { category: '+신규', value: 500 },
      { category: '-이탈', value: -200 },
      { category: '+업셀', value: 300 },
      { category: '2월', value: 0, type: 'total' as const },
    ],
  },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}
