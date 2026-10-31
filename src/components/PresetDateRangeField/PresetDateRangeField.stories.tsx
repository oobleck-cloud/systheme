import { fn } from '@storybook/test'

import { PresetDateRangeField } from './PresetDateRangeField'
import anatomy from './PresetDateRangeField.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof PresetDateRangeField> = {
  title: 'Components/L2/PresetDateRangeField',
  component: PresetDateRangeField,
  tags: ['autodocs'],
  args: {
    value: {
      presetKey: '7d',
      customOpen: false,
      start: '2026-01-01',
      end: '2026-01-31',
    },
    presetChoices: [
      { key: '7d', label: 'Last 7 days' },
      { key: '30d', label: 'Last 30 days' },
    ],
    onChange: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof PresetDateRangeField>

export const Default: Story = {}

export const CustomOpen: Story = {
  args: {
    value: {
      presetKey: '7d',
      customOpen: true,
      start: '2026-01-01',
      end: '2026-01-31',
    },
  },
}

/** 커스텀 패널에서 시작·종료·적용 */
export const AnatomyCustomRange: Story = {
  args: {
    value: {
      presetKey: '7d',
      customOpen: true,
      start: '2026-01-01',
      end: '2026-01-31',
    },
  },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    presets: { skip: true },
    preset: { skip: true },
    label: { skip: true },
    /** disclosure 클릭 시 패널이 닫히므로 스킵 */
    'open-custom': { skip: true },
    'custom-panel': { skip: true },
    'range-slot': { skip: true },
    start: { onValueInput: 'onChange' },
    end: { onValueInput: 'onChange' },
    'apply-custom': { onPress: 'onChange' },
  }),
}
