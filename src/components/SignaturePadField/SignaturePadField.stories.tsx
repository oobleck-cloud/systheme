import { fn } from '@storybook/test'

import { SignaturePadField } from './SignaturePadField'
import anatomy from './SignaturePadField.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SignaturePadField> = {
  title: 'Components/L3/SignaturePadField',
  component: SignaturePadField,
  tags: ['autodocs'],
  args: {
    helperText: '서명 영역 안에 서명해주세요.',
    onClear: fn(),
    onSubmit: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof SignaturePadField>

export const Default: Story = {}

export const HasInk: Story = {
  args: {},
}

export const AnatomyActions: Story = {
  args: {},
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    'canvas-slot': { skip: true },
    helper: { skip: true },
    clear: { onPress: 'onClear' },
    commit: { skip: true },
  }),
}
