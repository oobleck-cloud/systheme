import { useRef, useState } from 'react'

import {
  anchorPopoverRootClassName,
  useDismissOnEscape,
  usePointerDownOutside,
} from './anchorPopover'
import { Panel } from './panel'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { cn } from '@/utils/cn'

/**
 * Story-only playground: documents the shared hook + class tokens used by pickers and anchored overlays.
 */
function AnchorPopoverPlayground() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  usePointerDownOutside({
    enabled: open,
    containerRef: rootRef,
    onPointerDownOutside: () => setOpen(false),
  })
  useDismissOnEscape(open, () => setOpen(false))

  return (
    <div ref={rootRef} className={cn(anchorPopoverRootClassName, 'max-w-xs')}>
      <Button type="button" onClick={() => setOpen((v) => !v)}>
        {open ? '닫기' : '열기'}
      </Button>
      {open && (
        <Panel className="p-3 text-sm text-fg">
          앵커 패널 예시입니다. 바깥을 누르거나 Escape 키로 닫을 수 있습니다.
        </Panel>
      )}
    </div>
  )
}

const meta: Meta<typeof AnchorPopoverPlayground> = {
  title: 'Primitives/AnchorPopover',
  component: AnchorPopoverPlayground,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof AnchorPopoverPlayground>

export const Default: Story = {}
