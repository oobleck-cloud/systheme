import { ConnectedBox, ConnectedBoxDivider, ConnectedBoxSegment } from './connectedBox'
import anatomy from './connectedBox.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { SearchField } from '@/components/SearchField'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof ConnectedBox> = {
  title: 'Primitives/ConnectedBox',
  component: ConnectedBox,
  tags: ['autodocs'],
  args: {
    size: 'md',
    orientation: 'horizontal',
    className: 'max-w-md',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof ConnectedBox>

export const Default: Story = {
  render: (args) => (
    <ConnectedBox {...args}>
      <ConnectedBoxSegment flex="grow" className="px-3 py-2 text-sm text-fg-muted">
        Input segment
      </ConnectedBoxSegment>
      <ConnectedBoxDivider />
      <ConnectedBoxSegment flex="shrink">
        <Button
          type="button"
          size="md"
          density="compact"
          variant="primary"
          className="rounded-none"
        >
          검색
        </Button>
      </ConnectedBoxSegment>
    </ConnectedBox>
  ),
}

export const SearchFieldComposition: Story = {
  name: 'SearchField composition',
  render: () => (
    <>
      <p className="mb-3 max-w-md text-sm text-fg-muted">
        PR2/PR7: ConnectedBox → Surface kind=&quot;connected&quot;로 통합 예정. 현재는 ConnectedBox
        + SearchField 조합.
      </p>
      <SearchField
        className="max-w-md"
        size="md"
        density="compact"
        submitLayout="connected"
        placeholder="주문번호, 전화번호, 주소로 검색"
        submit={
          <Button type="button" size="md" density="compact" variant="primary">
            검색
          </Button>
        }
      />
    </>
  ),
}
