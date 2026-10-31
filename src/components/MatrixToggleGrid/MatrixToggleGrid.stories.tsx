import { fn } from '@storybook/test'

import { MatrixToggleGrid } from './MatrixToggleGrid'
import anatomy from './MatrixToggleGrid.anatomy.json'

import type { MatrixToggleRowDef, MatrixToggleValue } from './MatrixToggleGrid'
import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const rows: MatrixToggleRowDef[] = [
  {
    id: 'r1',
    label: 'Read invoices',
    cells: [{ id: 'c1' }, { id: 'c2' }],
  },
]

const defaultValue: MatrixToggleValue = {
  r1: { c1: true, c2: false },
}

const meta: Meta<typeof MatrixToggleGrid> = {
  title: 'Components/L2/MatrixToggleGrid',
  component: MatrixToggleGrid,
  tags: ['autodocs'],
  args: {
    rows,
    value: defaultValue,
    onChange: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MatrixToggleGrid>

export const Default: Story = {}

/** 여러 행·열 */
export const MultiRowMatrix: Story = {
  args: {
    rows: [
      {
        id: 'a',
        label: 'Invoices',
        cells: [{ id: 'v' }, { id: 'e' }],
      },
      {
        id: 'b',
        label: 'Payments',
        cells: [{ id: 'v' }, { id: 'e' }],
      },
    ],
    value: {
      a: { v: true, e: false },
      b: { v: false, e: true },
    },
  },
}

/** 한 행 전부 on */
export const RowAllOn: Story = {
  args: {
    rows: [
      {
        id: 'x',
        label: 'Admin',
        cells: [{ id: '1' }, { id: '2' }],
      },
    ],
    value: {
      x: { '1': true, '2': true },
    },
  },
}

/** 첫 셀 토글 → onChange */
export const AnatomyCellToggle: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    row: { skip: true },
    'row-label': { skip: true },
    cells: { skip: true },
    'cell-toggle': { onToggle: 'onChange' },
  }),
}
