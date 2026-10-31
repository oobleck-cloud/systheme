import { TableCell } from './TableCell'
import { TableChromeContext } from './TableChromeContext'
import { TableFooter } from './TableFooter'
import anatomy from './TableFooter.anatomy.json'
import { TableRow } from './TableRow'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableFooter> = {
  title: 'Components/L2/Table/TableFooter',
  component: TableFooter,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableFooter>

export const Default: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <TableRow>
            <TableCell>행 1</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
        </tbody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-semibold">합계</TableCell>
            <TableCell className="font-semibold">100</TableCell>
          </TableRow>
        </TableFooter>
      </table>
    </TableChromeContext.Provider>
  ),
}
