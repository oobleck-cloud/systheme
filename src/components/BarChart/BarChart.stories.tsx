import { fn } from '@storybook/test'

import { BarChart } from './BarChart'
import anatomy from './BarChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const singleData = [
  { category: '1월', revenue: 4200 },
  { category: '2월', revenue: 3800 },
  { category: '3월', revenue: 5100 },
  { category: '4월', revenue: 4700 },
  { category: '5월', revenue: 6200 },
  { category: '6월', revenue: 5800 },
]

const multiData = [
  { category: '1월', 직접: 2100, 간접: 1800, 기타: 300 },
  { category: '2월', 직접: 1900, 간접: 1600, 기타: 300 },
  { category: '3월', 직접: 2600, 간접: 2100, 기타: 400 },
  { category: '4월', 직접: 2400, 간접: 1900, 기타: 400 },
  { category: '5월', 직접: 3200, 간접: 2500, 기타: 500 },
  { category: '6월', 직접: 2900, 간접: 2400, 기타: 500 },
]

const meta: Meta<typeof BarChart> = {
  title: 'Components/Charts/BarChart',
  component: BarChart,
  tags: ['autodocs'],
  args: {
    data: singleData,
    keys: ['revenue'],
    seriesNames: ['매출'],
    onBarClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof BarChart>

export const Default: Story = {
  args: { title: '월별 매출', description: '최근 6개월 매출 현황' },
}

export const Horizontal: Story = {
  args: {
    title: '카테고리별 매출 (수평)',
    variant: 'horizontal',
    height: 280,
  },
}

export const Grouped: Story = {
  args: {
    title: '채널별 월간 매출',
    data: multiData,
    keys: ['직접', '간접', '기타'],
    seriesNames: ['직접 채널', '간접 채널', '기타'],
    variant: 'grouped',
  },
}

export const Stacked: Story = {
  args: {
    title: '채널별 누적 매출',
    data: multiData,
    keys: ['직접', '간접', '기타'],
    seriesNames: ['직접 채널', '간접 채널', '기타'],
    variant: 'stacked',
  },
}

export const Stacked100: Story = {
  name: 'Stacked 100%',
  args: {
    title: '채널별 구성 비율',
    data: multiData,
    keys: ['직접', '간접', '기타'],
    seriesNames: ['직접 채널', '간접 채널', '기타'],
    variant: 'stacked-100',
  },
}

export const ShowValues: Story = {
  args: { title: '값 표시 바 차트', showValues: true },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}

export const LargeDataset: Story = {
  args: {
    title: '일별 방문자',
    data: Array.from({ length: 30 }, (_, i) => ({
      category: `${i + 1}일`,
      value: Math.floor(Math.random() * 1000) + 200,
    })),
    keys: ['value'],
    seriesNames: ['방문자'],
  },
}
