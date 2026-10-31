import { FactList, FactRow } from './FactList'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof FactList> = {
  title: 'Components/L1/FactList',
  component: FactList,
  parameters: { layout: 'padded' },
}
export default meta

type Story = StoryObj<typeof FactList>

export const Quotes: Story = {
  render: () => (
    <FactList title="받은 견적" aside="2 / 4" className="max-w-md">
      <FactRow label="견적" value="바른이삿짐센터" sub="2.5톤 1대 · 4명 · 여성 1" figure="125만" />
      <FactRow value="다온익스프레스" sub="1톤 2대 · 3명" figure="138만" />
      <FactRow
        separated
        label="시세"
        value={<span className="text-fg-subtle">마포구 25~34평 포장 · 42건</span>}
        figure="131만"
        figureMuted
      />
    </FactList>
  ),
}

export const Fit: Story = {
  render: () => (
    <FactList title="이 주문과 맞는 점" className="max-w-md">
      <FactRow mark="ok" label="구역" value="마포 · 고양" sub="계약 14 · 9" />
      <FactRow mark="ok" label="일정" value="10/14 비어 있음" />
      <FactRow mark="warn" label="차량" value="1톤" sub="질문지 2.5톤 이상" tone="warning" />
      <FactRow mark="none" label="연락" value="10/09 문자" sub="미확인" tone="warning" />
    </FactList>
  ),
}

export const Empty: Story = {
  render: () => (
    <FactList title="받은 견적" aside="0 / 4" className="max-w-md">
      <FactRow label="견적" value={<span className="text-fg-subtle">아직 없음</span>} />
    </FactList>
  ),
}
