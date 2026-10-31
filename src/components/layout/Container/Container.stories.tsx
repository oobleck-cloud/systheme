import { Container } from './Container'
import anatomy from './Container.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Container> = {
  title: 'Components/Layout/Container',
  component: Container,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Container>

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-surface py-8">
      <Container>
        <div className="rounded-lg border border-border bg-background p-6 text-sm text-fg">
          Content inside a Container (maxWidth=xl, centered, padded)
        </div>
      </Container>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="min-h-screen space-y-4 bg-surface py-8">
      {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((mw) => (
        <Container key={mw} maxWidth={mw}>
          <div className="rounded-md border border-border bg-background px-4 py-2 text-xs text-fg-muted">
            maxWidth={mw}
          </div>
        </Container>
      ))}
    </div>
  ),
}
