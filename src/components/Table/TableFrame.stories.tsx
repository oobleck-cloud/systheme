import { TableBody } from './TableBody'
import { TableCell } from './TableCell'
import { TableChromeContext } from './TableChromeContext'
import { TableFrame } from './TableFrame'
import anatomy from './TableFrame.anatomy.json'
import { TableHead } from './TableHead'
import { TableHeader } from './TableHeader'
import { TableRow } from './TableRow'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof TableFrame> = {
  title: 'Components/L2/Table/TableFrame',
  component: TableFrame,
  tags: ['autodocs'],
  argTypes: {
    striped: { control: 'boolean' },
    layout: { control: 'select', options: ['auto', 'fixed'] },
  },
  args: { striped: false, layout: 'auto' },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof TableFrame>

export const Default: Story = {
  render: (args) => (
    <TableChromeContext.Provider value="panel">
      <TableFrame {...args}>
        <TableHeader>
          <TableHead>이름</TableHead>
          <TableHead>값</TableHead>
        </TableHeader>
        <TableBody>
          {['알파', '베타', '감마'].map((label, i) => (
            <TableRow key={label}>
              <TableCell>{label}</TableCell>
              <TableCell>{(i + 1) * 10}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableFrame>
    </TableChromeContext.Provider>
  ),
}

export const Striped: Story = {
  args: { striped: true },
  render: (args) => (
    <TableChromeContext.Provider value="panel">
      <TableFrame {...args}>
        <TableHeader>
          <TableHead>이름</TableHead>
          <TableHead>값</TableHead>
        </TableHeader>
        <TableBody>
          {['알파', '베타', '감마', '델타'].map((label, i) => (
            <TableRow key={label}>
              <TableCell>{label}</TableCell>
              <TableCell>{(i + 1) * 10}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableFrame>
    </TableChromeContext.Provider>
  ),
}
