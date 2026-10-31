import { fn } from '@storybook/test'

import { KakaoLoginButton } from './KakaoLoginButton'
import anatomy from './KakaoLoginButton.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof KakaoLoginButton> = {
  title: 'Components/L1/KakaoLoginButton',
  component: KakaoLoginButton,
  tags: ['autodocs'],
  argTypes: {
    block: { control: 'boolean' },
    align: { control: 'select', options: ['center', 'start'] },
    labelVariant: { control: 'select', options: ['full', 'short'] },
    locale: { control: 'select', options: ['ko', 'en'] },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  args: {
    block: true,
    align: 'center',
    labelVariant: 'full',
    locale: 'ko',
    disabled: false,
    onClick: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof KakaoLoginButton>

export const Default: Story = {}

export const LabelVariants: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-3">
      <KakaoLoginButton {...args} labelVariant="full" locale="ko" />
      <KakaoLoginButton {...args} labelVariant="short" locale="ko" />
    </div>
  ),
}

export const English: Story = {
  render: (args) => (
    <div className="flex max-w-sm flex-col gap-3">
      <KakaoLoginButton {...args} labelVariant="full" locale="en" />
      <KakaoLoginButton {...args} labelVariant="short" locale="en" />
    </div>
  ),
}

export const Alignment: Story = {
  render: (args) => (
    <div className="flex max-w-md flex-col gap-3">
      <KakaoLoginButton {...args} align="center" />
      <KakaoLoginButton {...args} align="start" />
    </div>
  ),
}

export const InlineWidth: Story = {
  args: {
    block: false,
  },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: {
      selector: '[data-slot="kakao-login-button-root"]',
      onPress: 'onClick',
    },
  }),
}
