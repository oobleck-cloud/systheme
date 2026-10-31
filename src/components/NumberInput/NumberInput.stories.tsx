import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { NumberInput } from './NumberInput'
import anatomy from './NumberInput.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof NumberInput> = {
  title: 'Components/L1/NumberInput',
  component: NumberInput,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    variant: { control: 'inline-radio', options: ['default', 'error', 'success'] },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
  args: {
    size: 'md',
    step: 1,
    onChange: fn(),
  },
  render: (args) => {
    const [value, setValue] = useState(args.value ?? 0)
    return (
      <NumberInput
        {...args}
        value={value}
        onChange={(v) => {
          args.onChange?.(v)
          setValue(v)
        }}
      />
    )
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof NumberInput>

export const Default: Story = {}

export const WithBounds: Story = {
  args: { value: 0, min: 0, max: 10, step: 1 },
}

export const Step025: Story = {
  args: { value: 1, step: 0.25 },
}

/**
 * Anatomy 검증 — decrement/increment는 stepper intent.
 * 클릭 시 onChange가 ±step으로 호출되며 min/max에서는 disabled.
 */
export const StepperContract: Story = {
  args: { value: 5, min: 0, max: 10, step: 1, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const inc = canvas.getByRole('button', { name: '증가' })
    const dec = canvas.getByRole('button', { name: '감소' })

    await userEvent.click(inc)
    await expect(args.onChange).toHaveBeenLastCalledWith(6)
    await userEvent.click(dec)
    await expect(args.onChange).toHaveBeenLastCalledWith(5)
  },
}

/** defaultValue만 제공 — ± 버튼이 onChange 없이도 내부 값을 반영합니다. */
export const Uncontrolled: Story = {
  render: (args) => <NumberInput {...args} defaultValue={5} min={0} max={20} step={1} />,
}

export const RespectsBoundaries: Story = {
  args: { value: 0, min: 0, max: 2, step: 1, onChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const dec = canvas.getByRole('button', { name: '감소' })
    // 이미 min에 도달 → disabled
    await expect(dec).toBeDisabled()

    const inc = canvas.getByRole('button', { name: '증가' })
    await userEvent.click(inc) // 0 -> 1
    await userEvent.click(inc) // 1 -> 2
    // max 도달 후 increment는 disabled가 됨
    await expect(inc).toBeDisabled()
    // onChange는 max 초과 호출 안 됨
    const calls = (args.onChange as ReturnType<typeof fn>).mock.calls
    await expect(calls.every(([v]) => v <= 2)).toBe(true)
  },
}
