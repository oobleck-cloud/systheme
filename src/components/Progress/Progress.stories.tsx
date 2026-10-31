import { expect, within } from '@storybook/test'

import { Progress } from './Progress'
import anatomy from './Progress.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Progress> = {
  title: 'Components/L1/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'success', 'warning', 'error'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    showValue: { control: 'boolean' },
    shape: { control: 'inline-radio', options: ['bar', 'wave'] },
  },
  args: {
    value: 60,
    max: 100,
    label: '업로드 진행률',
    showValue: true,
    size: 'md',
    variant: 'default',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Progress>

export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-4">
      {(['default', 'success', 'warning', 'error'] as const).map((v) => (
        <Progress
          key={v}
          {...args}
          variant={v}
          label={v}
          value={[20, 50, 75, 95][['default', 'success', 'warning', 'error'].indexOf(v)]}
        />
      ))}
    </div>
  ),
}

export const Wave: Story = {
  name: 'Wave (M3E)',
  args: { shape: 'wave', value: 45, label: '공간 기록', showValue: true },
  render: (args) => (
    <div className="flex w-80 flex-col gap-6">
      <Progress {...args} />
      <Progress {...args} variant="success" value={70} label="성공 톤" />
      <Progress {...args} size="lg" value={30} label="lg 사이즈" />
    </div>
  ),
}

export const Indeterminate: Story = {
  args: { value: undefined, label: '로딩 중', showValue: false },
}

/**
 * Anatomy 검증 — root는 progressbar role, value-display의 binding=value.
 * 명시 값일 때는 aria-valuenow/aria-busy=false, undefined일 때는 aria-busy=true.
 */
export const ProgressbarContract: Story = {
  args: { value: 33, max: 100, label: 'Test' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar')
    await expect(bar).toHaveAttribute('aria-valuenow', '33')
    await expect(bar).toHaveAttribute('aria-valuemin', '0')
    await expect(bar).toHaveAttribute('aria-valuemax', '100')
    await expect(bar).toHaveAttribute('aria-busy', 'false')
  },
}

export const IndeterminateMarksBusy: Story = {
  args: { value: undefined, label: 'Loading' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar')
    await expect(bar).toHaveAttribute('aria-busy', 'true')
    await expect(bar).not.toHaveAttribute('aria-valuenow')
  },
}

/** value=0 — 채움은 없지만 트랙(테두리·배경)은 그대로 보인다. 0% 도 상태다. */
export const Empty: Story = {
  args: { value: 0, label: '업로드 대기', showValue: true },
  render: (args) => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await expect(canvas.getByText('0%')).toBeInTheDocument()
  },
}

/** value > max — 채움과 표시값 모두 100% 로 클램프한다. 트랙 밖으로 넘치지 않는다. */
export const Overflow: Story = {
  args: { value: 120, max: 100, label: '초과 값 (120 / 100)', showValue: true },
  render: (args) => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('100%')).toBeInTheDocument()
  },
}
