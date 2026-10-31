import { AreaChart } from './AreaChart'
import anatomy from './AreaChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']

const singleData = months.map((m, i) => ({
  x: m,
  revenue: [4200, 3800, 5100, 4700, 6200, 5800, 7100, 6600][i],
}))

const multiData = months.map((m, i) => ({
  x: m,
  web: [2100, 1900, 2600, 2400, 3200, 2900, 3700, 3400][i],
  mobile: [1500, 1400, 1900, 1700, 2300, 2100, 2600, 2400][i],
  api: [600, 500, 600, 600, 700, 800, 800, 800][i],
}))

const meta: Meta<typeof AreaChart> = {
  title: 'Components/Charts/AreaChart',
  component: AreaChart,
  tags: ['autodocs'],
  args: {
    data: singleData,
    keys: ['revenue'],
    seriesNames: ['매출'],
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof AreaChart>

export const Default: Story = {
  args: { title: '월별 매출 추이' },
}

export const MultipleStandard: Story = {
  args: {
    title: '채널별 방문자 (표준)',
    data: multiData,
    keys: ['web', 'mobile', 'api'],
    seriesNames: ['웹', '모바일', 'API'],
    variant: 'standard',
  },
}

export const MultipleStacked: Story = {
  args: {
    title: '채널별 방문자 (누적)',
    data: multiData,
    keys: ['web', 'mobile', 'api'],
    seriesNames: ['웹', '모바일', 'API'],
    variant: 'stacked',
  },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}

const funnelData = ['9/26', '9/27', '9/28', '9/29', '9/30', '10/1', '10/2'].map((x, i) => ({
  x,
  participated: [41, 52, 47, 38, 44, 39, 43][i] ?? 0,
  visible: [35, 44, 40, 31, 37, 33, 36][i] ?? 0,
  won: [4, 6, 5, 3, 5, 4, 4][i] ?? 0,
}))

/** 깔때기 계열(참여 ⊇ 노출 ⊇ 계약) — 위계 순차색, 크기가 작은 계약은 오른쪽 축 막대. */
export const WithRightAxisBars: Story = {
  args: {
    title: '참여 · 노출 · 계약',
    data: funnelData,
    keys: ['participated', 'visible'],
    seriesNames: ['참여', '노출'],
    seriesTokens: ['--ds-chart-status-neutral', '--ds-chart-seq-mid'],
    bars: [{ key: 'won', name: '계약', token: '--ds-chart-seq-high' }],
    height: 240,
  },
}
