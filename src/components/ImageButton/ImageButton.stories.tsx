import { fn } from '@storybook/test'

import { ImageButton } from './ImageButton'
import anatomy from './ImageButton.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const demoSrc =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="45" viewBox="0 0 300 45"><rect width="300" height="45" rx="12" fill="#FEE500"/><text x="150" y="28" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="rgba(0,0,0,0.85)">카카오 로그인</text></svg>`,
  )

const meta: Meta<typeof ImageButton> = {
  title: 'Components/L1/ImageButton',
  component: ImageButton,
  tags: ['autodocs'],
  argTypes: {
    block: { control: 'boolean' },
    fit: { control: 'select', options: ['contain', 'cover', 'fill'] },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  args: {
    src: demoSrc,
    alt: '카카오 로그인',
    block: true,
    fit: 'fill',
    disabled: false,
    onClick: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ImageButton>

export const Default: Story = {}

export const InlineWidth: Story = {
  args: {
    block: false,
  },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: {
      selector: '[data-slot="image-button-root"]',
      onPress: 'onClick',
    },
  }),
}
