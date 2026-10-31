import { TableCaption } from './TableCaption'
import anatomy from './TableCaption.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableCaption> = {
  title: 'Components/L2/Table/TableCaption',
  component: TableCaption,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableCaption>

export const Default: Story = {
  render: () => (
    <table className="w-full border-collapse text-sm">
      <TableCaption text="주문 목록 (총 3건)" />
      <tbody>
        <tr>
          <td className="p-2 text-fg">Row 1</td>
        </tr>
      </tbody>
    </table>
  ),
}
