import { TableChromeContext } from './TableChromeContext'
import { TableHead } from './TableHead'
import anatomy from './TableHead.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableHead> = {
  title: 'Components/L2/Table/TableHead',
  component: TableHead,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableHead>

export const Default: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <TableHead>주문번호</TableHead>
            <TableHead>담당자</TableHead>
            <TableHead>서비스 구역</TableHead>
          </tr>
        </thead>
      </table>
    </TableChromeContext.Provider>
  ),
}
