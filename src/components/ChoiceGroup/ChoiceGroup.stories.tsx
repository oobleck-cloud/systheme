import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { ChoiceGroup } from './ChoiceGroup'
import anatomy from './ChoiceGroup.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const days = ['월', '화', '수', '목', '금', '토', '일'].map((d) => ({ value: d, label: d }))

const slots = [
  { value: 'am', label: '오전', description: '9시~12시' },
  { value: 'pm', label: '오후', description: '1시~6시' },
  { value: 'eve', label: '저녁', description: '6시~9시' },
]

const meta: Meta<typeof ChoiceGroup> = {
  title: 'Components/L2/ChoiceGroup',
  component: ChoiceGroup,
  tags: ['autodocs'],
  argTypes: {
    appearance: { control: 'inline-radio', options: ['chip', 'card'] },
    selectionMode: { control: 'inline-radio', options: ['multiple', 'single'] },
  },
  args: {
    options: slots,
    value: ['pm'],
    onValueChange: fn(),
    'aria-label': '시간대',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ChoiceGroup>

/** 설명이 붙는 보기 — 카드 전체가 누르는 자리, 고르면 체크 원 */
export const Cards: Story = {}

/** 짧은 보기 — 캡슐 토글 한 줄 */
export const Chips: Story = {
  args: { appearance: 'chip', options: days, value: ['토', '일'], 'aria-label': '요일' },
}

/** 한 줄을 고르게 나눠 채운다 — 모바일 폭에 요일 7개 */
export const ChipsFill: Story = {
  args: {
    appearance: 'chip',
    fill: true,
    options: days,
    value: ['토', '일'],
    'aria-label': '요일',
  },
  render: (args) => (
    <div data-surface="tinted" data-density="comfortable" className="w-[22.5rem] bg-surface p-4">
      <ChoiceGroup {...args} />
    </div>
  ),
}

/** 하나만 고르기 — radiogroup */
export const Single: Story = {
  args: { selectionMode: 'single', value: ['am'] },
}

/** 모바일 현장(틴트 바탕) — 고르지 않은 보기는 테두리 없이 흰 카드 */
export const Tinted: Story = {
  args: { columns: 3 },
  render: (args) => (
    <div data-surface="tinted" data-density="comfortable" className="w-[22rem] bg-surface p-4">
      <ChoiceGroup {...args} />
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
}

/** 여러 개 고르기 — 누를 때마다 넣고 빼며, 값은 보기 순서로 돌려준다 */
export const MultipleToggle: Story = {
  args: { options: days, appearance: 'chip', value: undefined, defaultValue: ['수'] },
  render: function Render(args) {
    const [value, setValue] = useState<string[]>(['수'])
    return (
      <ChoiceGroup
        {...args}
        value={value}
        onValueChange={(v) => {
          setValue(v)
          args.onValueChange?.(v)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const c = within(canvasElement)
    await userEvent.click(c.getByRole('checkbox', { name: '월' }))
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['월', '수'])
    await expect(c.getByRole('checkbox', { name: '월' })).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(c.getByRole('checkbox', { name: '수' }))
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['월'])
  },
}

/** 하나만 고르기 — 화살표가 곧 선택 */
export const SingleKeyboard: Story = {
  args: { selectionMode: 'single', value: ['am'] },
  play: async ({ canvasElement, args }) => {
    const radios = within(canvasElement).getAllByRole('radio')
    radios[0]!.focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(args.onValueChange).toHaveBeenLastCalledWith(['pm'])
  },
}

/** 첫 보기 클릭(toggle) → onValueChange */
export const AnatomyFirstItemToggle: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    item: { onToggle: 'onValueChange' },
    content: { skip: true },
    label: { skip: true },
    description: { skip: true },
    check: { skip: true },
  }),
}
