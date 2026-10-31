import { RadarChart } from './RadarChart'
import anatomy from './RadarChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const axes = ['커뮤니케이션', '기술력', '리더십', '창의성', '분석력', '협업']

const singleSeries = [
  {
    key: 'employee-a',
    name: '직원 A',
    data: { 커뮤니케이션: 85, 기술력: 92, 리더십: 70, 창의성: 78, 분석력: 88, 협업: 82 },
  },
]

const multiSeries = [
  {
    key: 'employee-a',
    name: '직원 A',
    data: { 커뮤니케이션: 85, 기술력: 92, 리더십: 70, 창의성: 78, 분석력: 88, 협업: 82 },
  },
  {
    key: 'employee-b',
    name: '직원 B',
    data: { 커뮤니케이션: 72, 기술력: 68, 리더십: 90, 창의성: 85, 분석력: 65, 협업: 94 },
  },
]

const meta: Meta<typeof RadarChart> = {
  title: 'Components/Charts/RadarChart',
  component: RadarChart,
  tags: ['autodocs'],
  args: {
    series: singleSeries,
    axes,
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof RadarChart>

export const Default: Story = {
  args: { title: '역량 평가' },
}

export const MultiSeries: Story = {
  args: {
    title: '직원 역량 비교',
    series: multiSeries,
  },
}

export const FewAxes: Story = {
  args: {
    title: '4개 축',
    axes: ['속도', '품질', '비용', '신뢰성'],
    series: [
      {
        key: 'product-a',
        name: '제품 A',
        data: { 속도: 80, 품질: 90, 비용: 60, 신뢰성: 85 },
      },
      {
        key: 'product-b',
        name: '제품 B',
        data: { 속도: 95, 품질: 70, 비용: 85, 신뢰성: 75 },
      },
    ],
    maxValue: 100,
  },
}

export const Empty: Story = {
  args: { series: [], axes: [], title: '빈 데이터' },
}
