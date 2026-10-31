import { Fab } from './Fab'
import anatomy from './Fab.anatomy.json'
import { FabMenu } from './FabMenu'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

function PlusGlyph() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  )
}

const meta: Meta<typeof Fab> = {
  title: 'Components/L1/Fab',
  component: Fab,
  tags: ['autodocs'],
  argTypes: {
    color: { control: 'inline-radio', options: ['primary', 'tonal'] },
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Fab>

export const Variants: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Fab aria-label="추가" icon={<PlusGlyph />} />
      <Fab label="상담 시작" />
      <Fab label="상담 시작" color="tonal" />
      <Fab label="비활성" disabled />
    </div>
  ),
}

/** FAB 메뉴 — 닫힘(사각) ↔ 열림(원형 ✕ morph + 아이템 필) */
export const Menu: Story = {
  render: () => (
    <div className="flex h-72 items-end justify-end bg-canvas p-6" data-surface="tinted">
      <FabMenu
        defaultOpen
        items={[
          { id: 'today', label: '오늘 목록' },
          { id: 'map', label: '지도' },
          { id: 'notice', label: '변경 안내 1건' },
        ]}
      />
    </div>
  ),
}
