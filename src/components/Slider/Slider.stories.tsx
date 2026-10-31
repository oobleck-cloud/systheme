import { expect, fn, within } from '@storybook/test'
import { useState } from 'react'

import { Slider } from './Slider'
import anatomy from './Slider.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Slider> = {
  title: 'Components/L1/Slider',
  component: Slider,
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
    label: '볼륨',
    showValue: true,
    onChange: fn(),
  },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 50)
    return (
      <div className="w-80">
        <Slider
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
type Story = StoryObj<typeof Slider>

export const Default: Story = {}

export const StepHalf: Story = {
  args: { step: 0.5, value: 25, max: 50 },
}

export const Disabled: Story = {
  args: { disabled: true, value: 30 },
}

/**
 * Anatomy 검증 — root는 value-input. native `<input type="range">`이므로 role/min/max는
 * native attribute로 노출(ARIA는 브라우저가 자동 매핑하지만 attribute로는 안 보임).
 */
export const RangeInputContract: Story = {
  args: { value: 40, min: 0, max: 100 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const slider = canvas.getByRole('slider') as HTMLInputElement
    await expect(slider.type).toBe('range')
    await expect(slider).toHaveAttribute('min', '0')
    await expect(slider).toHaveAttribute('max', '100')
    await expect(slider.value).toBe('40')
  },
}
