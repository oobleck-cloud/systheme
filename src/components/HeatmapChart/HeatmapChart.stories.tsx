import { fn } from '@storybook/test'

import { HeatmapChart } from './HeatmapChart'
import anatomy from './HeatmapChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const days = ['월', '화', '수', '목', '금', '토', '일']
const hours = ['0시', '4시', '8시', '12시', '16시', '20시']

const activityData = days.flatMap((day) =>
  hours.map((hour) => ({
    x: day,
    y: hour,
    value: Math.floor(Math.random() * 100),
  })),
)

const correlationLabels = ['매출', '방문자', '전환율', '이탈률', '체류시간']
const correlationData = correlationLabels.flatMap((x) =>
  correlationLabels.map((y) => ({
    x,
    y,
    value: x === y ? 1 : parseFloat((Math.random() * 2 - 1).toFixed(2)),
  })),
)

const meta: Meta<typeof HeatmapChart> = {
  title: 'Components/Charts/HeatmapChart',
  component: HeatmapChart,
  tags: ['autodocs'],
  args: {
    data: activityData,
    xLabels: days,
    yLabels: hours,
    onCellClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof HeatmapChart>

export const Default: Story = {
  args: { title: '요일×시간 활동 히트맵' },
}

export const ShowValues: Story = {
  args: { title: '값 표시 히트맵', showValues: true },
}

export const CorrelationMatrix: Story = {
  args: {
    title: '상관관계 매트릭스',
    data: correlationData,
    xLabels: correlationLabels,
    yLabels: correlationLabels,
    showValues: true,
    formatValue: (v) => v.toFixed(2),
  },
}

export const Empty: Story = {
  args: { data: [], xLabels: [], yLabels: [], title: '빈 데이터' },
}
