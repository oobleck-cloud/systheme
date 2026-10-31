import { ExternalLink } from './ExternalLink'
import anatomy from './ExternalLink.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ExternalLink> = {
  title: 'Components/L1/ExternalLink',
  component: ExternalLink,
  tags: ['autodocs'],
  args: {
    label: 'HubSpot CRM',
    href: 'https://example.com',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ExternalLink>

export const Default: Story = {}

export const MultipleLinks: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <ExternalLink label="HubSpot CRM" href="https://example.com" />
      <ExternalLink label="Salesforce" href="https://example.com" />
      <ExternalLink label="Slack" href="https://example.com" />
    </div>
  ),
}

export const InlineWithText: Story = {
  render: () => (
    <div className="flex items-center gap-2 text-sm text-fg">
      <span>연동된 서비스:</span>
      <ExternalLink label="HubSpot CRM" href="https://example.com" />
    </div>
  ),
}
