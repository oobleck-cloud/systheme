import { expect, fn, screen, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { YearMonthSelector } from './YearMonthSelector'
import anatomy from './YearMonthSelector.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'
import { formatYearMonthLabel, dateToYearMonthParts } from '@/utils/yearMonthModel'

const meta: Meta<typeof YearMonthSelector> = {
  title: 'Components/L3/YearMonthSelector',
  component: YearMonthSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    density: { control: 'inline-radio', options: ['compact', 'default', 'loose'] },
  },
  args: {
    onChange: fn(),
    minYear: 2020,
    maxYear: 2030,
  },
  render: (args) => {
    const [month, setMonth] = useState(args.value ?? new Date(2026, 1, 1))
    return (
      <div className="space-y-2">
        <YearMonthSelector
          {...args}
          value={month}
          onChange={(next) => {
            args.onChange?.(next)
            setMonth(next)
          }}
        />
        <p className="text-xs text-fg-muted">
          value: {formatYearMonthLabel(dateToYearMonthParts(month))}
        </p>
      </div>
    )
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof YearMonthSelector>

export const Default: Story = {}

export const WithValue: Story = {
  args: { value: new Date(2026, 1, 1) },
}

export const OpensWheelPanel: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /2026년 2월/ }))
    await expect(screen.getByRole('listbox', { name: '년' })).toBeInTheDocument()
    await expect(screen.getByRole('listbox', { name: '월' })).toBeInTheDocument()
  },
}

export const PrevNextSteppers: Story = {
  args: { value: new Date(2026, 4, 1) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: '이전 달' }))
    await expect(args.onChange).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: '다음 달' }))
    await expect(args.onChange).toHaveBeenCalledTimes(2)
  },
}

export const MobileSheet: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /2026년/ }))
    const confirm = await canvas.findByRole('button', { name: '확인' })
    await expect(confirm).toBeInTheDocument()
  },
}
