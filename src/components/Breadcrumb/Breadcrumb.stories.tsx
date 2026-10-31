import { expect, fn, userEvent, within } from '@storybook/test'

import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb'
import anatomy from './Breadcrumb.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const sampleItems: BreadcrumbItem[] = [
  { label: '홈', href: '#home' },
  { label: '문서', href: '#docs' },
  { label: '디자인시스템', href: '#design-system' },
  { label: 'Breadcrumb' },
]

const meta: Meta<typeof Breadcrumb> = {
  title: 'Components/L1/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  args: { items: sampleItems },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Default: Story = {}

export const ButtonItems: Story = {
  args: {
    items: [
      { label: '루트', onClick: () => {} },
      { label: '하위', onClick: () => {} },
      { label: '현재' },
    ],
  },
}

export const CustomSeparator: Story = {
  args: { separator: <span aria-hidden>/</span> },
}

/**
 * Anatomy 검증 — 마지막 item은 routing-link가 아닌 value-display이며
 * `aria-current="page"` 속성을 가져야 한다(스크린리더용 현재 위치 신호).
 */
export const CurrentPageContract: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const nav = canvas.getByRole('navigation', { name: 'breadcrumb' })
    await expect(nav).toBeInTheDocument()

    const current = canvasElement.querySelector('[data-slot="breadcrumb-current"]')
    await expect(current).toHaveAttribute('aria-current', 'page')
    await expect(current?.textContent).toBe('Breadcrumb')

    // 마지막을 제외한 항목은 link (a 또는 button element 어느 쪽이든 routing-link intent)
    const links = canvasElement.querySelectorAll('[data-slot="breadcrumb-link"]')
    await expect(links.length).toBe(3)
  },
}

export const ButtonClickEmits: Story = {
  args: {
    items: [{ label: '홈', onClick: fn() }, { label: '현재' }],
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const home = canvas.getByRole('button', { name: '홈' })
    await userEvent.click(home)
    const onClick = (args.items as BreadcrumbItem[])[0].onClick
    await expect(onClick).toHaveBeenCalled()
  },
}
