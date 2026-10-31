import { fn } from '@storybook/test'

import { Histogram } from './Histogram'
import anatomy from './Histogram.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

function normalRandom(mean: number, std: number) {
  const u = 1 - Math.random()
  const v = Math.random()
  return mean + std * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const normalData = Array.from({ length: 500 }, () => normalRandom(50, 15))
const skewedData = Array.from({ length: 300 }, () => Math.pow(Math.random(), 3) * 100)

const meta: Meta<typeof Histogram> = {
  title: 'Components/Charts/Histogram',
  component: Histogram,
  tags: ['autodocs'],
  args: {
    data: normalData,
    onBinClick: fn(),
  },
}
mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)
export default meta

type Story = StoryObj<typeof Histogram>

export const Default: Story = {
  args: { title: '정규 분포 (n=500)' },
}

export const CustomBins: Story = {
  args: { title: '10개 구간', bins: 10 },
}

export const FineBins: Story = {
  args: { title: '30개 구간', bins: 30 },
}

export const Skewed: Story = {
  args: {
    title: '우편향 분포',
    data: skewedData,
    colorIndex: 3,
  },
}

export const Empty: Story = {
  args: { data: [], title: '빈 데이터' },
}
