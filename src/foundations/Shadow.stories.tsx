import { FoundationTokenChip, SHADOW_TOKENS, TokenCatalogGrid } from './tokenCatalog'

import type { Meta, StoryObj } from '@storybook/react'

import { cn } from '@/utils/cn'

const meta: Meta = {
  title: 'Foundations/Shadow',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

export const Chips: Story = {
  name: 'Token chips',
  render: () => (
    <div className="space-y-4">
      <p className="max-w-prose text-sm text-fg-muted">
        Box Language 기준: <code className="text-fg">shadow-panel</code> = Panel glass,{' '}
        <code className="text-fg">shadow-dialog</code> = Panel solid dialog/edge,{' '}
        <code className="text-fg">shadow-float</code> = Panel solid compact.{' '}
        <code className="text-fg">shadow-panel</code> lift는{' '}
        <code className="text-fg">0 7px 29px</code> 블루 틴트(265°)입니다.
      </p>
      <TokenCatalogGrid>
        {SHADOW_TOKENS.map(({ token, utility, hint }) => (
          <FoundationTokenChip key={token} token={token} utility={utility} hint={hint}>
            <div className="relative flex h-28 items-center justify-center rounded-lg bg-gradient-to-br from-surface to-muted p-6">
              <div
                className={cn(
                  'size-20 rounded-2xl border border-border/50 bg-background/80 backdrop-blur-xl',
                  utility,
                )}
              />
            </div>
          </FoundationTokenChip>
        ))}
      </TokenCatalogGrid>
    </div>
  ),
}
