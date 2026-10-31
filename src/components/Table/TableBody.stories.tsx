import { TableBody } from './TableBody'
import anatomy from './TableBody.anatomy.json'
import { TableCell } from './TableCell'
import { TableRow } from './TableRow'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableBody> = {
  title: 'Components/L2/Table/TableBody',
  component: TableBody,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableBody>

export const Default: Story = {
  render: () => (
    <table className="w-full border-collapse text-sm">
      <TableBody>
        <TableRow>
          <TableCell>셀 1-1</TableCell>
          <TableCell>셀 1-2</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>셀 2-1</TableCell>
          <TableCell>셀 2-2</TableCell>
        </TableRow>
      </TableBody>
    </table>
  ),
}
