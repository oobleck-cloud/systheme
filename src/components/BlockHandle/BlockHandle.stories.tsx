import { expect, fn, userEvent, within } from '@storybook/test'

import { BlockHandle } from './BlockHandle'
import anatomy from './BlockHandle.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof BlockHandle> = {
  title: 'Components/Display/BlockHandle',
  component: BlockHandle,
  tags: ['autodocs'],
  args: { kind: 'add', 'aria-label': '블록 추가', onClick: fn() },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof BlockHandle>

export const Add: Story = {}

export const Grip: Story = {
  args: { kind: 'grip', 'aria-label': '블록 이동' },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <BlockHandle kind="add" size="sm" aria-label="추가 sm" />
      <BlockHandle kind="add" size="md" aria-label="추가 md" />
      <BlockHandle kind="grip" size="sm" aria-label="그립 sm" />
      <BlockHandle kind="grip" size="md" aria-label="그립 md" />
    </div>
  ),
}

/**
 * Anatomy 검증 — root(press-action)가 data-slot="block-handle-root" 로 렌더되고
 * 클릭 시 onClick 이 호출된다.
 */
export const AnatomyDriven: Story = {
  args: { kind: 'add', 'aria-label': '블록 추가', onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const root = canvas.getByRole('button', { name: '블록 추가' })
    await expect(root).toHaveAttribute('data-slot', 'block-handle-root')
    await userEvent.click(root)
    await expect(args.onClick).toHaveBeenCalled()
  },
}
