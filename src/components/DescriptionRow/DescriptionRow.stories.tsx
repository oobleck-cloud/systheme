import { expect, fn, userEvent, within } from '@storybook/test'

import { DescriptionRow } from './DescriptionRow'
import anatomy from './DescriptionRow.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof DescriptionRow> = {
  title: 'Components/L1/DescriptionRow',
  component: DescriptionRow,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
    columns: { control: 'select', options: ['fixed', 'fluid'] },
  },
  args: {
    label: 'API key',
    value: 'sk_live_••••••••••••9f2a',
    density: 'default',
    columns: 'fluid',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DescriptionRow>

export const Default: Story = {
  args: {
    onCopy: () => {},
  },
}

export const CustomCopySlot: Story = {
  args: {
    copy: (
      <button type="button" className="text-xs font-medium text-primary hover:underline">
        Reveal
      </button>
    ),
  },
}

/**
 * Anatomy 검증 — onCopy가 주어지면 기본 copy IconButton이 노출되고 클릭 시
 * onCopy 핸들러가 호출되어야 한다(press-action contract).
 */
export const CopyButtonContract: Story = {
  args: { onCopy: fn(), copyButtonLabel: 'Copy API key' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const btn = canvas.getByRole('button', { name: 'Copy API key' })
    await userEvent.click(btn)
    await expect(args.onCopy).toHaveBeenCalled()
  },
}
