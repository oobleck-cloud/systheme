import { fn } from '@storybook/test'

import { TreemapChart } from './TreemapChart'
import anatomy from './TreemapChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const budgetData = {
  name: '예산',
  children: [
    {
      name: '인건비',
      children: [
        { name: '개발', value: 2400 },
        { name: '디자인', value: 1200 },
        { name: '마케팅', value: 900 },
        { name: 'CS', value: 600 },
      ],
    },
    {
      name: '인프라',
      children: [
        { name: '서버', value: 800 },
        { name: 'SaaS', value: 400 },
        { name: '보안', value: 300 },
      ],
    },
    {
      name: '마케팅',
      children: [
        { name: '광고', value: 1500 },
        { name: '이벤트', value: 600 },
        { name: '콘텐츠', value: 400 },
      ],
    },
    {
      name: '기타',
      children: [
        { name: '법무', value: 350 },
        { name: '회계', value: 250 },
      ],
    },
  ],
}

const meta: Meta<typeof TreemapChart> = {
  title: 'Components/Charts/TreemapChart',
  component: TreemapChart,
  tags: ['autodocs'],
  args: {
    data: budgetData,
    onCellClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof TreemapChart>

export const Default: Story = {
  args: { title: '부서별 예산 배분' },
}

export const Tall: Story = {
  args: { title: '세로형', height: 500 },
}

export const Empty: Story = {
  args: { data: { name: '빈', children: [] }, title: '빈 데이터' },
}
