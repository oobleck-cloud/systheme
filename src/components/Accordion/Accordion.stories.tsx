import { expect, fn, userEvent, within } from '@storybook/test'

import { Accordion, type AccordionItem } from './Accordion'
import anatomy from './Accordion.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const sampleItems: AccordionItem[] = [
  {
    id: 'overview',
    label: '개요',
    description: '디자인시스템 개요와 철학',
    content: '컴포넌트는 anatomy + theme + stories 3계층으로 분리됩니다.',
  },
  {
    id: 'tokens',
    label: '토큰',
    content: '색·간격·폰트 토큰은 src/styles/tokens 에 정의됩니다.',
  },
  {
    id: 'a11y',
    label: '접근성',
    content: 'axe-core가 모든 스토리에 적용되어 있습니다.',
    disabled: true,
  },
]

const meta: Meta<typeof Accordion> = {
  title: 'Components/L1/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
  },
  args: {
    items: sampleItems,
    type: 'single',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Accordion>

export const Default: Story = {}

export const Multiple: Story = {
  args: { type: 'multiple', defaultValue: ['overview', 'tokens'] },
}

export const DisabledItem: Story = {
  args: { items: sampleItems, defaultValue: 'overview' },
}

/**
 * Anatomy 기반 검증 — `trigger.intent = disclosure`, `writes = openItems`,
 * `emits = onValueChange`. 클릭 시 onValueChange + aria-expanded 동기화.
 */
export const TogglesOpenState: Story = {
  args: { items: sampleItems, type: 'single', onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: /개요/ })

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    await expect(args.onValueChange).toHaveBeenCalledWith('overview')
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')

    // single 모드에서 다른 항목 열면 이전 항목은 닫힘
    const trigger2 = canvas.getByRole('button', { name: /토큰/ })
    await userEvent.click(trigger2)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
  },
}

export const DisabledIgnoresClicks: Story = {
  args: { items: sampleItems, onValueChange: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const disabled = canvas.getByRole('button', { name: /접근성/ })
    await expect(disabled).toBeDisabled()
    await userEvent.click(disabled)
    await expect(args.onValueChange).not.toHaveBeenCalled()
  },
}

/**
 * multiple 모드 + defaultValue — 복수 항목이 동시에 열린다.
 * 하나를 더 클릭해도 기존 항목은 닫히지 않는다.
 */
export const MultipleModeWithDefaultValue: Story = {
  args: {
    items: sampleItems,
    type: 'multiple',
    defaultValue: ['overview'],
    onValueChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // defaultValue로 'overview'가 이미 열려 있어야 함
    const trigger1 = canvas.getByRole('button', { name: /개요/ })
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')

    // 토큰 항목도 열기
    const trigger2 = canvas.getByRole('button', { name: /토큰/ })
    await userEvent.click(trigger2)
    await expect(args.onValueChange).toHaveBeenCalled()

    // multiple 모드: 두 항목이 동시에 열린다
    await expect(trigger1).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger2).toHaveAttribute('aria-expanded', 'true')
  },
}
