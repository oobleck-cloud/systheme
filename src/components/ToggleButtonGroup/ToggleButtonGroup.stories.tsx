import { fn } from '@storybook/test'

import { ToggleButtonGroup } from './ToggleButtonGroup'
import anatomy from './ToggleButtonGroup.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Monitor, Moon, Sun, createIconElement } from '@/icons'
import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ToggleButtonGroup> = {
  title: 'Components/L2/ToggleButtonGroup',
  component: ToggleButtonGroup,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    appearance: { control: 'select', options: ['icon', 'label'] },
    block: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onValueChange: { action: 'changed' },
  },
  args: {
    value: 'light',
    size: 'sm',
    appearance: 'label',
    block: false,
    disabled: false,
    onValueChange: fn(),
    'aria-label': '테마',
    options: [
      { value: 'system', label: '시스템', ariaLabel: '시스템 설정 따르기' },
      { value: 'light', label: '라이트', ariaLabel: '라이트' },
      { value: 'dark', label: '다크', ariaLabel: '다크' },
    ],
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ToggleButtonGroup>

export const Label: Story = {}

export const Icon: Story = {
  args: {
    value: 'system',
    appearance: 'icon',
    options: [
      {
        value: 'system',
        label: createIconElement(Monitor, 'sm'),
        ariaLabel: '시스템 설정 따르기',
      },
      { value: 'light', label: createIconElement(Sun, 'sm'), ariaLabel: '라이트' },
      { value: 'dark', label: createIconElement(Moon, 'sm'), ariaLabel: '다크' },
    ],
  },
}

export const Block: Story = {
  args: {
    block: true,
  },
}

export const AnatomyDriven: Story = {
  args: {
    appearance: 'icon',
    value: 'system',
    options: [
      {
        value: 'system',
        label: createIconElement(Monitor, 'sm'),
        ariaLabel: '시스템 설정 따르기',
      },
      { value: 'light', label: createIconElement(Sun, 'sm'), ariaLabel: '라이트' },
      { value: 'dark', label: createIconElement(Moon, 'sm'), ariaLabel: '다크' },
    ],
    onValueChange: fn(),
  },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: {
      selector: '[data-slot="toggle-button-group-root"]',
    },
    item: { skip: true },
  }),
}
