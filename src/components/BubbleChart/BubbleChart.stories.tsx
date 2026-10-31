import { fn } from '@storybook/test'

import { BubbleChart } from './BubbleChart'
import anatomy from './BubbleChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const countries = [
  { x: 68, y: 78, size: 1400, label: '한국' },
  { x: 72, y: 82, size: 1300, label: '일본' },
  { x: 65, y: 74, size: 500, label: '캐나다' },
  { x: 60, y: 71, size: 330, label: '프랑스' },
  { x: 58, y: 69, size: 210, label: '독일' },
  { x: 55, y: 66, size: 170, label: '영국' },
  { x: 50, y: 63, size: 140, label: '이탈리아' },
  { x: 48, y: 61, size: 110, label: '스페인' },
]

const multiData = [
  {
    key: 'tech',
    name: '기술',
    data: [
      { x: 85, y: 90, size: 500, label: 'A사' },
      { x: 75, y: 82, size: 320, label: 'B사' },
      { x: 65, y: 74, size: 180, label: 'C사' },
    ],
  },
  {
    key: 'finance',
    name: '금융',
    data: [
      { x: 60, y: 70, size: 400, label: 'D사' },
      { x: 50, y: 65, size: 250, label: 'E사' },
      { x: 40, y: 55, size: 150, label: 'F사' },
    ],
  },
]

const meta: Meta<typeof BubbleChart> = {
  title: 'Components/Charts/BubbleChart',
  component: BubbleChart,
  tags: ['autodocs'],
  args: {
    series: [{ key: 'countries', name: '국가', data: countries }],
    onBubbleClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof BubbleChart>

export const Default: Story = {
  args: {
    title: '국가별 지표 비교',
    xLabel: 'X 지표',
    yLabel: 'Y 지표',
    sizeLabel: '규모',
  },
}

export const MultiSeries: Story = {
  args: {
    title: '산업별 기업 비교',
    series: multiData,
    xLabel: '성장률',
    yLabel: '수익성',
    sizeLabel: '시가총액',
  },
}

export const Empty: Story = {
  args: { series: [], title: '빈 데이터' },
}
