import { GaugeChart } from './GaugeChart'
import anatomy from './GaugeChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof GaugeChart> = {
  title: 'Components/Charts/GaugeChart',
  component: GaugeChart,
  tags: ['autodocs'],
  args: {
    value: 68,
    min: 0,
    max: 100,
    valueLabel: '달성률',
    unit: '%',
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof GaugeChart>

export const Default: Story = {
  args: { title: 'KPI 달성률' },
}

export const Low: Story = {
  args: { value: 18, title: '낮은 값' },
}

export const High: Story = {
  args: { value: 92, title: '높은 값' },
}

export const CustomRange: Story = {
  args: {
    title: '응답 시간',
    value: 320,
    min: 0,
    max: 1000,
    unit: 'ms',
    valueLabel: 'Avg Response Time',
    thresholds: [
      { value: 0.3, status: 'positive' },
      { value: 0.7, status: 'warning' },
      { value: 1, status: 'negative' },
    ],
    formatValue: (v) => String(Math.round(v)),
  },
}

export const AtMax: Story = {
  args: { value: 100, title: '최대 달성' },
}
