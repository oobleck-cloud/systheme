'use client'

import { type VariantProps } from 'class-variance-authority'
import { AnimatePresence } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { inputVariants } from '@/components/Input'
import { spring } from '@/foundations/motionTokens'
import { DropdownPopover } from '@/primitives/dropdownPopover'
import { useInteractionContext } from '@/primitives/interaction'
import { MotionPanel } from '@/primitives/panelMotion'
import { useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'
import {
  dropdownListShellVariants,
  dropdownOptionDensityVariants,
  dropdownSearchPaddingVariants,
} from '@/utils/dropdownDensity'

export type SelectOption = {
  value: string
  label: string
  disabled?: boolean
  /**
   * 묶음 머리글 — 같은 group 의 옵션을 모아 머리글 아래에 둔다. 묶음 순서는 처음 나온 순서,
   * 묶음 안 순서는 원래 순서다. 옵션이 수십 개라 훑기 어려울 때(속성 고르기 등) 쓴다.
   */
  group?: string
  /** 보조 글 — 검색 중에 라벨 옆에 흐리게 보인다. 같은 라벨이 여러 묶음에 있을 때 어디 것인지 가른다. */
  hint?: string
  /** 검색이 라벨 말고도 맞춰 볼 말(별칭). 화면에는 보이지 않는다. */
  keywords?: string[]
}

/** 같은 group 끼리 모은다 — 묶음은 처음 나온 순서, 묶음 안은 원래 순서. group 이 하나도 없으면 그대로. */
function groupOptions(options: SelectOption[]): SelectOption[] {
  if (!options.some((o) => o.group)) return options
  const order: string[] = []
  const byGroup = new Map<string, SelectOption[]>()
  for (const o of options) {
    const g = o.group ?? ''
    const list = byGroup.get(g)
    if (list) list.push(o)
    else {
      byGroup.set(g, [o])
      order.push(g)
    }
  }
  return order.flatMap((g) => byGroup.get(g) ?? [])
}

function matchesSearch(option: SelectOption, query: string): boolean {
  const q = query.toLowerCase()
  return [option.label, option.hint, ...(option.keywords ?? [])].some(
    (s) => s != null && s.toLowerCase().includes(q),
  )
}

type SelectProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'size'> &
  Pick<VariantProps<typeof dropdownListShellVariants>, 'density'> & {
    options: SelectOption[]
    value?: string
    onChange?: (value: string) => void
    onOpenChange?: (open: boolean) => void
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
  }

function Select({
  className,
  variant,
  size = 'md',
  options,
  value: controlledValue,
  onChange,
  onOpenChange,
  placeholder = '선택...',
  disabled = false,
  searchable = false,
  density,
  // 접근 가능한 이름은 바깥 래퍼가 아니라 **트리거**에 붙어야 한다. 화면에 같은 모양의
  // 선택 상자가 여럿일 때(사이드별 대행·사람별 프로세스) 래퍼에 붙은 이름은 보조기술에 닿지 않는다.
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: SelectProps) {
  const den = density ?? 'default'
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalValue, setInternalValue] = useState<string | undefined>(undefined)
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  const selectedOption = options.find((o) => o.value === value)
  const searching = searchable && search !== ''
  const ordered = groupOptions(options)
  const filteredOptions = searching ? ordered.filter((o) => matchesSearch(o, search)) : ordered

  // Refs for stable access inside onIntent callback
  const filteredOptionsRef = useRef(filteredOptions)
  filteredOptionsRef.current = filteredOptions
  // Declare focusedIndexRef before useInteractionContext so it's available in onIntent
  const focusedIndexRef = useRef(0)

  const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
    kind: 'list',
    itemCount: filteredOptions.length,
    onIntent: (intent) => {
      const opts = filteredOptionsRef.current
      const currentIdx = focusedIndexRef.current
      switch (intent.type) {
        case 'nav.next':
          setFocusedIndex(Math.min(currentIdx + 1, opts.length - 1))
          return true
        case 'nav.prev':
          setFocusedIndex(Math.max(currentIdx - 1, 0))
          return true
        case 'nav.first':
          setFocusedIndex(0)
          return true
        case 'nav.last':
          setFocusedIndex(opts.length - 1)
          return true
        case 'cancel':
          handleOpenChange(false)
          return true
        case 'activate': {
          const opt = opts[currentIdx]
          if (opt && !opt.disabled) pick(opt.value)
          return true
        }
        default:
          return false
      }
    },
  })

  // Keep focusedIndexRef in sync with the hook's state
  focusedIndexRef.current = focusedIndex

  // Focus the currently selected option when opening
  useEffect(() => {
    if (!isOpen) return
    const idx = filteredOptions.findIndex((o) => o.value === value)
    setFocusedIndex(idx >= 0 ? idx : 0)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOpenChange(next: boolean) {
    setIsOpen(next)
    onOpenChange?.(next)
    if (!next) setSearch('')
  }

  function pick(optValue: string) {
    if (!isControlled) setInternalValue(optValue)
    onChange?.(optValue)
    setIsOpen(false)
    setSearch('')
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent) {
    if (disabled) return
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (!isOpen) setIsOpen(true)
        break
      case 'Escape':
        handleOpenChange(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) setIsOpen(true)
        break
    }
  }

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open: isOpen,
    anchorRef: rootRef,
    panelRef,
    placement: 'below',
    matchWidth: true,
    onPointerDownOutside: () => handleOpenChange(false),
  })

  return (
    <DropdownPopover
      ref={rootRef}
      open={isOpen}
      onOpenChange={handleOpenChange}
      className={className}
      // Disable built-in Escape handling — our hook handles it via onIntent → cancel
      dismissOnEscape={false}
      // Panel is portaled to document.body; dismiss is handled by useAnchoredPanel (two-ref aware)
      dismissOnPointerDownOutside={false}
      {...props}
    >
      <button
        type="button"
        disabled={disabled}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={() => handleOpenChange(!isOpen)}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          inputVariants({ variant, size }),
          'flex cursor-pointer items-center justify-between gap-2 text-left',
          !selectedOption && 'text-fg-muted',
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span
          aria-hidden="true"
          className={cn(
            'flex shrink-0 items-center text-fg-muted transition-transform',
            isOpen && 'rotate-180',
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
          <AnimatePresence>
            {isOpen && (
              <MotionPanel
                ref={panelRef}
                id={listboxId}
                aria-label="옵션 목록"
                position="fixed"
                offset="none"
                className={cn('origin-top', positionClassName)}
                style={panelStyle}
                initial={{ opacity: 0, scaleY: 0.9, y: -4 }}
                animate={{ opacity: 1, scaleY: 1, y: 0, transition: spring.standard }}
                exit={{ opacity: 0, scaleY: 0.9, y: -4, transition: spring.standard }}
              >
                {searchable && (
                  <div className={dropdownSearchPaddingVariants({ density: den })}>
                    <input
                      // eslint-disable-next-line jsx-a11y/no-autofocus -- dropdown search: user initiated open, immediate focus is expected UX
                      autoFocus
                      type="text"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setFocusedIndex(0)
                      }}
                      onKeyDown={(e) => {
                        // Search input is a sibling of the listbox, so Escape never reaches the
                        // listbox onKeyDown — handle it here so the panel closes while searching.
                        if (e.key === 'Escape') {
                          e.preventDefault()
                          handleOpenChange(false)
                        }
                      }}
                      placeholder="검색..."
                      aria-label="옵션 검색"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-fg-muted"
                    />
                  </div>
                )}
                {/* contextProps provides role="listbox", aria-orientation, and onKeyDown */}
                <ul
                  data-slot="panel-scroll-region"
                  aria-label="옵션 목록"
                  className={dropdownListShellVariants({ density: den })}
                  {...contextProps}
                >
                  {filteredOptions.length === 0 ? (
                    <li
                      role="option"
                      aria-selected="false"
                      className={cn(
                        dropdownOptionDensityVariants({ density: den }),
                        'text-fg-muted',
                      )}
                    >
                      옵션 없음
                    </li>
                  ) : (
                    filteredOptions.map((opt, i) => {
                      const isSelected = opt.value === value
                      const itemProps = getItemProps(i)
                      // 묶음 머리글 — 묶음이 바뀌는 자리에만. 검색 중에는 hint 가 위치를 말하므로 빼고 목록을 촘촘히 둔다.
                      const header =
                        !searching && opt.group && opt.group !== filteredOptions[i - 1]?.group ? (
                          <li
                            key={`group:${opt.group}`}
                            role="presentation"
                            data-slot="group-header"
                            className="mx-1 px-3 pt-2.5 pb-1 text-xs font-medium text-fg-muted select-none first:pt-1"
                          >
                            {opt.group}
                          </li>
                        ) : null
                      return [
                        header,
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- keyboard navigation handled by listbox container via contextProps.onKeyDown (Enter/Space → activate intent bubbles up)
                        <li
                          key={opt.value}
                          role="option"
                          aria-selected={isSelected}
                          aria-disabled={opt.disabled}
                          tabIndex={opt.disabled ? -1 : itemProps.tabIndex}
                          onClick={() => !opt.disabled && pick(opt.value)}
                          onFocus={itemProps.onFocus}
                          className={cn(
                            'flex cursor-pointer items-center justify-between transition-colors outline-none select-none',
                            dropdownOptionDensityVariants({ density: den }),
                            'hover:bg-surface focus-visible:bg-surface',
                            focusedIndex === i && 'bg-surface',
                            isSelected && 'font-medium text-primary',
                            opt.disabled && 'cursor-not-allowed opacity-50',
                          )}
                        >
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="truncate">{opt.label}</span>
                            {searching && opt.hint ? (
                              <span className="truncate text-xs text-fg-muted">{opt.hint}</span>
                            ) : null}
                          </span>
                          {isSelected && (
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-primary"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 8l3.5 3.5 6.5-7" />
                            </svg>
                          )}
                        </li>,
                      ]
                    })
                  )}
                </ul>
              </MotionPanel>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </DropdownPopover>
  )
}

export { Select }
export type { SelectProps }
