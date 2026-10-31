import { expect, fn, userEvent } from '@storybook/test'

import { KeyboardShortcutsOverlay } from './KeyboardShortcutsOverlay'
import anatomy from './KeyboardShortcutsOverlay.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof KeyboardShortcutsOverlay> = {
  title: 'Components/L2/KeyboardShortcutsOverlay',
  component: KeyboardShortcutsOverlay,
  tags: ['autodocs'],
  args: {
    open: true,
    groups: [
      {
        title: 'Navigation',
        items: [
          { chord: 'G D', description: 'Go to dashboard' },
          { chord: 'G S', description: 'Go to settings' },
        ],
      },
    ],
    onOpenChange: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof KeyboardShortcutsOverlay>

export const Default: Story = {}

export const MultipleGroups: Story = {
  args: {
    groups: [
      {
        title: 'Navigation',
        items: [{ chord: 'G H', description: 'Home' }],
      },
      {
        title: 'Editing',
        items: [
          { chord: '⌘ Z', description: 'Undo' },
          { chord: '⌘ ⇧ Z', description: 'Redo' },
        ],
      },
    ],
  },
}

export const OverlayClosed: Story = {
  args: { open: false },
}

/** 백드롭은 오버레이를 닫아 이후 슬롯 검증을 깨므로 스킵하고 닫기 버튼만 검증 */
export const AnatomyCloseButton: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    backdrop: { skip: true },
    surface: { skip: true },
    close: { onPress: 'onOpenChange' },
    'group-list': { skip: true },
    'group-block': { skip: true },
    'group-title': { skip: true },
    rows: { skip: true },
    'shortcut-row': { skip: true },
    chord: { skip: true },
    description: { skip: true },
  }),
}

export const AnatomyBackdropDismiss: Story = {
  play: async ({ canvasElement, args }) => {
    const backdrop = canvasElement.querySelector(
      '[data-slot="keyboard-shortcuts-overlay-backdrop"]',
    )
    await expect(backdrop).toBeTruthy()
    await userEvent.click(backdrop as HTMLElement)
    await expect(args.onOpenChange).toHaveBeenCalled()
  },
}
