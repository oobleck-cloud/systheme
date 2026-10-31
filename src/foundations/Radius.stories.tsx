import { FoundationTokenChip, RADIUS_TOKENS, TokenCatalogGrid } from './tokenCatalog'

import type { Meta, StoryObj } from '@storybook/react'

import { cn } from '@/utils/cn'

const meta: Meta = {
  title: 'Foundations/Radius',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Chips: Story = {
  name: 'Token chips',
  render: () => (
    <TokenCatalogGrid>
      {RADIUS_TOKENS.map(({ token, utility, hint }) => (
        <FoundationTokenChip key={token} token={token} utility={utility} hint={hint}>
          <div className={cn('size-14 border-2 border-primary bg-primary/15', utility)} />
        </FoundationTokenChip>
      ))}
    </TokenCatalogGrid>
  ),
}
