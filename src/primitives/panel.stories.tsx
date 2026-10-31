import { Panel } from './panel'
import anatomy from './panel.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'
import { cn } from '@/utils/cn'

const meta: Meta<typeof Panel> = {
  title: 'Primitives/Panel',
  component: Panel,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['overlay', 'list'] },
    appearance: { control: 'inline-radio', options: ['glass', 'solid'] },
    shape: {
      control: 'select',
      options: [
        'overlay',
        'list',
        'compact',
        'dialog',
        'edge-left',
        'edge-right',
        'edge-top',
        'edge-bottom',
      ],
    },
    position: { control: 'inline-radio', options: ['absolute', 'fixed'] },
    offset: { control: 'inline-radio', options: ['anchored', 'none'] },
    scrollHint: { control: 'boolean' },
  },
  args: {
    position: 'absolute',
    offset: 'anchored',
    className: 'p-3 text-sm text-fg',
    children: 'Glass 패널 — backdrop blur + shadow-panel(0 7px 29px, blue-tint). 테두리 없음.',
  },
  decorators: [
    (Story) => (
      <div className="relative max-w-xs pt-1">
        <div className="mb-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg-muted">
          트리거 (relative 컨테이너)
        </div>
        <Story />
      </div>
    ),
  ],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta

type Story = StoryObj<typeof Panel>

export const Default: Story = {}

export const FixedPortaled: Story = {
  args: {
    position: 'fixed',
    className: cn('top-16 left-8 max-w-xs p-3 text-sm text-fg'),
  },
  decorators: [
    (Story) => (
      <>
        <p className="mb-4 max-w-md text-sm text-fg-muted">
          `position=fixed` — portal 오버레이(탭 스트립 클리핑 회피)에 사용합니다.
        </p>
        <Story />
      </>
    ),
  ],
}

export const ListVariant: Story = {
  name: 'List (검색·RichList)',
  args: {
    variant: 'list',
    className: 'w-72 overflow-hidden p-0',
    children: (
      <ul className="max-h-48 overflow-y-auto py-0">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="border-b border-border px-3 py-2.5 text-sm last:border-b-0">
            항목 {i + 1}
          </li>
        ))}
      </ul>
    ),
  },
}

export const ScrollHint: Story = {
  args: {
    className: 'w-72 overflow-hidden p-0',
    children: (
      <ul data-slot="panel-scroll-region" className="max-h-48 overflow-y-auto py-1">
        {Array.from({ length: 12 }, (_, i) => (
          <li key={i} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
            항목 {i + 1}
          </li>
        ))}
      </ul>
    ),
  },
}

export const PopoverOffset: Story = {
  args: {
    offset: 'none',
    className: 'top-full left-0 mt-2 min-w-48 p-3 text-sm text-fg',
  },
}

export const SolidCompact: Story = {
  name: 'Solid — compact (Tooltip)',
  args: {
    appearance: 'solid',
    shape: 'compact',
    offset: 'none',
    scrollHint: false,
    className: 'top-full left-0 mt-1.5 text-fg',
    children: 'Tooltip content',
  },
}

export const SolidDialog: Story = {
  name: 'Solid — dialog (Modal shell)',
  args: {
    appearance: 'solid',
    shape: 'dialog',
    position: 'absolute',
    offset: 'none',
    scrollHint: false,
    className: 'relative max-w-lg p-0',
    children: (
      <>
        <div className="border-b border-border px-4 py-3 text-sm font-semibold">Surface header</div>
        <div className="px-4 py-3 text-sm text-fg-subtle">
          Surface body — Modal L2 wraps Panel + Surface
        </div>
      </>
    ),
  },
  decorators: [(Story) => <div className="max-w-lg">{Story()}</div>],
}
