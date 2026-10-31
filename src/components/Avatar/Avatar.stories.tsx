import { expect, within } from '@storybook/test'

import { Avatar } from './Avatar'
import anatomy from './Avatar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const StarIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-[55%] w-[55%]">
    <path d="M8 1l1.85 3.75L14 5.4l-3 2.92.71 4.13L8 10.35l-3.71 2.1.71-4.13L2 5.4l4.15-.65L8 1z" />
  </svg>
)

const meta: Meta<typeof Avatar> = {
  title: 'Components/L1/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'select', options: ['circle', 'rounded', 'square'] },
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl'] },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error', 'info'],
    },
    src: { control: 'text' },
    name: { control: 'text' },
  },
  args: { shape: 'circle', size: 'md', variant: 'default' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Avatar>

/* 기본 폴백 (이름/이미지 없음) */
export const Default: Story = {}

/* 이름 → 이니셜 */
export const WithName: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} name="John Doe" />
      <Avatar {...args} name="Alice Smith" />
      <Avatar {...args} name="홍길동" />
      <Avatar {...args} name="이순신" />
    </div>
  ),
}

/* 커스텀 폴백 아이콘 */
export const WithFallback: Story = {
  args: { fallback: <StarIcon /> },
}

/* 이미지 → 이니셜 폴백 체인 */
export const FallbackChain: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-center gap-1">
        <Avatar {...args} src="https://i.pravatar.cc/150?img=1" name="John Doe" />
        <span className="text-xs text-fg-muted">image</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Avatar {...args} src="broken-url" name="John Doe" />
        <span className="text-xs text-fg-muted">error → initials</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Avatar {...args} fallback={<StarIcon />} />
        <span className="text-xs text-fg-muted">custom fallback</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Avatar {...args} />
        <span className="text-xs text-fg-muted">default</span>
      </div>
    </div>
  ),
}

export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-3">
      <Avatar {...args} shape="circle" name="John Doe" />
      <Avatar {...args} shape="rounded" name="John Doe" />
      <Avatar {...args} shape="square" name="John Doe" />
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-3">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((size) => (
        <Avatar key={size} {...args} size={size} name="John Doe" />
      ))}
    </div>
  ),
}

export const AvatarGroup: Story = {
  render: (args) => (
    <div className="flex -space-x-2">
      <Avatar {...args} name="Alice" className="ring-2 ring-background" />
      <Avatar {...args} name="Bob Kim" className="ring-2 ring-background" />
      <Avatar {...args} name="Carol" className="ring-2 ring-background" />
      <Avatar {...args} variant="default" className="ring-2 ring-background"></Avatar>
      <TextBoxCount count={3} size={args.size ?? undefined} />
    </div>
  ),
}

/* AvatarGroup용 +N 카운터 예시 */
function TextBoxCount({ count, size }: { count: number; size?: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface font-medium text-fg-subtle ring-2 ring-background"
      style={{ fontSize: size === 'xs' ? 10 : size === 'sm' ? 12 : 13 }}
    >
      +{count}
    </span>
  )
}

/**
 * Anatomy fallback chain 검증 — Avatar.anatomy.json 의 children 순서:
 *   image → initials → custom-fallback → default-fallback-icon
 *
 * 즉 4가지 정보 표현 우선순위가 정확히 코드와 일치해야 한다. 각 단계마다 어떤
 * DOM 요소가 노출되는지 명시적으로 검증한다.
 */
export const FallbackChainContract: Story = {
  render: (args) => (
    <div className="flex items-center gap-4" data-testid="row">
      <span data-testid="initials">
        <Avatar {...args} name="John Doe" />
      </span>
      <span data-testid="custom">
        <Avatar {...args} fallback={<StarIcon />} />
      </span>
      <span data-testid="default">
        <Avatar {...args} />
      </span>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 2순위: name → 이니셜 텍스트 + role=img + aria-label=name
    const initials = canvas.getByTestId('initials').firstElementChild!
    await expect(initials).toHaveAttribute('role', 'img')
    await expect(initials).toHaveAttribute('aria-label', 'John Doe')
    await expect(initials.textContent).toBe('JD')

    // 3순위: custom fallback — IconBox 안에 슬롯 자식 SVG
    const custom = canvas.getByTestId('custom').firstElementChild!
    await expect(custom).toHaveAttribute('role', 'img')
    await expect(custom.querySelector('svg')).not.toBeNull()

    // 4순위: 기본 person 아이콘 — name/fallback/src 모두 없음
    const def = canvas.getByTestId('default').firstElementChild!
    await expect(def).toHaveAttribute('role', 'img')
    await expect(def).toHaveAttribute('aria-label', 'Avatar')
    await expect(def.querySelector('svg')).not.toBeNull()
  },
}
