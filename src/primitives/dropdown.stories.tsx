import { useState } from 'react'

import { Dropdown } from './dropdown'
import anatomy from './dropdown.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Dropdown> = {
  title: 'Primitives/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta

type Story = StoryObj<typeof Dropdown>

function ControlledDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <Dropdown open={open} onOpenChange={setOpen} label="옵션 열기">
      <div className="p-3 text-sm text-fg">
        <p className="mb-2 text-fg-muted">
          패널 슬롯 — 폼·필터·추가 메뉴 등 자유롭게 넣을 수 있습니다.
        </p>
        <button type="button" className="text-fg-brand underline" onClick={() => setOpen(false)}>
          닫기
        </button>
      </div>
    </Dropdown>
  )
}

export const Default: Story = {
  render: () => <ControlledDropdown />,
}

export const Uncontrolled: Story = {
  render: () => (
    <Dropdown defaultOpen label="기본 열림">
      <div className="p-2 text-sm">비제어 모드 예시</div>
    </Dropdown>
  ),
}
