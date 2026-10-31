import { expect, within } from '@storybook/test'

import { Kbd } from './Kbd'
import anatomy from './Kbd.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Kbd> = {
  title: 'Components/L1/Kbd',
  component: Kbd,
  tags: ['autodocs'],
  args: { keys: ['⌘', 'K'] },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {}

export const FromString: Story = {
  args: { keys: undefined, children: 'Ctrl+Shift+P' },
}

export const SingleKey: Story = {
  args: { keys: ['Esc'] },
}

/**
 * Anatomy 검증 — root.iterates="keys" → 각 키마다 `<kbd data-slot="kbd-key">` 한 개.
 * 키 개수가 정확하고 텍스트가 입력값과 일치해야 한다.
 */
export const RendersAllKeys: Story = {
  args: { keys: ['Ctrl', 'Shift', 'K'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const keys = canvasElement.querySelectorAll('[data-slot="kbd-key"]')
    await expect(keys.length).toBe(3)
    await expect(canvas.getByText('Ctrl')).toBeInTheDocument()
    await expect(canvas.getByText('Shift')).toBeInTheDocument()
    await expect(canvas.getByText('K')).toBeInTheDocument()
  },
}
