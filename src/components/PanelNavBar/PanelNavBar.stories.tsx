import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { PanelNavBar } from './PanelNavBar'
import anatomy from './PanelNavBar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { SearchField } from '@/components/SearchField'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof PanelNavBar> = {
  title: 'Components/L1/PanelNavBar',
  component: PanelNavBar,
  tags: ['autodocs'],
  argTypes: {
    canGoBack: { control: 'boolean' },
    canGoForward: { control: 'boolean' },
    density: { control: 'select', options: ['compact', 'default'] },
  },
  args: {
    canGoBack: false,
    canGoForward: false,
    density: 'default',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl border border-border">
        <Story />
      </div>
    ),
  ],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof PanelNavBar>

export const Default: Story = {}

export const BackEnabled: Story = {
  args: { canGoBack: true },
}

export const ForwardEnabled: Story = {
  args: { canGoForward: true },
}

export const BothEnabled: Story = {
  args: { canGoBack: true, canGoForward: true },
}

export const Compact: Story = {
  args: { density: 'compact', canGoBack: true, canGoForward: true },
}

export const WithEndContent: Story = {
  args: {
    canGoBack: true,
    canGoForward: false,
    endContent: <span className="text-xs text-fg-muted">2 / 5</span>,
  },
}

/**
 * L1 다른 컴포넌트(`SearchField`)를 `endContent`로 두는 합성 예시.
 * 앱 레이어의 라우트별 툴바도 동일 슬롯으로 연결할 수 있습니다.
 */
export const WithEndContentSearchField: Story = {
  name: 'endContent — SearchField',
  args: {
    canGoBack: true,
    canGoForward: true,
  },
  render: function PanelNavWithSearchField(args) {
    const [query, setQuery] = useState('')
    return (
      <PanelNavBar
        {...args}
        endContent={
          <div className="flex min-w-0 max-w-xs flex-1 items-center justify-end">
            <SearchField
              size="sm"
              density="compact"
              placeholder="검색…"
              aria-label="패널 내 검색"
              value={query}
              onValueChange={setQuery}
              className="min-w-0"
            />
          </div>
        }
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByLabelText('패널 내 검색')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: '이전 페이지로' })).toBeInTheDocument()
  },
}

/**
 * Anatomy 검증 — back 버튼은 stepper. canGoBack=true 상태에서 클릭 시 onGoBack 호출.
 * canGoBack=false 상태에서는 버튼이 disabled 처리됩니다.
 */
export const StepperContract: Story = {
  args: {
    canGoBack: true,
    canGoForward: true,
    onGoBack: fn(),
    onGoForward: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const backBtn = canvas.getByRole('button', { name: '이전 페이지로' })
    const forwardBtn = canvas.getByRole('button', { name: '다음 페이지로' })

    await userEvent.click(backBtn)
    await expect(args.onGoBack).toHaveBeenCalledTimes(1)

    await userEvent.click(forwardBtn)
    await expect(args.onGoForward).toHaveBeenCalledTimes(1)
  },
}

export const DisabledState: Story = {
  args: {
    canGoBack: false,
    canGoForward: false,
    onGoBack: fn(),
    onGoForward: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const backBtn = canvas.getByRole('button', { name: '이전 페이지로' })
    const forwardBtn = canvas.getByRole('button', { name: '다음 페이지로' })

    await expect(backBtn).toBeDisabled()
    await expect(forwardBtn).toBeDisabled()

    await userEvent.click(backBtn)
    await userEvent.click(forwardBtn)
    await expect(args.onGoBack).not.toHaveBeenCalled()
    await expect(args.onGoForward).not.toHaveBeenCalled()
  },
}
