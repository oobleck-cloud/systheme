import { expect, within } from '@storybook/test'

import { Heading } from './Heading'
import anatomy from './Heading.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Heading> = {
  title: 'Components/Display/Heading',
  component: Heading,
  tags: ['autodocs'],
  args: { level: 2, children: '섹션 제목' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Heading>

export const Default: Story = {}

export const Levels: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Heading level={1}>H1 — 페이지 타이틀</Heading>
      <Heading level={2}>H2 — 섹션</Heading>
      <Heading level={3}>H3 — 서브섹션</Heading>
      <Heading level={4}>H4 — 그룹</Heading>
      <Heading level={5}>H5 — 소제목</Heading>
      <Heading level={6}>H6 — 라벨</Heading>
    </div>
  ),
}

export const Overridden: Story = {
  args: {
    level: 1,
    size: 'md',
    weight: 'medium',
    tone: 'muted',
    children: 'level=1 이지만 크기 축소',
  },
}

/**
 * Anatomy 검증 — 루트가 data-slot="heading-root" 로 렌더되고 기본 태그는 h{level} 이다.
 */
export const AnatomyDriven: Story = {
  args: { level: 3, children: '앵커 헤딩' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('[data-slot="heading-root"]')
    await expect(root).not.toBeNull()
    await expect(root?.tagName.toLowerCase()).toBe('h3')
    await expect(canvas.getByText('앵커 헤딩')).toBeInTheDocument()
  },
}
