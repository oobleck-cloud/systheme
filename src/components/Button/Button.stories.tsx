import { expect, fn, within } from '@storybook/test'

import { Button } from './Button'
import anatomy from './Button.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Button> = {
  title: 'Components/L1/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'primary',
        'tonal',
        'secondary',
        'outline',
        'ghost',
        'destructive',
        'destructive-outline',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
    density: {
      control: 'select',
      options: ['compact', 'default', 'loose'],
    },
    round: {
      control: 'select',
      options: ['none', 'default', 'full'],
    },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
    onClick: { action: 'clicked' },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    density: 'default',
    round: 'default',
    isLoading: false,
    disabled: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="tonal">
        Tonal
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="destructive-outline">
        Destructive Outline
      </Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-end gap-3">
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
}

export const Density: Story = {
  render: (args) => (
    <div className="flex flex-col gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-wrap items-center gap-3">
          <span className="w-6 text-xs text-fg-muted">{size}</span>
          <Button {...args} size={size} density="compact">
            Compact
          </Button>
          <Button {...args} size={size} density="default">
            Default
          </Button>
          <Button {...args} size={size} density="loose">
            Loose
          </Button>
        </div>
      ))}
    </div>
  ),
}

export const Round: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} round="none">
        None
      </Button>
      <Button {...args} round="default">
        Default
      </Button>
      <Button {...args} round="full">
        Full
      </Button>
    </div>
  ),
}

export const Loading: Story = {
  args: { isLoading: true },
}

export const Disabled: Story = {
  args: { disabled: true },
}

/**
 * Anatomy-driven 검증: `Button.anatomy.json` 의 `root.intent = press-action` →
 * 클릭 시 `onClick` 핸들러가 호출되어야 함을 자동 검증.
 */
export const AnatomyDriven: Story = {
  args: {
    children: 'Click me',
    onClick: fn(),
  },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: {
      // Button의 root는 <button> 자체이며 별도 data-slot이 없으므로 selector 지정
      selector: 'button',
      onPress: 'onClick',
    },
    icon: { skip: true },
    label: { skip: true },
  }),
}

/**
 * isLoading=true 일 때 disabled + aria-busy 가 동시에 적용되는지 검증.
 * Button anatomy 가 명시한 상태(`density`)와 별개로, 컴포넌트 prop 계약을 지킨다.
 *
 * 클릭 차단은 `disabled` 자체 + Tailwind `disabled:pointer-events-none`이
 * 결합돼 표현되므로 별도 click 시도는 하지 않는다. (userEvent v14 는
 * disabled 요소에 대해 click 이벤트를 발화하지 않음 — 이 자체가 계약 충족.)
 */
export const LoadingContract: Story = {
  args: { isLoading: true, onClick: fn() },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const btn = canvas.getByRole('button')
    await expect(btn).toBeDisabled()
    await expect(btn).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getByText('Loading')).toBeInTheDocument()
  },
}

/**
 * 긴 라벨 — 버튼은 줄바꿈하지 않는다(whitespace-nowrap). 한 줄이 계약이므로
 * 폭이 모자라면 부모가 폭을 제한하고 라벨을 잘라야 한다(두 번째 예: 안쪽 span 에 truncate).
 */
export const LongLabel: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      <Button {...args}>견적서를 고객에게 카카오톡으로 발송하고 상담 기록에 남기기</Button>
      <div className="w-56 rounded-md border border-dashed border-border p-2">
        <Button {...args} variant="outline" className="max-w-full">
          <span className="truncate">
            견적서를 고객에게 카카오톡으로 발송하고 상담 기록에 남기기
          </span>
        </Button>
      </div>
    </div>
  ),
}
