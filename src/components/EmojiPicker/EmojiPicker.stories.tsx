import { expect, fn, userEvent, waitFor, within } from '@storybook/test'
import { useState } from 'react'

import { EmojiPicker } from './EmojiPicker'
import anatomy from './EmojiPicker.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof EmojiPicker> = {
  title: 'Components/L1/EmojiPicker',
  component: EmojiPicker,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[min(100vw-2rem,22rem)]">
        <Story />
      </div>
    ),
  ],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof EmojiPicker>

export const Default: Story = {
  render: function EmojiPickerStory() {
    const [v, setV] = useState<string>()
    return (
      <div className="space-y-2 text-sm text-fg-muted">
        <EmojiPicker value={v} onChange={setV} placeholder="Pick an emoji" />
        <p>
          Selected: <span className="font-emoji text-lg text-fg">{v ?? '—'}</span>
        </p>
      </div>
    )
  },
}

/** value/onChange 없이 defaultValue만으로 단독 동작하는 uncontrolled 모드 */
export const Uncontrolled: Story = {
  render: () => <EmojiPicker defaultValue="😊" />,
}

export const NotSearchable: Story = {
  args: {
    searchable: false,
    placeholder: 'Categories only',
  },
}

/**
 * trigger(disclosure) 클릭 → panel(role=dialog) 노출 + aria-expanded.
 */
export const OpensOnTriggerClick: Story = {
  render: () => {
    const [v, setV] = useState<string>()
    return <EmojiPicker value={v} onChange={setV} placeholder="Pick an emoji" />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button')

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('dialog')).toBeNull()

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('dialog', { name: 'Emoji picker' })).toBeVisible()

    // 다시 클릭 → 닫힘
    await userEvent.click(trigger)
    await waitFor(() => {
      if (canvasElement.querySelector('[role="dialog"]')) throw new Error('패널이 닫히지 않음')
    })
  },
}

/**
 * search-input 필터링 — 검색어 입력 시 그리드가 필터된다.
 */
export const SearchFiltersEmojis: Story = {
  render: () => {
    const [v, setV] = useState<string>()
    return <EmojiPicker value={v} onChange={setV} searchable />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByRole('dialog')).toBeVisible()

    const searchInput = canvas.getByRole('searchbox', { name: /search/i })
    const gridBefore = canvasElement.querySelectorAll('[aria-label="Emoji grid"] li')

    await userEvent.type(searchInput, 'smile')

    // 검색 후 그리드가 필터됨
    await waitFor(() => {
      const gridAfter = canvasElement.querySelectorAll('[aria-label="Emoji grid"] li')
      if (gridAfter.length >= gridBefore.length) throw new Error('필터되지 않음')
    })
  },
}

/**
 * emoji-cell 클릭 → onChange(emoji) 호출 + 패널 닫힘.
 */
export const EmojiSelectCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [v, setV] = useState<string>()
    return (
      <EmojiPicker
        {...args}
        value={v}
        onChange={(emoji) => {
          args.onChange?.(emoji)
          setV(emoji)
        }}
        searchable={false}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button'))
    await expect(canvas.getByRole('dialog')).toBeVisible()

    // 그리드의 첫 번째 이모지 클릭
    const emojiGrid = canvas.getByRole('list', { name: 'Emoji grid' })
    const firstEmoji = within(emojiGrid).getAllByRole('listitem')[0].querySelector('button')
    if (!firstEmoji) throw new Error('이모지 버튼 없음')
    await userEvent.click(firstEmoji)

    await expect(args.onChange).toHaveBeenCalledWith(expect.any(String))
    // 선택 후 패널 닫힘
    await waitFor(() => {
      if (canvasElement.querySelector('[role="dialog"]'))
        throw new Error('이모지 선택 후 패널이 닫히지 않음')
    })
  },
}
