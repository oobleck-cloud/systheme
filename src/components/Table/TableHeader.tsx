import { Children, forwardRef, isValidElement } from 'react'

import { TableHead } from './TableHead'
import { TableRow } from './TableRow'

import { cn } from '@/utils/cn'

type TableHeaderProps = React.HTMLAttributes<HTMLTableSectionElement> & {
  /** anatomy `select-all` — 첫 헤더 셀 안에 렌더 (예: 전체 선택 체크박스) */
  selectAllSlot?: React.ReactNode
  /** `<tr>` 에 추가할 클래스 */
  rowClassName?: string
}

function isTableRowElement(child: React.ReactElement): boolean {
  const type = child.type as { displayName?: string }
  return type === TableRow || type.displayName === 'TableRow'
}

/** `TableHeader`는 내부 `<tr>`을 제공 — `TableHead`만 넣거나, 실수로 감싼 `TableRow` 한 겹은 펼칩니다. */
function resolveHeaderCells(children: React.ReactNode): React.ReactNode {
  const items = Children.toArray(children)
  if (items.length === 1 && isValidElement(items[0]) && isTableRowElement(items[0])) {
    return (items[0] as React.ReactElement<{ children?: React.ReactNode }>).props.children
  }
  return children
}

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, rowClassName, selectAllSlot, children, ...props }, ref) => {
    const headerCells = resolveHeaderCells(children)

    return (
      <thead ref={ref} data-slot="table-header" className={cn(className)} {...props}>
        <tr data-slot="header-row" className={cn(rowClassName)}>
          {selectAllSlot != null && selectAllSlot !== false && (
            <TableHead scope="col" className="w-12 min-w-12 px-2">
              {selectAllSlot}
            </TableHead>
          )}
          {headerCells}
        </tr>
      </thead>
    )
  },
)

TableHeader.displayName = 'TableHeader'

export { TableHeader }
export type { TableHeaderProps }
