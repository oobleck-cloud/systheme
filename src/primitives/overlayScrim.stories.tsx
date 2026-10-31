import { OverlayScrim } from './overlayScrim'
import anatomy from './overlayScrim.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof OverlayScrim> = {
  title: 'Primitives/OverlayScrim',
  component: OverlayScrim,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof OverlayScrim>

export const Default: Story = {
  render: (args) => (
    <div className="relative h-64 w-full">
      <OverlayScrim {...args} />
      <p className="relative z-10 p-8 text-sm text-fg-muted">
        Orchestration only — not Surface/Panel. Click scrim to dismiss (handler on L2).
      </p>
    </div>
  ),
}
