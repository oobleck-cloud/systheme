import { fn } from '@storybook/test'

import { ScatterPlot } from './ScatterPlot'
import anatomy from './ScatterPlot.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

function randomCluster(cx: number, cy: number, spread: number, n: number) {
  return Array.from({ length: n }, () => ({
    x: cx + (Math.random() - 0.5) * spread,
    y: cy + (Math.random() - 0.5) * spread,
  }))
}

const singleSeries = [{ key: 'data', name: '데이터', data: randomCluster(50, 50, 60, 80) }]

const multiSeries = [
  { key: 'cluster-a', name: '클러스터 A', data: randomCluster(30, 40, 30, 40) },
  { key: 'cluster-b', name: '클러스터 B', data: randomCluster(70, 60, 25, 35) },
  { key: 'cluster-c', name: '클러스터 C', data: randomCluster(50, 80, 20, 30) },
]

const meta: Meta<typeof ScatterPlot> = {
  title: 'Components/Charts/ScatterPlot',
  component: ScatterPlot,
  tags: ['autodocs'],
  args: {
    series: singleSeries,
    onPointClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof ScatterPlot>

export const Default: Story = {
  args: { title: '산점도', xLabel: 'X 지표', yLabel: 'Y 지표' },
}

export const MultiCluster: Story = {
  args: {
    title: '3개 클러스터',
    series: multiSeries,
    xLabel: 'X 값',
    yLabel: 'Y 값',
  },
}

export const SmallDots: Story = {
  args: { title: '소형 점', dotRadius: 3 },
}

export const Empty: Story = {
  args: { series: [], title: '빈 데이터' },
}
