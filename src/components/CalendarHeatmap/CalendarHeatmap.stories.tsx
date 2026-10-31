import { fn } from '@storybook/test'

import { CalendarHeatmap } from './CalendarHeatmap'
import anatomy from './CalendarHeatmap.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

function generateData(startDate: string, days: number) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return {
      date: d.toISOString().slice(0, 10),
      value: Math.floor(Math.pow(Math.random(), 2) * 30),
    }
  })
}

const meta: Meta<typeof CalendarHeatmap> = {
  title: 'Components/Charts/CalendarHeatmap',
  component: CalendarHeatmap,
  tags: ['autodocs'],
  args: {
    data: generateData('2025-01-01', 365),
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    onDayClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof CalendarHeatmap>

export const Default: Story = {
  args: { title: '2025년 활동 현황' },
}

export const ThreeMonths: Story = {
  args: {
    title: '최근 3개월',
    data: generateData('2025-10-01', 92),
    startDate: '2025-10-01',
    endDate: '2025-12-31',
  },
}

export const SmallCells: Story = {
  args: { title: '소형 셀', cellSize: 10 },
}

export const Empty: Story = {
  args: { data: [], title: '활동 없음' },
}
