import { expect, within } from '@storybook/test'

import { Text } from './Text'
import anatomy from './Text.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Text> = {
  title: 'Components/Display/Text',
  component: Text,
  tags: ['autodocs'],
  args: { children: '본문 텍스트 — DS 토큰에만 바인딩된 타이포 단일 진입점.' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Text>

export const Default: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text size="xs">xs — 캡션/보조</Text>
      <Text size="sm">sm — 기본 본문</Text>
      <Text size="md">md — 강조 본문</Text>
      <Text size="lg">lg — 리드</Text>
      <Text size="xl">xl — 대형</Text>
    </div>
  ),
}

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-1">
      <Text tone="default">default</Text>
      <Text tone="subtle">subtle</Text>
      <Text tone="muted">muted</Text>
      <Text tone="brand">brand</Text>
      <Text tone="success">success</Text>
      <Text tone="warning">warning</Text>
      <Text tone="error">error</Text>
      <Text tone="info">info</Text>
    </div>
  ),
}

export const InlineSpan: Story = {
  args: { as: 'span', weight: 'semibold', children: '인라인 span' },
}

/**
 * Anatomy 검증 — 루트가 data-slot="text-root" 로 렌더되고 children 텍스트를 그대로 표시한다.
 */
export const AnatomyDriven: Story = {
  args: { children: '앵커 텍스트' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector('[data-slot="text-root"]')
    await expect(root).not.toBeNull()
    await expect(canvas.getByText('앵커 텍스트')).toBeInTheDocument()
  },
}
