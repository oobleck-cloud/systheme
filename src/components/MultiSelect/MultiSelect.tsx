'use client'

import { type VariantProps } from 'class-variance-authority'
import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { inputVariants } from '@/components/Input'
import { Tag } from '@/components/Tag'
import { DropdownPopover } from '@/primitives/dropdownPopover'
import { useInteractionContext } from '@/primitives/interaction'
import { Panel } from '@/primitives/panel'
import { useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'
import {
  dropdownListShellVariants,
  dropdownOptionDensityVariants,
  dropdownSearchPaddingVariants,
} from '@/utils/dropdownDensity'

export type MultiSelectOption = {
  value: string
  label: string
  disabled?: boolean
}

type MultiSelectProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'size'> &
  Pick<VariantProps<typeof dropdownListShellVariants>, 'density'> & {
    options: MultiSelectOption[]
    value?: string[]
    onChange?: (value: string[]) => void
    onOpenChange?: (open: boolean) => void
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
  }

function MultiSelect({
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
  // 선택 상자가 여럿일 때(담당자·프로세스) 래퍼에 붙은 이름은 보조기술에 닿지 않는다.
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: MultiSelectProps) {
  const den = density ?? 'default'
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [internalValue, setInternalValue] = useState<string[]>([])

  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue! : internalValue

  const filteredOptions =
    searchable && search
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
      : options

  // Refs for stable access inside onIntent callback
  const filteredOptionsRef = useRef(filteredOptions)
  filteredOptionsRef.current = filteredOptions
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
        default:
          return false
      }
    },
  })

  // Keep focusedIndexRef in sync with hook state
  focusedIndexRef.current = focusedIndex

  function handleOpenChange(next: boolean) {
    setIsOpen(next)
    onOpenChange?.(next)
    if (!next) {
      setSearch('')
      setFocusedIndex(0)
    }
  }

  function toggleOption(optValue: string) {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue]
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function handleTriggerClick() {
    if (disabled) return
    handleOpenChange(!isOpen)
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleOpenChange(!isOpen)
        break
      case 'Escape':
        handleOpenChange(false)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          handleOpenChange(true)
        } else {
          setFocusedIndex(
            Math.min(focusedIndexRef.current + 1, filteredOptionsRef.current.length - 1),
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(Math.max(focusedIndexRef.current - 1, 0))
        break
    }
  }

  const minHClass =
    size === 'sm' ? 'min-h-8 py-1' : size === 'lg' ? 'min-h-12 py-2.5' : 'min-h-10 py-2'

  const tagSize = size === 'lg' ? 'md' : 'sm'

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
      dismissOnEscape={false}
      // Panel is portaled to document.body; dismiss is handled by useAnchoredPanel (two-ref aware)
      dismissOnPointerDownOutside={false}
      {...props}
    >
      {/* Trigger */}
      <div
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          inputVariants({ variant, size }),
          'flex h-auto cursor-pointer flex-wrap items-center gap-1.5',
          minHClass,
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {value.length > 0 ? (
          options
            .filter((opt) => value.includes(opt.value))
            .map((opt) => (
              <Tag
                key={opt.value}
                size={tagSize}
                onRemove={() => {
                  const next = value.filter((v) => v !== opt.value)
                  if (!isControlled) setInternalValue(next)
                  onChange?.(next)
                }}
              >
                {opt.label}
              </Tag>
            ))
        ) : (
          <span className="text-fg-muted">{placeholder}</span>
        )}

        <span
          className={cn(
            'ml-auto flex shrink-0 items-center text-fg-muted transition-transform',
            isOpen && 'rotate-180',
          )}
          aria-hidden="true"
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
      </div>

      {/* Dropdown — portaled to document.body so overflow ancestors don't clip it */}
      {mounted &&
        createPortal(
          isOpen ? (
            <Panel
              ref={panelRef}
              position="fixed"
              offset="none"
              className={positionClassName}
              style={panelStyle}
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
                    aria-label="옵션 검색"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-fg-muted"
                    placeholder="검색..."
                  />
                </div>
              )}

              {/* contextProps provides role="listbox", aria-orientation, onKeyDown (nav + cancel) */}
              <ul
                data-slot="panel-scroll-region"
                id={listboxId}
                role="listbox"
                aria-label="옵션 목록"
                aria-multiselectable="true"
                {...contextProps}
                className={dropdownListShellVariants({ density: den })}
              >
                {filteredOptions.length === 0 ? (
                  <li
                    role="option"
                    aria-selected="false"
                    className={cn(dropdownOptionDensityVariants({ density: den }), 'text-fg-muted')}
                  >
                    옵션 없음
                  </li>
                ) : (
                  filteredOptions.map((opt, i) => {
                    const isSelected = value.includes(opt.value)
                    const itemProps = getItemProps(i)
                    return (
                      <li
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        tabIndex={opt.disabled ? -1 : itemProps.tabIndex}
                        onClick={() => {
                          if (!opt.disabled) {
                            setFocusedIndex(i)
                            toggleOption(opt.value)
                          }
                        }}
                        onFocus={itemProps.onFocus}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            // stopPropagation so the ul's contextProps.onKeyDown doesn't double-fire
                            e.stopPropagation()
                            if (!opt.disabled) toggleOption(opt.value)
                          }
                          // Escape bubbles to ul's contextProps → cancel intent → close
                        }}
                        className={cn(
                          'flex cursor-pointer items-center gap-2.5 transition-colors outline-none select-none',
                          dropdownOptionDensityVariants({ density: den }),
                          'hover:bg-surface focus-visible:bg-surface',
                          focusedIndex === i && 'bg-surface',
                          opt.disabled && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        {/* Checkbox visual */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                            isSelected
                              ? 'border-primary bg-primary text-primary-fg'
                              : 'border-border bg-background',
                          )}
                        >
                          {isSelected && (
                            <svg
                              className="h-2.5 w-2.5"
                              viewBox="0 0 10 10"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                            </svg>
                          )}
                        </span>
                        {opt.label}
                      </li>
                    )
                  })
                )}
              </ul>
            </Panel>
          ) : null,
          document.body,
        )}
    </DropdownPopover>
  )
}

export { MultiSelect }
export type { MultiSelectProps }
