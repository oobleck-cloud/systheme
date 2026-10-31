import { TableChromeContext } from './TableChromeContext'
import { TableHead } from './TableHead'
import { TableHeader } from './TableHeader'
import anatomy from './TableHeader.anatomy.json'
import { TableRow } from './TableRow'

import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox } from '@/components/Checkbox'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableHeader> = {
  title: 'Components/L2/Table/TableHeader',
  component: TableHeader,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableHeader>

export const Default: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <TableHeader>
          <TableHead>이름</TableHead>
          <TableHead>상태</TableHead>
        </TableHeader>
      </table>
    </TableChromeContext.Provider>
  ),
}

export const WithSelectAll: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <TableHeader selectAllSlot={<Checkbox aria-label="전체 선택" />}>
          <TableHead>이름</TableHead>
          <TableHead>상태</TableHead>
        </TableHeader>
      </table>
    </TableChromeContext.Provider>
  ),
}

/** `TableRow`로 한 겹 감싼 경우에도 단일 `<tr>`로 펼쳐 헤더·본문 열이 맞습니다. */
export const NestedTableRowFlattened: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <TableHeader>
          <TableRow>
            <TableHead>시각</TableHead>
            <TableHead>방향</TableHead>
          </TableRow>
        </TableHeader>
      </table>
    </TableChromeContext.Provider>
  ),
}
