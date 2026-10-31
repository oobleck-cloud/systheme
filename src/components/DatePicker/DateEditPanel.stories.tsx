import { useState } from 'react'

import { DateEditPanel, type DateEditValue } from './DateEditPanel'
import anatomy from './DateEditPanel.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof DateEditPanel> = {
  title: 'Components/L1/DateEditPanel',
  component: DateEditPanel,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DateEditPanel>

/** 노션식 날짜 편집 패널 — 입력 + 달력 + 종료일/시간 토글 + 오늘/삭제. DatePicker·DateCellEditor 공용. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<DateEditValue>({
      start: new Date(2026, 4, 6),
      end: null,
      hasTime: false,
    })
    return (
      <div className="w-72 rounded-lg border border-border bg-background p-3 shadow-lg">
        <DateEditPanel value={value} onChange={setValue} />
      </div>
    )
  },
}

/** 미설정(빈 값) — 입력 placeholder, 삭제 미표시. */
export const Empty: Story = {
  render: () => {
    const [value, setValue] = useState<DateEditValue>(null)
    return (
      <div className="w-72 rounded-lg border border-border bg-background p-3 shadow-lg">
        <DateEditPanel value={value} onChange={setValue} />
      </div>
    )
  },
}

/** 기간 + 시간 초기값 — 종료일/시간 토글이 켜진 상태. */
export const RangeWithTime: Story = {
  render: () => {
    const [value, setValue] = useState<DateEditValue>({
      start: new Date(2026, 4, 6, 9, 0),
      end: new Date(2026, 4, 10, 18, 0),
      hasTime: true,
    })
    return (
      <div className="w-72 rounded-lg border border-border bg-background p-3 shadow-lg">
        <DateEditPanel value={value} onChange={setValue} />
      </div>
    )
  },
}

/** 단일 날짜 모드(DatePicker 가 쓰는 형태) — 종료일/시간 토글 없음. */
export const SingleOnly: Story = {
  render: () => {
    const [value, setValue] = useState<DateEditValue>({
      start: new Date(2026, 4, 6),
      end: null,
      hasTime: false,
    })
    return (
      <div className="w-64 rounded-lg border border-border bg-background p-2 shadow-lg">
        <DateEditPanel
          value={value}
          onChange={setValue}
          enableRange={false}
          enableTime={false}
          density="compact"
        />
      </div>
    )
  },
}
