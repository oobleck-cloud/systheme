import { fn } from '@storybook/test'

import { SunburstChart } from './SunburstChart'
import anatomy from './SunburstChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const orgData = {
  name: '전사',
  children: [
    {
      name: '개발',
      children: [
        { name: '프론트엔드', value: 12 },
        { name: '백엔드', value: 15 },
        { name: '인프라', value: 6 },
        { name: 'QA', value: 4 },
      ],
    },
    {
      name: '디자인',
      children: [
        { name: 'UI/UX', value: 7 },
        { name: '브랜드', value: 3 },
      ],
    },
    {
      name: '비즈니스',
      children: [
        { name: '영업', value: 8 },
        { name: '마케팅', value: 6 },
        { name: '고객성공', value: 5 },
      ],
    },
    {
      name: '운영',
      children: [
        { name: '인사', value: 4 },
        { name: '재무', value: 3 },
        { name: '법무', value: 2 },
      ],
    },
  ],
}

const meta: Meta<typeof SunburstChart> = {
  title: 'Components/Charts/SunburstChart',
  component: SunburstChart,
  tags: ['autodocs'],
  args: {
    data: orgData,
    onNodeClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof SunburstChart>

export const Default: Story = {
  args: { title: '조직 구조' },
}

export const MaxDepth2: Story = {
  args: { title: '2단계까지', maxDepth: 1 },
}

export const Empty: Story = {
  args: { data: { name: '빈', children: [] }, title: '빈 데이터' },
}
