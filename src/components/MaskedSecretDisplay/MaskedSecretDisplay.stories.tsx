import { fn } from '@storybook/test'

import { MaskedSecretDisplay } from './MaskedSecretDisplay'
import anatomy from './MaskedSecretDisplay.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof MaskedSecretDisplay> = {
  title: 'Components/L1/MaskedSecretDisplay',
  component: MaskedSecretDisplay,
  tags: ['autodocs'],
  args: {
    maskedText: '••••••••',
    plainText: 'sk_live_abc123',
    revealed: false,
    onRevealChange: fn(),
    onCopyRequest: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MaskedSecretDisplay>

export const Default: Story = {}

export const Revealed: Story = {
  args: { revealed: true },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    value: { skip: true },
    reveal: { onPress: 'onRevealChange' },
    copy: { onPress: 'onCopyRequest' },
  }),
}
