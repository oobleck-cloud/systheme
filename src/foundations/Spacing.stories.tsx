import { FoundationTokenChip, SPACING_TOKENS, TokenCatalogGrid } from './tokenCatalog'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Foundations/Spacing',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Chips: Story = {
  name: 'Token chips',
  render: () => (
    <TokenCatalogGrid>
      {SPACING_TOKENS.map(({ token, utility, hint }) => (
        <FoundationTokenChip key={token} token={token} utility={utility} hint={hint}>
          <div
            className="h-3 rounded-sm bg-primary"
            style={{ width: `var(${token})` }}
            title={hint}
          />
        </FoundationTokenChip>
      ))}
    </TokenCatalogGrid>
  ),
}
