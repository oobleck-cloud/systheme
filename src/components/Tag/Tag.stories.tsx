import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { Tag } from './Tag'
import anatomy from './Tag.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Tag> = {
  title: 'Components/L1/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'primary',
        'success',
        'warning',
        'error',
        'info',
        'outline',
        'outline-primary',
        'outline-success',
        'outline-warning',
        'outline-error',
        'outline-info',
      ],
    },
    shape: { control: 'select', options: ['rounded', 'pill', 'square'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    children: { control: 'text' },
  },
  args: {
    children: 'Tag',
    variant: 'default',
    shape: 'rounded',
    size: 'md',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Tag>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Tag {...args} variant="default">
          Default
        </Tag>
        <Tag {...args} variant="primary">
          Primary
        </Tag>
        <Tag {...args} variant="success">
          Success
        </Tag>
        <Tag {...args} variant="warning">
          Warning
        </Tag>
        <Tag {...args} variant="error">
          Error
        </Tag>
        <Tag {...args} variant="info">
          Info
        </Tag>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Tag {...args} variant="outline">
          Outline
        </Tag>
        <Tag {...args} variant="outline-primary">
          Primary
        </Tag>
        <Tag {...args} variant="outline-success">
          Success
        </Tag>
        <Tag {...args} variant="outline-warning">
          Warning
        </Tag>
        <Tag {...args} variant="outline-error">
          Error
        </Tag>
        <Tag {...args} variant="outline-info">
          Info
        </Tag>
      </div>
    </div>
  ),
}

export const Shapes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {(['default', 'primary', 'success'] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-2">
          <span className="w-16 text-xs text-fg-muted">{variant}</span>
          <Tag {...args} variant={variant} shape="rounded">
            Rounded
          </Tag>
          <Tag {...args} variant={variant} shape="pill">
            Pill
          </Tag>
          <Tag {...args} variant={variant} shape="square">
            Square
          </Tag>
        </div>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-2">
      <Tag {...args} size="sm">
        Small
      </Tag>
      <Tag {...args} size="md">
        Medium
      </Tag>
      <Tag {...args} size="lg">
        Large
      </Tag>
    </div>
  ),
}

export const Removable: Story = {
  render: (args) => {
    const [tags, setTags] = useState(['Design', 'System', 'React', 'Tailwind'])
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag}
            {...args}
            onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
          >
            {tag}
          </Tag>
        ))}
      </div>
    )
  },
}

export const RemovableShapes: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {(['rounded', 'pill', 'square'] as const).map((shape) => (
        <div key={shape} className="flex flex-wrap items-center gap-2">
          <span className="w-16 text-xs text-fg-muted">{shape}</span>
          {(['default', 'primary', 'success', 'warning', 'error'] as const).map((variant) => (
            <Tag key={variant} {...args} shape={shape} variant={variant} onRemove={() => {}}>
              {variant}
            </Tag>
          ))}
        </div>
      ))}
    </div>
  ),
}

/**
 * Anatomy 검증 — remove-button은 press-action, emits=onRemove.
 * onRemove 가 있을 때만 버튼이 노출되어야 한다.
 */
export const RemoveButtonContract: Story = {
  args: { children: 'Removable', onRemove: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // Tag 컴포넌트는 children이 string일 때 "Remove {children}"을 aria-label로 사용
    const removeBtn = canvas.getByRole('button', { name: 'Remove Removable' })
    await userEvent.click(removeBtn)
    await expect(args.onRemove).toHaveBeenCalled()
  },
}

export const NoRemoveButtonWhenNoHandler: Story = {
  args: { children: 'Static' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button')).toBeNull()
  },
}

/**
 * 긴 라벨 — 태그는 높이가 고정(h-5/6/7)이라 줄바꿈하면 넘친다. 한 줄을 유지하고,
 * 폭이 모자라면 부모가 폭을 제한하고 안쪽 span 에 truncate 를 준다. 제거 버튼은 잘리지 않는다.
 */
export const LongLabel: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <Tag {...args} color="blue">
        방문상담 후 3개 업체 견적 비교 완료 · 고객 확인 대기
      </Tag>
      <div className="w-48 rounded-md border border-dashed border-border p-2">
        <Tag {...args} color="blue" className="max-w-full" onRemove={() => {}}>
          <span className="truncate">방문상담 후 3개 업체 견적 비교 완료 · 고객 확인 대기</span>
        </Tag>
      </div>
    </div>
  ),
}

/**
 * 제거 불가 — 계약: "제거 불가 시 remove 버튼을 숨긴다". Tag 에는 disabled prop 이 없다.
 * 잠긴 태그는 `onRemove` 를 넘기지 않아 버튼 자체가 렌더되지 않는다(비활성 버튼을 보여주지 않는다).
 */
export const Disabled: Story = {
  render: (args) => {
    const locked = ['시스템 태그']
    const [tags, setTags] = useState(['시스템 태그', '가정이사', '마포구'])
    return (
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isLocked = locked.includes(tag)
          return (
            <Tag
              key={tag}
              {...args}
              color={isLocked ? 'gray' : 'blue'}
              onRemove={
                isLocked ? undefined : () => setTags((prev) => prev.filter((t) => t !== tag))
              }
            >
              {tag}
            </Tag>
          )
        })}
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 잠긴 태그에는 remove 버튼이 없고, 나머지 두 개에만 있다
    await expect(canvas.queryByRole('button', { name: 'Remove 시스템 태그' })).toBeNull()
    await expect(canvas.getAllByRole('button')).toHaveLength(2)
  },
}
