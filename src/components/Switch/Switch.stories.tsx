import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { Switch } from './Switch'
import anatomy from './Switch.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Switch> = {
  title: 'Components/L1/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onCheckedChange: { action: 'checkedChange' },
  },
  args: {
    checked: false,
    disabled: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {}

export const Checked: Story = {
  args: { checked: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

/**
 * Anatomy-driven: `root.intent = toggle`, `writes = checked`, `emits = onCheckedChange`.
 * 클릭 시 onCheckedChange가 호출되어야 한다.
 */
export const AnatomyDriven: Story = {
  args: { checked: false, onCheckedChange: fn() },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { onToggle: 'onCheckedChange' },
    thumb: { skip: true },
  }),
}

/**
 * 토글 동작 + ARIA 상태 정합 검증:
 *   - role="switch", aria-checked가 checked 상태와 동기화
 *   - 클릭 시 onCheckedChange(!checked)가 호출됨
 *   - disabled 상태에서는 클릭이 무시되어야 함
 */
export const TogglesCheckedState: Story = {
  args: { onCheckedChange: fn() },
  render: (args) => {
    const [checked, setChecked] = useState(args.checked ?? false)
    return (
      <Switch
        {...args}
        checked={checked}
        onCheckedChange={(next) => {
          args.onCheckedChange?.(next)
          setChecked(next)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const sw = canvas.getByRole('switch')

    await expect(sw).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(sw)
    await expect(args.onCheckedChange).toHaveBeenCalledWith(true)
    await expect(sw).toHaveAttribute('aria-checked', 'true')

    await userEvent.click(sw)
    await expect(args.onCheckedChange).toHaveBeenCalledWith(false)
    await expect(sw).toHaveAttribute('aria-checked', 'false')
  },
}

export const DisabledIgnoresClicks: Story = {
  args: { disabled: true, onCheckedChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const sw = canvas.getByRole('switch')
    await userEvent.click(sw)
    await expect(args.onCheckedChange).not.toHaveBeenCalled()
  },
}
