import { useState } from 'react'

import { SideSheet } from './SideSheet'
import { SideSheetHost } from './SideSheetHost'
import anatomy from './SideSheetHost.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SideSheetHost> = {
  title: 'Components/L2/SideSheet/Host',
  component: SideSheetHost,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof SideSheetHost>

/**
 * 호스트는 셸 최상위 한 곳에만 둔다. 양쪽 슬롯이 있어 좌·우 시트를 동시에 열 수 있고,
 * `fixed` 크롬은 `--ds-side-sheet-inset-end` 를 읽어 비켜선다(아래 배지가 그 예).
 */
export const BothSides: Story = {
  render: () => {
    const [left, setLeft] = useState(false)
    const [right, setRight] = useState(true)
    return (
      <SideSheetHost className="relative h-96 w-full overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex h-full w-full min-w-0 flex-col gap-3 p-4">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setLeft((v) => !v)}>
              왼쪽 시트
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setRight((v) => !v)}>
              오른쪽 시트
            </Button>
          </div>
          <p className="text-sm text-fg-muted">가운데 본문이 양쪽 시트만큼 좁아진다.</p>
          <span className="mt-auto self-end rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg-muted">
            fixed 크롬은 inset 변수를 읽는다
          </span>
        </div>

        <SideSheet open={left} onOpenChange={setLeft} side="left" title="필터" defaultWidth={320}>
          <p className="p-4 text-sm text-fg-muted">왼쪽</p>
        </SideSheet>
        <SideSheet open={right} onOpenChange={setRight} title="고객 이력">
          <p className="p-4 text-sm text-fg-muted">오른쪽</p>
        </SideSheet>
      </SideSheetHost>
    )
  },
}
