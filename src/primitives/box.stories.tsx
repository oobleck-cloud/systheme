import { Box } from './box'
import anatomy from './box.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'
import { cn } from '@/utils/cn'

const meta: Meta<typeof Box> = {
  title: 'Primitives/Box',
  component: Box,
  tags: ['autodocs'],
  argTypes: {
    scrollHint: { control: 'boolean' },
  },
  args: {
    className:
      'relative max-w-xs rounded-lg border border-border bg-background p-3 text-sm text-fg',
    children:
      '스크롤·하단 blur 힌트의 공통 컨테이너. Panel이 Box를 확장합니다. Box만으로 box chrome을 만들지 말고 Panel 또는 Surface를 사용하세요.',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta

type Story = StoryObj<typeof Box>

export const Default: Story = {}

export const ScrollHint: Story = {
  args: {
    className: cn(
      'relative w-72 overflow-hidden rounded-lg border border-border bg-background p-0',
    ),
    children: (
      <div data-slot="box-scroll-region" className="max-h-48 overflow-y-auto py-1">
        {Array.from({ length: 14 }, (_, i) => (
          <p key={i} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
            항목 {i + 1}
          </p>
        ))}
      </div>
    ),
  },
}

export const ScrollHintOff: Story = {
  args: {
    scrollHint: false,
    className: cn(
      'relative w-72 overflow-hidden rounded-lg border border-border bg-background p-0',
    ),
    children: (
      <div data-slot="box-scroll-region" className="max-h-48 overflow-y-auto py-1">
        {Array.from({ length: 14 }, (_, i) => (
          <p key={i} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
            항목 {i + 1}
          </p>
        ))}
      </div>
    ),
  },
}

export const ImplementationNote: Story = {
  name: 'Implementation note',
  render: () => (
    <p className="max-w-prose text-sm text-fg-muted">
      Box는 Panel의 스크롤 힌트 기반입니다. Box Language에서는 겹침 박스는{' '}
      <strong className="font-medium text-fg">Panel</strong>, 부착 박스는{' '}
      <strong className="font-medium text-fg">Surface</strong>를 사용하세요. Foundations / Box
      Language 참조.
    </p>
  ),
}
