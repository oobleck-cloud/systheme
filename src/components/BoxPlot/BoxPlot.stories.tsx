import { BoxPlot } from './BoxPlot'
import anatomy from './BoxPlot.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

function normal(mean: number, std: number, n: number) {
  return Array.from({ length: n }, () => {
    const u = 1 - Math.random()
    const v = Math.random()
    return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  })
}

const meta: Meta<typeof BoxPlot> = {
  title: 'Components/Charts/BoxPlot',
  component: BoxPlot,
  tags: ['autodocs'],
  args: {
    data: [
      { label: 'A 그룹', values: normal(50, 12, 200) },
      { label: 'B 그룹', values: normal(65, 18, 200) },
      { label: 'C 그룹', values: normal(45, 8, 200) },
    ],
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof BoxPlot>

export const Default: Story = {
  args: { title: '그룹별 분포 비교' },
}

export const WithColors: Story = {
  args: {
    title: '색상 지정 박스플롯',
    data: [
      { label: 'Control', values: normal(50, 10, 150), colorIndex: 2 },
      { label: 'Treatment A', values: normal(62, 14, 150), colorIndex: 3 },
      { label: 'Treatment B', values: normal(58, 16, 150), colorIndex: 4 },
    ],
  },
}

export const ManyGroups: Story = {
  args: {
    title: '6개 그룹',
    data: Array.from({ length: 6 }, (_, i) => ({
      label: `G${i + 1}`,
      values: normal(40 + i * 8, 10 + i * 2, 100),
      colorIndex: ((i % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6,
    })),
  },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}
