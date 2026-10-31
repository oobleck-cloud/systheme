import { expect, fn, userEvent, within } from '@storybook/test'

import { RichTextEditor } from './RichTextEditor'
import anatomy from './RichTextEditor.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof RichTextEditor> = {
  title: 'Components/L3/RichTextEditor',
  component: RichTextEditor,
  tags: ['autodocs'],
  args: {
    defaultValue: '<p>Hello</p>',
    onChange: fn(),
    onMentionQuery: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof RichTextEditor>

export const Default: Story = {}

export const AnatomyToolbarAndBody: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    toolbar: { skip: true },
    bold: { skip: true },
    italic: { skip: true },
    'bullet-list': { skip: true },
    'numbered-list': { skip: true },
    'open-link-editor': { skip: true },
    body: { onValueInput: 'onChange' },
    'link-overlay': { skip: true },
    'link-url': { skip: true },
    'apply-link': { skip: true },
    'close-link': { skip: true },
    'mention-query': { onValueInput: 'onMentionQuery' },
  }),
}

export const AnatomyLinkOverlay: Story = {
  play: async (ctx) => {
    const canvas = within(ctx.canvasElement)

    // 링크 버튼 클릭으로 링크 오버레이 열기
    await userEvent.click(canvas.getByText('링크'))
    await expect(canvas.getByRole('region', { name: '링크 편집기' })).toBeVisible()

    await anatomyAssertions(anatomy as AnatomyDoc, {
      root: { skip: true },
      toolbar: { skip: true },
      bold: { skip: true },
      italic: { skip: true },
      'bullet-list': { skip: true },
      'numbered-list': { skip: true },
      'open-link-editor': { skip: true },
      body: { skip: true },
      'link-overlay': { skip: true },
      'link-url': { skip: true },
      'apply-link': { skip: true },
      'close-link': { skip: true },
      'mention-query': { skip: true },
    })(ctx)
  },
}
