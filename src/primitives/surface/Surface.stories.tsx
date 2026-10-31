import { Surface } from './Surface'
import anatomy from './Surface.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Surface> = {
  title: 'Primitives/Surface',
  component: Surface,
  tags: ['autodocs'],
  argTypes: {
    kind: { control: 'select', options: ['section', 'connected', 'control'] },
    variant: { control: 'select', options: ['default', 'subtle', 'inverse', 'callout'] },
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
    calloutSeverity: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger', 'neutral'],
    },
    connectedSize: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
  args: {
    kind: 'section',
    variant: 'default',
    density: 'default',
    header: <span className="font-semibold text-fg">Title</span>,
    children: <p className="text-fg-subtle">Body content goes here.</p>,
    footer: <span className="text-sm text-fg-muted">Footer</span>,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Surface>

export const SectionDefault: Story = {
  name: 'Section — default',
}

export const SectionBodyOnly: Story = {
  name: 'Section — body only',
  args: {
    header: undefined,
    footer: undefined,
    children: (
      <p className="text-sm text-fg">
        Only the body region is rendered when header/footer are omitted.
      </p>
    ),
  },
}

export const SectionInverse: Story = {
  name: 'Section — inverse',
  args: {
    variant: 'inverse',
    header: <span className="font-semibold">Inverse</span>,
    children: <p className="text-sm opacity-90">Inverse surface for emphasis blocks.</p>,
  },
}

export const SectionCallout: Story = {
  name: 'Section — callout',
  args: {
    variant: 'callout',
    calloutSeverity: 'info',
    header: undefined,
    footer: undefined,
    children: <p className="text-sm">Callout severity maps to Alert-style tokens.</p>,
  },
}

export const Connected: Story = {
  name: 'Connected',
  args: {
    kind: 'connected',
    connectedSize: 'md',
    header: undefined,
    footer: undefined,
    className: 'max-w-md',
    children: (
      <>
        <div className="min-w-0 flex-1 px-3 py-2 text-sm text-fg-muted">Segment</div>
        <div aria-hidden className="shrink-0 self-stretch border-s border-border" />
        <div className="shrink-0 px-3 py-2 text-sm text-primary">Action</div>
      </>
    ),
  },
}

export const ControlVariants: Story = {
  name: 'Control — surfaceControlVariants',
  render: () => (
    <p className="max-w-prose text-sm text-fg-muted">
      Control kind는 native <code className="text-fg">input</code> /{' '}
      <code className="text-fg">button</code>에{' '}
      <code className="text-fg">surfaceControlVariants</code> (alias{' '}
      <code className="text-fg">inputVariants</code>)를 직접 적용합니다. Input/Select stories 참조.
    </p>
  ),
}
