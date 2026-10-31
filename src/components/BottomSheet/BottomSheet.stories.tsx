import { useRef, useState } from 'react'

import { Button } from '@/components/Button'

import { BottomSheet } from './BottomSheet'
import anatomy from './BottomSheet.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof BottomSheet> = {
  title: 'Components/L1/BottomSheet',
  component: BottomSheet,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof BottomSheet>

function ContainedDemo() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(true)
  return (
    <div
      ref={(el) => {
        hostRef.current = el
        if (el !== host) setHost(el)
      }}
      className="relative h-96 w-80 overflow-hidden rounded-2xl border border-border bg-canvas"
    >
      <div className="p-4">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          시트 열기
        </Button>
      </div>
      {host != null && (
        <BottomSheet open={open} onOpenChange={setOpen} container={host} title="방 추가">
          <div className="mt-3 flex flex-wrap gap-2">
            {['방', '거실', '주방', '화장실', '베란다', '직접 입력'].map((label, i) => (
              <button
                key={label}
                type="button"
                className={`min-h-11 rounded-md px-4 text-sm ${
                  i === 0
                    ? 'bg-primary-container font-semibold text-on-primary-container'
                    : 'bg-container font-medium'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="primary" size="lg" density="loose" round="full" className="mt-4 w-full">
            2번 방으로 추가
          </Button>
        </BottomSheet>
      )}
    </div>
  )
}

/** container 포털 — 시트를 호스트 프레임 안에 가둔다 (탭 워크스페이스·프리뷰 프레임) */
export const Contained: Story = {
  render: () => <ContainedDemo />,
}
