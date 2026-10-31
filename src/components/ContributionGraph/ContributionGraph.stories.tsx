import { ContributionGraph } from './ContributionGraph'
import anatomy from './ContributionGraph.anatomy.json'

import type { GraphCell } from './ContributionGraph'
import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const REGIONS = ['서울_01', '서울_02', '고양', '부천'] as const
const DAYS = Array.from({ length: 14 }, (_, i) => String(i + 1))

function buildSampleData(): GraphCell[] {
  const cells: GraphCell[] = []
  for (const y of REGIONS) {
    for (const x of DAYS) {
      const day = Number(x)
      const base = (day + y.length) % 5
      cells.push({ x, y, value: base })
    }
  }
  return cells
}

const meta: Meta<typeof ContributionGraph> = {
  title: 'Components/Charts/ContributionGraph',
  component: ContributionGraph,
  tags: ['autodocs'],
  args: {
    data: buildSampleData(),
    xLabels: DAYS,
    yLabels: [...REGIONS],
    density: 'comfortable',
    summary: '샘플 56건',
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['compact', 'comfortable'] },
    primary: { control: 'inline-radio', options: ['green', 'red', 'blue', 'amber'] },
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ContributionGraph>

export const Default: Story = {}

export const Compact: Story = {
  args: {
    density: 'compact',
  },
}

/** primary green + level 0만 red (인원 공백). */
export const GreenWithRedEmpty: Story = {
  args: {
    primary: 'green',
    colorScale: { 0: 'bg-red-100' },
  },
}

export const RedPrimary: Story = {
  args: {
    primary: 'red',
  },
}

/** Level 0–5 전부 직접 지정. */
export const FullCustomScale: Story = {
  args: {
    colorScale: {
      0: 'bg-red-50',
      1: 'bg-amber-200 text-white',
      2: 'bg-amber-300 text-white',
      3: 'bg-amber-400 text-white',
      4: 'bg-amber-500 text-white',
      5: 'bg-amber-600 text-white',
    },
  },
}

/** 주문 상세 `detailPanelClass` — `rounded-lg bg-surface shadow-sm` */
export const InFloatingCard: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-full rounded-lg bg-surface p-5 shadow-sm">
        <p className="mb-3 text-xs font-bold tracking-wider text-fg-muted uppercase">
          구역 × 날짜 인원수
        </p>
        <Story />
      </div>
    ),
  ],
  args: {
    stickyTone: 'card',
  },
}

export const WithCellValues: Story = {
  args: {
    showCellValues: true,
    density: 'comfortable',
  },
}

export const DenseMonth: Story = {
  args: {
    xLabels: Array.from({ length: 31 }, (_, i) => String(i + 1)),
    yLabels: [
      '서울_01',
      '서울_02',
      '서울_04',
      '서울_06',
      '서울_07',
      '서울_10',
      '서울_3A',
      '서울_5A',
      '고양',
      '부천',
      '김포',
    ],
    summary: '2026-05 · 총 배치 292건',
    data: (() => {
      const rows = [
        '서울_01',
        '서울_02',
        '서울_04',
        '서울_06',
        '서울_07',
        '서울_10',
        '서울_3A',
        '서울_5A',
        '고양',
        '부천',
        '김포',
      ]
      const out: GraphCell[] = []
      for (const y of rows) {
        for (let d = 1; d <= 31; d++) {
          const v = (d * y.length) % 6
          out.push({ x: String(d), y, value: v })
        }
      }
      return out
    })(),
  },
}

export const DenseMonthWithValues: Story = {
  ...DenseMonth,
  args: {
    ...DenseMonth.args,
    showCellValues: true,
    density: 'comfortable',
  },
}

export const DenseMonthCompact: Story = {
  ...DenseMonth,
  args: {
    ...DenseMonth.args,
    density: 'compact',
  },
}

export const WithCellClick: Story = {
  args: {
    onCellClick: () => undefined,
  },
}
