import { fn } from '@storybook/test'

import { LineChart } from './LineChart'
import anatomy from './LineChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

const singleSeries = [
  {
    key: 'visitors',
    name: '방문자',
    data: months.map((m, i) => ({ x: i, y: [1200, 980, 1450, 1300, 1800, 1600][i], label: m })),
  },
]

const multiSeries = [
  {
    key: 'new',
    name: '신규',
    data: months.map((m, i) => ({ x: i, y: [400, 320, 580, 450, 720, 640][i], label: m })),
  },
  {
    key: 'returning',
    name: '재방문',
    data: months.map((m, i) => ({ x: i, y: [800, 660, 870, 850, 1080, 960][i], label: m })),
  },
]

const meta: Meta<typeof LineChart> = {
  title: 'Components/Charts/LineChart',
  component: LineChart,
  tags: ['autodocs'],
  args: {
    series: singleSeries,
    onPointClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof LineChart>

export const Default: Story = {
  args: { title: '월별 방문자', description: '최근 6개월 방문자 현황' },
}

export const WithArea: Story = {
  args: { title: '방문자 (에리어)', showArea: true },
}

export const MultiSeries: Story = {
  args: {
    title: '신규 vs 재방문',
    series: multiSeries,
  },
}

export const MultiSeriesWithArea: Story = {
  args: {
    title: '신규 vs 재방문 (에리어)',
    series: multiSeries,
    showArea: true,
  },
}

export const NoDots: Story = {
  args: { title: '점 없는 라인', showDots: false },
}

export const StraightLines: Story = {
  args: { title: '직선 라인', curved: false },
}

export const Empty: Story = {
  args: { series: [], title: '빈 데이터' },
}
