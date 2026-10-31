import { expect, fn, userEvent, within } from '@storybook/test'

import { SegmentedControl } from './SegmentedControl'
import anatomy from './SegmentedControl.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SegmentedControl> = {
  title: 'Components/L2/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    block: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onValueChange: { action: 'changed' },
  },
  args: {
    value: 'workbench',
    size: 'md',
    block: false,
    disabled: false,
    onValueChange: fn(),
    'aria-label': '카탈로그 뷰',
    items: [
      { value: 'workbench', label: '작업대' },
      { value: 'changeset', label: '체인지셋' },
      { value: 'biography', label: '히스토리' },
    ],
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof SegmentedControl>

export const Default: Story = {}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <SegmentedControl {...args} size="sm" aria-label="카탈로그 뷰 (sm)" />
      <SegmentedControl {...args} size="md" aria-label="카탈로그 뷰 (md)" />
    </div>
  ),
}

export const Block: Story = {
  args: {
    block: true,
  },
}

export const WithDisabledItem: Story = {
  args: {
    items: [
      { value: 'workbench', label: '작업대' },
      { value: 'changeset', label: '체인지셋', disabled: true },
      { value: 'biography', label: '히스토리' },
    ],
  },
}

export const Uncontrolled: Story = {
  args: {
    value: undefined,
    defaultValue: 'changeset',
  },
}

/** WAI-ARIA tablist 행동 계약: aria-selected, 클릭 선택, 화살표 roving + automatic activation */
export const TablistContract: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const tablist = canvas.getByRole('tablist', { name: '카탈로그 뷰' })
    await expect(tablist).toBeInTheDocument()

    const tabs = canvas.getAllByRole('tab')
    await expect(tabs).toHaveLength(3)
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'false')

    // roving tabindex: 선택된 탭만 tab stop
    await expect(tabs[0]).toHaveAttribute('tabindex', '0')
    await expect(tabs[1]).toHaveAttribute('tabindex', '-1')

    // 클릭 → onValueChange emit
    await userEvent.click(tabs[1]!)
    await expect(args.onValueChange).toHaveBeenCalledWith('changeset')

    // 선택된 탭 재클릭은 emit 하지 않음
    await userEvent.click(tabs[0]!)
    await expect(args.onValueChange).toHaveBeenCalledTimes(1)

    // ArrowRight → 다음 세그먼트로 automatic activation
    tabs[0]!.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onValueChange).toHaveBeenCalledWith('changeset')
  },
}

export const AnatomyDriven: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: {
      selector: '[data-slot="segmented-control-root"]',
    },
    item: { skip: true },
  }),
}
