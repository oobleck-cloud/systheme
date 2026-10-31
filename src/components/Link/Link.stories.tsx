import { expect, within } from '@storybook/test'

import { Link } from './Link'
import anatomy from './Link.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta = {
  title: 'Components/L1/Link',
  component: Link,
  tags: ['autodocs'],
  args: {
    href: 'https://example.com',
    children: 'Example link',
    variant: 'default',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'subtle', 'muted'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Link>

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithIcons: Story = {
  args: {
    href: '/docs',
    external: false,
    leading: (
      <svg
        aria-hidden
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 8h10M8 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    trailing: (
      <svg
        aria-hidden
        className="h-3.5 w-3.5"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    children: '문서로 이동',
  },
}

/**
 * Anatomy 검증 — root는 routing-link, href binding이 실제 anchor href에
 * 적용되어야 함. external 속성이 있으면 target=_blank + rel=noopener.
 */
export const ExternalLinkContract: Story = {
  args: { href: 'https://example.com', external: true, children: '외부 사이트' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const a = canvas.getByRole('link', { name: /외부 사이트/ })
    await expect(a).toHaveAttribute('href', 'https://example.com')
    await expect(a).toHaveAttribute('target', '_blank')
    const rel = a.getAttribute('rel') ?? ''
    await expect(rel).toMatch(/noopener|noreferrer/)
  },
}
