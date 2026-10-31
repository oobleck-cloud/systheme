import { expect, fn } from '@storybook/test'

import { SparklineChart } from './SparklineChart'
import anatomy from './SparklineChart.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SparklineChart> = {
  title: 'Components/Charts/SparklineChart',
  component: SparklineChart,
  tags: ['autodocs'],
  args: {
    segments: [
      { id: 'a', value: 1 },
      { id: 'b', value: 4 },
      { id: 'c', value: 3 },
      { id: 'd', value: 6 },
    ],
    ticks: [
      { id: 't0', label: 'Mon' },
      { id: 't1', label: 'Thu' },
    ],
    onPointSelect: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof SparklineChart>

export const Default: Story = {}

/** 단일 포인트(폴리라인 없음) */
export const SingleSegment: Story = {
  args: {
    segments: [{ id: 'only', value: 5 }],
    ticks: [{ id: 't', label: 'Now' }],
  },
}

/** 평탄한 시계열 */
export const FlatSeries: Story = {
  args: {
    segments: [
      { id: 'x1', value: 2 },
      { id: 'x2', value: 2 },
      { id: 'x3', value: 2 },
    ],
    ticks: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
      { id: 'c', label: 'C' },
    ],
  },
}

/** 축 라벨 수 변형 */
export const ManyTicks: Story = {
  args: {
    segments: [
      { id: '1', value: 10 },
      { id: '2', value: 8 },
    ],
    ticks: [
      { id: 'w1', label: 'W1' },
      { id: 'w2', label: 'W2' },
      { id: 'w3', label: 'W3' },
      { id: 'w4', label: 'W4' },
    ],
  },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    series: { skip: true },
    segment: { skip: true },
    axis: { skip: true },
    'tick-label': { skip: true },
    'point-hit': { onPress: 'onPointSelect' },
  }),
}

export const PointHitTargetsFirstSegment: Story = {
  play: async ({ canvasElement, args }) => {
    const hit = canvasElement.querySelector('[data-slot="sparkline-chart-point-hit"]')
    await expect(hit).toBeTruthy()
    hit?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await expect(args.onPointSelect).toHaveBeenCalled()
  },
}
