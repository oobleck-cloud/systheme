import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { FileInput } from './FileInput'
import anatomy from './FileInput.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof FileInput> = {
  title: 'Components/L1/FileInput',
  component: FileInput,
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    accept: { control: 'text' },
  },
  args: {
    multiple: false,
    disabled: false,
    onChange: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof FileInput>

export const Default: Story = {}

export const Multiple: Story = {
  args: { multiple: true },
}

export const RestrictedTypes: Story = {
  args: { accept: 'image/png,image/jpeg', maxSize: 1024 * 1024 },
}

/**
 * Anatomy 검증 — drop-zone(value-input) 클릭 시 hidden file input이 열려야 함.
 * controlled value 변경 시 file-list가 노출되어야 함.
 */
export const ListsSelectedFiles: Story = {
  args: { multiple: true, onChange: fn() },
  render: (args) => {
    const [files, setFiles] = useState<File[]>([
      new File(['hello'], 'hello.txt', { type: 'text/plain' }),
      new File(['world'], 'world.md', { type: 'text/markdown' }),
    ])
    return (
      <FileInput
        {...args}
        value={files}
        onChange={(next) => {
          args.onChange?.(next)
          setFiles(next)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const list = canvasElement.querySelector('[data-slot="file-input-list"]')
    await expect(list).not.toBeNull()
    const items = list!.querySelectorAll('[data-slot="file-input-item"]')
    await expect(items.length).toBe(2)
    await expect(canvas.getByText('hello.txt')).toBeInTheDocument()
    await expect(canvas.getByText('world.md')).toBeInTheDocument()

    // 제거 버튼 클릭 → onChange가 줄어든 배열로 호출
    const remove = canvas.getByRole('button', { name: 'hello.txt 제거' })
    await userEvent.click(remove)
    await expect(args.onChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'world.md' }),
    ])
  },
}

export const Disabled: Story = {
  args: { disabled: true },
}
