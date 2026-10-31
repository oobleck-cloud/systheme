import { TableCell } from './TableCell'
import anatomy from './TableCell.anatomy.json'
import { TableChromeContext } from './TableChromeContext'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableCell> = {
  title: 'Components/L2/Table/TableCell',
  component: TableCell,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableCell>

export const Default: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <TableCell>일반 셀</TableCell>
            <TableCell>또 다른 셀</TableCell>
          </tr>
        </tbody>
      </table>
    </TableChromeContext.Provider>
  ),
}

export const Highlighted: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <TableCell>일반 셀</TableCell>
            <TableCell highlight>강조 셀 (기한 초과 등)</TableCell>
          </tr>
        </tbody>
      </table>
    </TableChromeContext.Provider>
  ),
}
