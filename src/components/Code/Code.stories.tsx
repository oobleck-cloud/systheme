import { expect, within } from '@storybook/test'

import { Code } from './Code'
import anatomy from './Code.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Code> = {
  title: 'Components/Display/Code',
  component: Code,
  tags: ['autodocs'],
  args: { children: 'api_call' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Code>

export const Default: Story = {}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Code variant="chip">chip</Code>
      <Code variant="bare">bare</Code>
    </div>
  ),
}

export const InSentence: Story = {
  render: () => (
    <p className="text-sm text-fg">
      결제는 <Code>evaluate</Code> 이벤트를 <Code>POST /api/v1/events/evaluate</Code> 로 보냅니다.
    </p>
  ),
}

/**
 * Anatomy 검증 — 루트가 <code data-slot="code-root"> 로 렌더된다.
 */
export const AnatomyDriven: Story = {
  args: { children: 'order_id' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('[data-slot="code-root"]')
    await expect(root).not.toBeNull()
    await expect(root?.tagName.toLowerCase()).toBe('code')
    await expect(canvas.getByText('order_id')).toBeInTheDocument()
  },
}
