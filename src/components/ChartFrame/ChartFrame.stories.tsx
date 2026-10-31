import { fn } from '@storybook/test'

import { ChartFrame } from './ChartFrame'
import anatomy from './ChartFrame.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ChartFrame> = {
  title: 'Components/Charts/ChartFrame',
  component: ChartFrame,
  tags: ['autodocs'],
  args: {
    title: '월별 방문자 수',
    description: '최근 6개월 웹사이트 방문자 현황',
    height: 200,
    legendItems: [
      { key: 'series-a', label: '시리즈 A', colorIndex: 1 },
      { key: 'series-b', label: '시리즈 B', colorIndex: 2 },
      { key: 'series-c', label: '시리즈 C', colorIndex: 3 },
    ],
    onLegendItemClick: fn(),
    children: (_dims) => (
      <text x={10} y={20} fontSize={12} fill="currentColor" className="text-fg-muted">
        차트 콘텐츠 영역 (실제 차트가 여기 렌더링됩니다)
      </text>
    ),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof ChartFrame>

export const Default: Story = {}

export const Loading: Story = {
  args: { loading: true },
}

export const Empty: Story = {
  args: { empty: true },
}

export const EmptyCustomContent: Story = {
  args: {
    empty: true,
    emptyContent: (
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm text-fg-muted">데이터를 불러올 수 없습니다</p>
        <button type="button" className="text-xs text-primary underline">
          다시 시도
        </button>
      </div>
    ),
  },
}

export const WithInactiveLegend: Story = {
  args: {
    legendItems: [
      { key: 'series-a', label: '활성 시리즈', colorIndex: 1 },
      { key: 'series-b', label: '비활성 시리즈', colorIndex: 2, inactive: true },
      { key: 'series-c', label: '또 다른 시리즈', colorIndex: 3 },
    ],
  },
}

export const NoTitle: Story = {
  args: { title: undefined, description: undefined },
}

export const Tall: Story = {
  args: { height: 400 },
}
