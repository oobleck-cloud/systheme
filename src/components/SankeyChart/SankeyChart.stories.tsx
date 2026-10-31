import { fn } from '@storybook/test'

import { SankeyChart } from './SankeyChart'
import anatomy from './SankeyChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const energyNodes = [
  { id: 'coal', name: '석탄' },
  { id: 'gas', name: '가스' },
  { id: 'nuclear', name: '원자력' },
  { id: 'renewables', name: '신재생' },
  { id: 'electricity', name: '전력' },
  { id: 'heat', name: '열에너지' },
  { id: 'industry', name: '산업' },
  { id: 'transport', name: '교통' },
  { id: 'residential', name: '주거' },
]

const energyLinks = [
  { source: 'coal', target: 'electricity', value: 120 },
  { source: 'gas', target: 'electricity', value: 80 },
  { source: 'gas', target: 'heat', value: 40 },
  { source: 'nuclear', target: 'electricity', value: 60 },
  { source: 'renewables', target: 'electricity', value: 50 },
  { source: 'electricity', target: 'industry', value: 150 },
  { source: 'electricity', target: 'transport', value: 70 },
  { source: 'electricity', target: 'residential', value: 90 },
  { source: 'heat', target: 'industry', value: 30 },
  { source: 'heat', target: 'residential', value: 10 },
]

const meta: Meta<typeof SankeyChart> = {
  title: 'Components/Charts/SankeyChart',
  component: SankeyChart,
  tags: ['autodocs'],
  args: {
    nodes: energyNodes,
    links: energyLinks,
    onNodeClick: fn(),
    onLinkClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof SankeyChart>

export const Default: Story = {
  args: { title: '에너지 흐름 다이어그램' },
}

export const UserJourney: Story = {
  args: {
    title: '사용자 이동 경로',
    nodes: [
      { id: 'landing', name: '랜딩' },
      { id: 'signup', name: '가입' },
      { id: 'browse', name: '탐색' },
      { id: 'cart', name: '장바구니' },
      { id: 'checkout', name: '결제' },
      { id: 'exit', name: '이탈' },
    ],
    links: [
      { source: 'landing', target: 'signup', value: 500 },
      { source: 'landing', target: 'browse', value: 1200 },
      { source: 'landing', target: 'exit', value: 800 },
      { source: 'signup', target: 'browse', value: 400 },
      { source: 'browse', target: 'cart', value: 600 },
      { source: 'browse', target: 'exit', value: 1000 },
      { source: 'cart', target: 'checkout', value: 350 },
      { source: 'cart', target: 'exit', value: 250 },
    ],
    height: 320,
  },
}

export const Empty: Story = {
  args: { nodes: [], links: [], title: '빈 데이터' },
}
