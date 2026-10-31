/**
 * L3 — Table compositions
 *
 * Layer map (패키지 export·`components/Table/index.ts` 와 동일):
 *   L3  Table — chrome, density, loading scrim, scroll region, empty slot
 *   L2  TableFrame, TableCaption, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableStackedText
 *
 * Timeline 과 같이 L3 는 “레이아웃·컨텍스트 허브”, L2 는 그 아래 HTML/시맨틱 블록입니다.
 */
import { useMemo, useState } from 'react'

import { Alert } from '../Alert/Alert'
import { Badge } from '../Badge/Badge'
import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { EmptyState } from '../EmptyState/EmptyState'

import tableAnatomy from './Table.anatomy.json'

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
  TableStackedText,
} from './index'

import type { TableChrome } from './TableChromeContext'
import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Table> = {
  title: 'Components/L3/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    loading: { control: 'boolean' },
    chrome: { control: 'select', options: ['panel', 'flush'] },
  },
  args: {
    loading: false,
    chrome: 'panel',
  },
}

mergeAnatomyMeta(meta, tableAnatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Table>

type DemoRow = { id: string; label: string; status: string }

const demoRows: DemoRow[] = [
  { id: '1', label: 'Row one', status: 'Active' },
  { id: '2', label: 'Row two', status: 'Pending' },
  { id: '3', label: 'Row three', status: 'Done' },
]

function SelectionTable({ loading, chrome }: { loading?: boolean; chrome?: TableChrome }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const allIds = useMemo(() => demoRows.map((r) => r.id), [])
  const allSelected = selected.size === allIds.length && allIds.length > 0
  const someSelected = selected.size > 0 && !allSelected

  return (
    <Table chrome={chrome} loading={loading}>
      <TableFrame>
        <TableCaption text="Table caption" />
        <TableHeader
          selectAllSlot={
            <Checkbox
              aria-label="Select all rows"
              checked={allSelected}
              indeterminate={someSelected}
              onCheckedChange={(checked) => {
                setSelected(checked ? new Set(allIds) : new Set())
              }}
            />
          }
        >
          <TableHead className="min-w-[6rem]">Label</TableHead>
          <TableHead>Status</TableHead>
        </TableHeader>
        <TableBody>
          {demoRows.map((row) => (
            <TableRow
              key={row.id}
              selectionSlot={
                <Checkbox
                  aria-label={`Select ${row.label}`}
                  checked={selected.has(row.id)}
                  onCheckedChange={(checked) => {
                    setSelected((prev) => {
                      const n = new Set(prev)
                      if (checked) n.add(row.id)
                      else n.delete(row.id)
                      return n
                    })
                  }}
                />
              }
            >
              <TableCell className="font-medium">{row.label}</TableCell>
              <TableCell className="text-fg-muted">{row.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableFrame>
    </Table>
  )
}

export const Default: Story = {
  name: 'Selection (panel)',
  render: (args) => <SelectionTable loading={args.loading} chrome={args.chrome} />,
}

export const Loading: Story = {
  args: { loading: true },
  render: (args) => <SelectionTable loading={args.loading} chrome={args.chrome} />,
}

export const ChromeFlush: Story = {
  name: 'Chrome · flush',
  render: () => (
    <Table chrome="flush">
      <TableFrame>
        <TableHeader>
          <TableHead>Column A</TableHead>
          <TableHead>Column B</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alpha</TableCell>
            <TableCell>101</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Beta</TableCell>
            <TableCell>202</TableCell>
          </TableRow>
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

export const StripedRows: Story = {
  name: 'Striped rows',
  render: () => (
    <Table chrome="panel">
      <TableFrame striped>
        <TableHeader>
          <TableHead>Item</TableHead>
          <TableHead>Value</TableHead>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4].map((n) => (
            <TableRow key={n}>
              <TableCell>Item {n}</TableCell>
              <TableCell>{n * 10}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

export const StripedRowsFlush: Story = {
  name: 'Striped rows · flush',
  render: () => (
    <Table chrome="flush">
      <TableFrame striped>
        <TableHeader>
          <TableHead>Item</TableHead>
          <TableHead>Value</TableHead>
        </TableHeader>
        <TableBody>
          {[1, 2, 3, 4].map((n) => (
            <TableRow key={n}>
              <TableCell>Item {n}</TableCell>
              <TableCell>{n * 10}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

export const StackedCell: Story = {
  name: 'Stacked text in cell',
  render: () => (
    <Table chrome="flush">
      <TableFrame>
        <TableHeader>
          <TableHead>When</TableHead>
          <TableHead>Summary</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <TableStackedText primary="2026-01-15" secondary="2:30 PM" />
            </TableCell>
            <TableCell>Short note</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <TableStackedText primary="2026-01-16" secondary="9:00 AM" />
            </TableCell>
            <TableCell>Another row</TableCell>
          </TableRow>
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

export const HighlightedCell: Story = {
  name: 'Highlighted cell',
  render: () => (
    <Table chrome="flush">
      <TableFrame>
        <TableHeader>
          <TableHead>Name</TableHead>
          <TableHead>Due</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Task A</TableCell>
            <TableCell highlight>2026-02-01</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Task B</TableCell>
            <TableCell>2026-02-10</TableCell>
          </TableRow>
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

export const StatusBadgesInCells: Story = {
  name: 'Status badges in cells',
  render: () => (
    <Table chrome="flush">
      <TableFrame>
        <TableHeader>
          <TableHead>Job</TableHead>
          <TableHead>State</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Sync</TableCell>
            <TableCell>
              <Badge variant="warning" size="sm" dot>
                Running
              </Badge>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Import</TableCell>
            <TableCell>
              <Badge variant="default" size="sm" dot>
                Skipped
              </Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

export const LongTextClamp: Story = {
  name: 'Long text · line clamp',
  render: () => (
    <Table chrome="flush">
      <TableFrame>
        <TableHeader>
          <TableHead className="max-w-[12rem]">Description</TableHead>
          <TableHead>Code</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="max-w-[12rem] text-fg-muted">
              <span className="line-clamp-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore.
              </span>
            </TableCell>
            <TableCell className="tabular-nums">001</TableCell>
          </TableRow>
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

/** 빈 상태 — 헤더는 남기고 본문 한 행(colSpan)에 EmptyState 를 넣는다. 표의 크롬·폭이 유지된다. */
export const Empty: Story = {
  name: 'Empty (EmptyState inside)',
  render: () => (
    <Table chrome="panel">
      <TableFrame>
        <TableHeader>
          <TableHead>주문</TableHead>
          <TableHead>상태</TableHead>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2} className="p-0">
              <EmptyState
                className="mx-auto"
                title="주문이 없습니다"
                message="필터를 바꾸거나 기간을 넓혀 보세요."
                secondaryAction={
                  <Button type="button" variant="outline" size="sm">
                    필터 초기화
                  </Button>
                }
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </TableFrame>
    </Table>
  ),
}

/** 오류 — 표 위에 Alert(danger). 마지막으로 불러온 행은 남기고 "다시 시도" 를 액션으로 준다. */
export const LoadError: Story = {
  name: 'Error (Alert above table)',
  render: () => (
    <div className="flex flex-col gap-3">
      <Alert
        severity="danger"
        title="주문 목록을 불러오지 못했습니다"
        action={
          <Button type="button" variant="outline" size="sm">
            다시 시도
          </Button>
        }
      >
        서버 응답이 없습니다. 마지막으로 불러온 목록을 표시하고 있습니다.
      </Alert>
      <Table chrome="panel">
        <TableFrame>
          <TableHeader>
            <TableHead>주문</TableHead>
            <TableHead>상태</TableHead>
          </TableHeader>
          <TableBody>
            {demoRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-fg-muted">{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableFrame>
      </Table>
    </div>
  ),
}
