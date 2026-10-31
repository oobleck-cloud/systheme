'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import type { RichListDensity, RichListItem } from './RichList'

import { Badge } from '@/components/Badge'
import { Checkbox } from '@/components/Checkbox'
import { cn } from '@/utils/cn'

const richListRowVariants = cva(
  [
    'flex w-full items-center gap-2 border-b border-border text-left transition-colors outline-none select-none last:border-b-0',
    'hover:bg-surface focus-visible:bg-surface',
  ],
  {
    variants: {
      density: {
        compact: 'gap-2 px-2.5 py-2.5',
        default: 'gap-3 px-3 py-3',
        loose: 'gap-3 px-4 py-3.5',
      },
      selected: {
        true: 'bg-secondary text-fg hover:bg-secondary',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50 hover:bg-transparent',
        false: 'cursor-pointer',
      },
    },
    defaultVariants: {
      density: 'default',
      selected: false,
      disabled: false,
    },
  },
)

const titleSize = {
  compact: 'text-sm',
  default: 'text-sm',
  loose: 'text-base',
} as const

const metaTextSize = {
  compact: 'text-xs',
  default: 'text-xs',
  loose: 'text-sm',
} as const

type RichListRowProps = {
  item: RichListItem
  density: RichListDensity
  selected: boolean
  selectionMode: 'none' | 'single' | 'multiple'
  showChevron: boolean
  leadingSlot?: React.ReactNode
  trailingSlot?: React.ReactNode
  /** roving tabindex: true인 행만 tabIndex=0, 나머지는 -1 */
  isTabStop?: boolean
  onRowActivate?: (id: string) => void
  /** roving tabindex 동기화: 행이 포커스를 받으면 호출 */
  onRowFocus?: (id: string) => void
  /** Raw keyboard escape hatch */
  onRowKeyDown?: (e: React.KeyboardEvent<HTMLLIElement>) => void
  onSelectToggle?: (checked: boolean) => void
} & VariantProps<typeof richListRowVariants>

function RichListRow({
  item,
  density,
  selected,
  selectionMode,
  showChevron,
  leadingSlot,
  trailingSlot,
  isTabStop = false,
  onRowActivate,
  onRowFocus,
  onRowKeyDown,
  onSelectToggle,
  disabled: disabledProp,
}: RichListRowProps) {
  const disabled = disabledProp ?? item.disabled ?? false
  const hasLegacyTags = item.tags != null && item.tags.length > 0
  const hasStatusTag = item.statusTag != null
  const hasFooter = hasStatusTag || hasLegacyTags || item.timestamp != null
  const showTrailingColumn = showChevron || (trailingSlot != null && trailingSlot !== false)

  function handleKeyDown(e: React.KeyboardEvent<HTMLLIElement>) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onRowActivate?.(item.id)
    }
    onRowKeyDown?.(e)
  }

  return (
    <li
      data-slot="rich-list-row"
      role="option"
      aria-selected={selectionMode !== 'none' ? selected : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : isTabStop ? 0 : -1}
      className={richListRowVariants({ density, selected, disabled })}
      onClick={(e) => {
        if (disabled) return
        if ((e.target as Element).closest('[data-slot="rich-list-row-select"]')) return
        onRowActivate?.(item.id)
      }}
      onFocus={disabled ? undefined : () => onRowFocus?.(item.id)}
      onKeyDown={handleKeyDown}
    >
      {selectionMode === 'multiple' ? (
        <div data-slot="rich-list-row-select" className="flex shrink-0 self-start pt-0.5">
          <Checkbox
            size={density === 'loose' ? 'md' : 'sm'}
            checked={selected}
            disabled={disabled}
            aria-label={`${item.title} 선택`}
            onCheckedChange={(checked) => onSelectToggle?.(checked)}
          />
        </div>
      ) : null}

      {leadingSlot != null && leadingSlot !== false ? (
        <div data-slot="rich-list-leading" className="shrink-0 self-start">
          {leadingSlot}
        </div>
      ) : null}

      <div data-slot="rich-list-body" className="min-w-0 flex-1">
        <div data-slot="rich-list-title-row" className="flex items-baseline justify-between gap-3">
          <div
            data-slot="rich-list-title"
            className={cn('min-w-0 truncate font-semibold text-fg', titleSize[density])}
          >
            {item.title}
          </div>
          {item.trailingText != null && item.trailingText !== '' ? (
            <span
              data-slot="rich-list-trailing-text"
              className={cn('shrink-0 tabular-nums text-fg-muted', metaTextSize[density])}
            >
              {item.trailingText}
            </span>
          ) : null}
        </div>

        {item.subtitle != null && item.subtitle !== '' ? (
          <div
            data-slot="rich-list-subtitle"
            className={cn('mt-1 truncate text-fg-muted', metaTextSize[density])}
          >
            {item.subtitle}
          </div>
        ) : null}

        {item.description != null && item.description !== '' ? (
          <div
            data-slot="rich-list-description"
            className={cn('mt-0.5 line-clamp-2 text-fg-muted', metaTextSize[density])}
          >
            {item.description}
          </div>
        ) : null}

        {hasFooter ? (
          <div
            data-slot="rich-list-metadata"
            className={cn(
              'mt-2 flex flex-wrap items-center gap-2',
              density === 'compact' && 'mt-1.5',
            )}
          >
            {hasStatusTag ? (
              <span data-slot="rich-list-tag">
                <Badge variant={item.statusTag!.variant} size="sm">
                  {item.statusTag!.label}
                </Badge>
              </span>
            ) : null}
            {hasLegacyTags ? (
              <div data-slot="rich-list-tags" className="flex flex-wrap gap-1">
                {item.tags!.map((tag) => (
                  <span key={tag} data-slot="rich-list-tag">
                    <Badge variant="outline" size="sm">
                      {tag}
                    </Badge>
                  </span>
                ))}
              </div>
            ) : null}
            {item.timestamp != null && item.timestamp !== '' ? (
              <span
                data-slot="rich-list-timestamp"
                className={cn('text-fg-muted', metaTextSize[density])}
              >
                {item.timestamp}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {showTrailingColumn ? (
        <div
          data-slot="rich-list-trailing"
          className="flex shrink-0 items-center self-stretch text-fg-muted"
        >
          {trailingSlot}
          {showChevron ? (
            <span data-slot="rich-list-chevron" aria-hidden>
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 4l4 4-4 4" />
              </svg>
            </span>
          ) : null}
        </div>
      ) : null}

      <span data-slot="rich-list-row-activate" className="sr-only">
        {item.title}
      </span>
    </li>
  )
}

export { RichListRow, richListRowVariants }
export type { RichListRowProps }
