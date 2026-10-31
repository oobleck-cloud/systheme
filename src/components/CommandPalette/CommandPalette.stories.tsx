import { expect, fn, userEvent } from '@storybook/test'

import { CommandPalette } from './CommandPalette'
import anatomy from './CommandPalette.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof CommandPalette> = {
  title: 'Components/L2/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
  args: {
    open: true,
    query: '',
    commandRows: [
      { id: 'a', title: 'Open orders', subtitle: 'Navigation' },
      { id: 'b', title: 'Invite user', subtitle: 'Admin' },
    ],
    onOpenChange: fn(),
    onQueryChange: fn(),
    onExecute: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof CommandPalette>

export const Default: Story = {}

export const Closed: Story = {
  args: { open: false },
}

/** 검색으로 필터링된 행 (선택은 행 클릭 시 내부에서 관리) */
export const RunSelectedRow: Story = {
  args: {
    query: 'inv',
  },
}

/**
 * 백드롭은 먼저 닫히므로 스킵하고, 검색 입력(onQueryChange)과 Run(onExecute)만 검증.
 */
export const AnatomySearchAndRun: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    backdrop: { skip: true },
    surface: { skip: true },
    search: { onValueInput: 'onQueryChange' },
    results: { skip: true },
    'result-row': { skip: true },
    title: { skip: true },
    subtitle: { skip: true },
    run: { onPress: 'onExecute' },
  }),
}

/** 두 번째 행 클릭 → 내부 선택 상태가 해당 행으로 이동 (aria-current) */
export const AnatomyRowSelection: Story = {
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll('[data-slot="command-palette-result-row"]')
    const secondRow = rows[1] as HTMLElement | undefined
    if (!secondRow) return
    const btn = secondRow.querySelector('button')
    if (!btn) return
    await userEvent.click(btn)
    await expect(btn).toHaveAttribute('aria-current', 'true')
  },
}
