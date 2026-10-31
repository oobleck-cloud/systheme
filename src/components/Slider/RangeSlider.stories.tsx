import { expect, fn, within } from '@storybook/test'
import { useState } from 'react'

import { RangeSlider } from './RangeSlider'
import anatomy from './RangeSlider.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof RangeSlider> = {
  title: 'Components/L1/RangeSlider',
  component: RangeSlider,
  tags: ['autodocs'],
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
    showValue: { control: 'boolean' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    label: '가격대',
    showValue: true,
    value: [20, 60],
    onChange: fn(),
  },
  render: (args) => {
    const [value, setValue] = useState<[number, number]>([...args.value] as [number, number])
    return (
      <div className="w-80">
        <RangeSlider
          {...args}
          value={value}
          onChange={(v) => {
            args.onChange?.(v)
            setValue(v)
          }}
        />
      </div>
    )
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof RangeSlider>

export const Default: Story = {}

export const Disabled: Story = {
  args: { disabled: true },
}

/** 도메인 단위로 포맷 — 접수 정정의 희망 방문 시간대가 이 형태를 쓴다. */
export const TimeRange: Story = {
  args: {
    label: '희망 시간대',
    min: 18,
    max: 38,
    step: 1,
    value: [24, 33],
    startLabel: '시작 시각',
    endLabel: '종료 시각',
    formatValue: (v: number) =>
      `${String(Math.floor(v / 2)).padStart(2, '0')}:${v % 2 ? '30' : '00'}`,
  },
}

/** 썸 두 개가 각각 이름을 갖고, 값이 각자의 native input 으로 노출된다. */
export const TwoNamedThumbs: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const thumbs = canvas.getAllByRole('slider') as HTMLInputElement[]

    await expect(thumbs).toHaveLength(2)
    await expect(thumbs[0]).toHaveAccessibleName('시작')
    await expect(thumbs[1]).toHaveAccessibleName('끝')
    await expect(thumbs[0]?.value).toBe('20')
    await expect(thumbs[1]?.value).toBe('60')
  },
}

/** 뒤집힌 값이 들어와도 화면은 정상 구간으로 그린다. */
export const NormalizesInvertedValue: Story = {
  args: { value: [70, 30] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const thumbs = canvas.getAllByRole('slider') as HTMLInputElement[]

    await expect(thumbs[0]?.value).toBe('30')
    await expect(thumbs[1]?.value).toBe('70')
  },
}
