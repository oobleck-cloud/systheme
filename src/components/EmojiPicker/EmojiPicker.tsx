'use client'

import { type VariantProps } from 'class-variance-authority'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
  DEFAULT_EMOJI_CATEGORIES,
  type EmojiPickerCategory,
  type EmojiPickerItem,
} from './emojiPickerData'

import { inputVariants } from '@/components/Input'
import { anchorPopoverRootClassName, useFocusTrap } from '@/primitives/anchorPopover'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
import { useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'

export type EmojiPickerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'size'> & {
    /** Grouped emoji list; defaults to built-in curated set */
    categories?: EmojiPickerCategory[]
    /** Controlled: 현재 선택된 이모지. 미제공 시 defaultValue로 내부 관리됩니다. */
    value?: string
    /** Uncontrolled 초기 선택 이모지 (기본값: undefined — 미선택) */
    defaultValue?: string
    onChange?: (emoji: string) => void
    onOpenChange?: (open: boolean) => void
    placeholder?: string
    disabled?: boolean
    /** Show search field above the grid */
    searchable?: boolean
  }

function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
}

function itemMatchesQuery(item: EmojiPickerItem, q: string) {
  if (!q) return true
  return item.keywords.some((k) => k.includes(q)) || item.char.includes(q)
}

function EmojiPicker({
  className,
  variant,
  size = 'md',
  categories = DEFAULT_EMOJI_CATEGORIES,
  value: valueProp,
  defaultValue,
  onChange,
  onOpenChange,
  placeholder = '이모지 선택…',
  disabled = false,
  searchable = true,
  ...props
}: EmojiPickerProps) {
  const portalRoot = usePortalRoot()
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)
  const value = isControlled ? valueProp : internalValue
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(() => categories[0]?.id ?? '')
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  // Roving tabindex for the emoji grid: a single emoji is the tab stop.
  const [focusedEmojiIdx, setFocusedEmojiIdx] = useState(0)

  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (categories.length && !categories.some((c) => c.id === activeCategory)) {
      setActiveCategory(categories[0].id)
    }
  }, [categories, activeCategory])

  const q = normalizeQuery(query)

  const visibleEmojis = useMemo(() => {
    const list: EmojiPickerItem[] = []
    if (q) {
      for (const cat of categories) {
        for (const em of cat.emojis) {
          if (itemMatchesQuery(em, q)) list.push(em)
        }
      }
      return list
    }
    const cat = categories.find((c) => c.id === activeCategory)
    return cat?.emojis ?? []
  }, [categories, activeCategory, q])

  const filterEmpty = open && visibleEmojis.length === 0

  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open,
    anchorRef: containerRef,
    panelRef,
    placement: 'below',
    onPointerDownOutside: () => {
      setOpen(false)
      setQuery('')
    },
  })

  function pick(emoji: string) {
    if (!isControlled) setInternalValue(emoji)
    onChange?.(emoji)
    setOpen(false)
    setQuery('')
  }

  function toggleOpen() {
    if (disabled) return
    setOpen((v) => !v)
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setOpen((v) => !v)
        break
      case 'Escape':
        setOpen(false)
        setQuery('')
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!open) setOpen(true)
        break
    }
  }

  function handlePanelKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
      setQuery('')
    }
  }

  function handleCategoryKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
    const current = document.activeElement as HTMLButtonElement
    const idx = tabs.indexOf(current)
    if (idx < 0) return
    let next = idx
    if (e.key === 'ArrowRight') next = Math.min(idx + 1, tabs.length - 1)
    else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    else return
    e.preventDefault()
    tabs[next]?.focus()
    const catId = categories[next]?.id
    if (catId) setActiveCategory(catId)
  }

  function handleGridKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button'))
    const current = document.activeElement as HTMLButtonElement
    const idx = btns.indexOf(current)
    if (idx < 0) return
    let next = idx
    if (e.key === 'ArrowRight') next = Math.min(idx + 1, btns.length - 1)
    else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0)
    else if (e.key === 'ArrowDown') next = Math.min(idx + 8, btns.length - 1)
    else if (e.key === 'ArrowUp') next = Math.max(idx - 8, 0)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = btns.length - 1
    else return
    e.preventDefault()
    setFocusedEmojiIdx(next)
    btns[next]?.focus()
  }

  return (
    <div ref={containerRef} className={cn(anchorPopoverRootClassName, className)} {...props}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          inputVariants({ variant, size }),
          'font-emoji flex min-h-10 cursor-pointer items-center justify-between gap-2 text-left',
        )}
      >
        <span
          className={cn('truncate text-xl leading-none', !value && 'text-base text-fg-muted')}
          aria-hidden={!value}
        >
          {value ?? placeholder}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center text-fg-muted transition-transform',
            open && 'rotate-180',
          )}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </span>
      </button>

      {mounted &&
        createPortal(
          open ? (
            <Panel
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Emoji picker"
              onKeyDown={handlePanelKeyDown}
              position="fixed"
              offset="none"
              className={cn('font-emoji w-[min(100%,20rem)] p-2', positionClassName)}
              style={panelStyle}
            >
              {searchable && (
                <div className="mb-2 px-0.5">
                  <input
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- emoji search: user initiated panel open, immediate focus is expected UX
                    autoFocus
                    type="search"
                    enterKeyHint="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search keywords…"
                    aria-label="Search emojis"
                    className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm ring-ring outline-none placeholder:text-fg-muted focus-visible:ring-2"
                  />
                </div>
              )}

              {!q && (
                <div
                  className="mb-2 flex max-w-full gap-1 overflow-x-auto pb-1"
                  role="tablist"
                  tabIndex={-1}
                  aria-label="Emoji categories"
                  onKeyDown={handleCategoryKeyDown}
                >
                  {categories.map((cat) => {
                    const active = cat.id === activeCategory
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => setActiveCategory(cat.id)}
                        className={cn(
                          'shrink-0 rounded-md px-2 py-1 text-xs font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-fg'
                            : 'bg-surface text-fg-muted hover:text-fg',
                        )}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {filterEmpty ? (
                <p className="px-1 py-6 text-center text-sm text-fg-muted" role="status">
                  No emojis match your search.
                </p>
              ) : (
                <ul
                  data-slot="panel-scroll-region"
                  role="listbox"
                  aria-label="Emoji grid"
                  onKeyDown={handleGridKeyDown}
                  className="grid max-h-56 grid-cols-8 gap-0.5 overflow-y-auto p-0.5"
                >
                  {visibleEmojis.map((item, i) => {
                    const tabStopIdx = Math.min(focusedEmojiIdx, visibleEmojis.length - 1)
                    return (
                      <li key={`${item.char}-${i}`} className="aspect-square">
                        <button
                          type="button"
                          role="option"
                          aria-selected={value === item.char}
                          tabIndex={i === tabStopIdx ? 0 : -1}
                          title={item.keywords.slice(0, 3).join(', ')}
                          onFocus={() => setFocusedEmojiIdx(i)}
                          onClick={() => pick(item.char)}
                          className="flex h-full w-full items-center justify-center rounded-md text-xl leading-none transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="pointer-events-none">{item.char}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </Panel>
          ) : null,
          portalRoot,
        )}
    </div>
  )
}

export { EmojiPicker }
