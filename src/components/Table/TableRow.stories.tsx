import { fn, expect, userEvent, within } from '@storybook/test'

import { TableCell } from './TableCell'
import { TableChromeContext } from './TableChromeContext'
import { TableRow } from './TableRow'
import anatomy from './TableRow.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Checkbox } from '@/components/Checkbox'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableRow> = {
  title: 'Components/L2/Table/TableRow',
  component: TableRow,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableRow>

export const Default: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <TableRow>
            <TableCell>행 콘텐츠</TableCell>
            <TableCell>셀 2</TableCell>
          </TableRow>
        </tbody>
      </table>
    </TableChromeContext.Provider>
  ),
}

export const Clickable: Story = {
  args: { rowId: 'row-1', onActivate: fn() },
  render: (args) => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <TableRow rowId={args.rowId} onActivate={args.onActivate}>
            <TableCell>클릭 가능한 행</TableCell>
            <TableCell>셀 2</TableCell>
          </TableRow>
        </tbody>
      </table>
    </TableChromeContext.Provider>
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('클릭 가능한 행'))
    await expect(args.onActivate).toHaveBeenCalledWith('row-1')
  },
}

export const WithSelection: Story = {
  render: () => (
    <TableChromeContext.Provider value="panel">
      <table className="w-full border-collapse text-sm">
        <tbody>
          <TableRow selectionSlot={<Checkbox aria-label="행 선택" />}>
            <TableCell>선택 가능한 행</TableCell>
            <TableCell>셀 2</TableCell>
          </TableRow>
        </tbody>
      </table>
    </TableChromeContext.Provider>
  ),
}
