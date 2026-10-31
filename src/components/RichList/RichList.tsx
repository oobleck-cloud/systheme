'use client'

import { useState } from 'react'

import { RichListRow } from './RichListRow'

import { Spinner } from '@/components/Spinner'
import { Box } from '@/primitives/box'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'
import { dropdownListShellVariants } from '@/utils/dropdownDensity'

type RichListDensity = 'compact' | 'default' | 'loose'

type RichListSelectionMode = 'none' | 'single' | 'multiple'

type RichListStatusTag = {
  label: string
  variant:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | 'info'
    | 'outline'
    | 'outline-primary'
    | 'outline-success'
    | 'outline-warning'
    | 'outline-error'
    | 'outline-info'
}

type RichListItem = {
  id: string
  title: string
  /** 주문번호 아래 보조 줄 (지역·짧은 주소 등) */
  subtitle?: string
  description?: string
  /** 상태 뱃지 — 목록·검색 등 시맨틱 색상 */
  statusTag?: RichListStatusTag
  /** 레거시 — statusTag 없을 때 outline 뱃지 */
  tags?: string[]
  timestamp?: string
  /** 제목 행 오른쪽 메타 (전화번호 등) */
  trailingText?: string
  disabled?: boolean
}

type RichListChrome = 'floating' | 'embedded'

type RichListProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  items: RichListItem[]
  /**
   * `floating` — 자체 Panel(absolute) 크롬. 단독 드롭다운용.
   * `embedded` — 부모 앵커 패널 안에 넣을 때. Panel 포지셔닝 없음.
   */
  chrome?: RichListChrome
  density?: RichListDensity
  selectionMode?: RichListSelectionMode
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  loading?: boolean
  /** items 가 비었을 때 목록 안에 표시 (Select 패널의 "옵션 없음"과 동일) */
  emptyMessage?: string
  /** 부모 Panel 이 스크롤·힌트를 담당할 때 false */
  scrollHint?: boolean
  'aria-label'?: string
  onItemActivate?: (itemId: string) => void
  onSelectionChange?: (selectedIds: string[]) => void
  /** 행별 leading 슬롯 (avatar/icon) */
  renderLeading?: (item: RichListItem) => React.ReactNode
  renderTrailing?: (item: RichListItem) => React.ReactNode
}

function RichList({
  className,
  items,
  chrome = 'floating',
  density = 'default',
  selectionMode = 'none',
  selectedIds: selectedIdsProp,
  defaultSelectedIds = [],
  loading = false,
  emptyMessage = '항목 없음',
  scrollHint: scrollHintProp = true,
  'aria-label': ariaLabel = '목록',
  onItemActivate,
  onSelectionChange,
  renderLeading,
  renderTrailing,
  ...props
}: RichListProps) {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(defaultSelectedIds)
  const isControlled = selectedIdsProp !== undefined
  const selectedIds = isControlled ? selectedIdsProp! : internalSelectedIds
  const isEmpty = !loading && items.length === 0
  const showChevron = onItemActivate != null
  // Roving tabindex: the focused row is the single tab stop, following arrow-key / focus movement.
  const [focusedId, setFocusedId] = useState<string | null>(null)

  function isSelected(id: string) {
    return selectedIds.includes(id)
  }

  function toggleSelection(id: string, next?: boolean) {
    if (selectionMode === 'none') return
    let nextIds: string[]
    if (selectionMode === 'single') {
      nextIds = next === false ? [] : [id]
    } else {
      const has = selectedIds.includes(id)
      const checked = next ?? !has
      nextIds = checked
        ? [...selectedIds, id]
        : selectedIds.filter((selectedId) => selectedId !== id)
    }
    if (!isControlled) setInternalSelectedIds(nextIds)
    onSelectionChange?.(nextIds)
  }

  function handleRowActivate(id: string) {
    if (selectionMode === 'single') {
      toggleSelection(id, true)
    } else if (selectionMode === 'multiple') {
      toggleSelection(id)
      return
    }
    onItemActivate?.(id)
  }

  // WAI-ARIA listbox: Arrow keys navigate between items
  function handleListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const rows = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        '[data-slot="rich-list-row"]:not([aria-disabled="true"])',
      ),
    )
    const currentIdx = rows.findIndex((r) => r === document.activeElement)
    let nextIdx = -1

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        nextIdx = Math.min(currentIdx + 1, rows.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        nextIdx = Math.max(currentIdx - 1, 0)
        break
      case 'Home':
        e.preventDefault()
        nextIdx = 0
        break
      case 'End':
        e.preventDefault()
        nextIdx = rows.length - 1
        break
    }

    if (nextIdx >= 0) rows[nextIdx]?.focus()
  }

  const listBody = loading ? (
    <div
      data-slot="rich-list-loading-scrim"
      className="relative flex min-h-24 items-center justify-center"
      aria-hidden
    >
      <Spinner
        data-slot="rich-list-loading-indicator"
        size="sm"
        accessibilityLabel="목록 불러오는 중"
      />
    </div>
  ) : (
    <div
      data-slot="rich-list-scroll-region"
      className={cn(dropdownListShellVariants({ density }), chrome === 'embedded' && 'max-h-none')}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- onKeyDown delegated to inner interactive row items */}
      <ul data-slot="rich-list-items" onKeyDown={handleListKeyDown}>
        {isEmpty ? (
          <li
            data-slot="rich-list-empty"
            role="presentation"
            className={cn(
              'px-3 py-2 text-fg-muted',
              density === 'compact' && 'px-2.5 py-1.5 text-xs',
              density === 'loose' && 'px-4 py-2.5 text-base',
              density === 'default' && 'text-sm',
            )}
          >
            {emptyMessage}
          </li>
        ) : (
          (() => {
            // Default tab stop: selected (or first) enabled row; otherwise the focused row.
            const selectedTabStop = items.find(
              (it) => !it.disabled && (selectionMode !== 'none' ? isSelected(it.id) : true),
            )
            const firstEnabled = items.find((it) => !it.disabled)
            const defaultTabStopId = (selectedTabStop ?? firstEnabled)?.id ?? null
            const activeTabStopId =
              focusedId != null && items.some((it) => it.id === focusedId && !it.disabled)
                ? focusedId
                : defaultTabStopId
            return items.map((item) => (
              <RichListRow
                key={item.id}
                item={item}
                density={density}
                selected={isSelected(item.id)}
                selectionMode={selectionMode}
                showChevron={showChevron}
                leadingSlot={renderLeading?.(item)}
                trailingSlot={renderTrailing?.(item)}
                disabled={item.disabled}
                isTabStop={item.id === activeTabStopId}
                onRowActivate={handleRowActivate}
                onRowFocus={setFocusedId}
                onSelectToggle={(checked) => toggleSelection(item.id, checked)}
              />
            ))
          })()
        )}
      </ul>
    </div>
  )

  const rootClassName = cn(
    'w-full min-w-0',
    chrome === 'embedded' && 'border-0 shadow-none',
    className,
  )

  const rootProps = {
    'data-slot': 'rich-list-root',
    'data-chrome': chrome,
    'data-density': density,
    'data-selection-mode': selectionMode,
    'data-loading': loading ? '' : undefined,
    'data-empty': isEmpty ? '' : undefined,
    role: 'listbox' as const,
    'aria-label': ariaLabel,
    'aria-busy': loading || undefined,
    className: rootClassName,
    ...props,
  }

  if (chrome === 'embedded') {
    return (
      <Box scrollHint={scrollHintProp} scrollHintClassName="rounded-b-md" {...rootProps}>
        {listBody}
      </Box>
    )
  }

  return (
    <Panel scrollHint {...rootProps}>
      {listBody}
    </Panel>
  )
}

export { RichList }
export type {
  RichListChrome,
  RichListDensity,
  RichListItem,
  RichListProps,
  RichListSelectionMode,
  RichListStatusTag,
}
