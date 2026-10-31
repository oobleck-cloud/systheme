'use client'

import { useCallback, useId, useMemo, useRef, useState } from 'react'

import { SearchField, type SearchFieldProps } from '@/components/SearchField/SearchField'
import { AnchorContextSurface } from '@/primitives/anchorContextSurface'
import { useInteractionContext } from '@/primitives/interaction'
import { cn } from '@/utils/cn'
import { dropdownListShellVariants, dropdownOptionDensityVariants } from '@/utils/dropdownDensity'

export type SearchFieldAutocompleteOption = {
  id: string
  label: string
  description?: string
}

export type SearchFieldAutocompleteProps = Omit<
  SearchFieldProps,
  'role' | 'aria-expanded' | 'onKeyDown' | 'onFocus' | 'onBlur'
> & {
  options: SearchFieldAutocompleteOption[]
  onOptionSelect?: (option: SearchFieldAutocompleteOption) => void
  onQueryChange?: (query: string) => void
  /** Uncontrolled 초기 검색어 */
  defaultValue?: string
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 제안 목록 aria-label */
  listLabel?: string
  /** 입력 길이가 이 값 이상일 때 제안 패널을 열 수 있음 */
  minQueryLength?: number
  listDensity?: 'compact' | 'default' | 'loose'
  isLoading?: boolean
}

function SearchFieldAutocomplete({
  options,
  onOptionSelect,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  listLabel = '검색 제안',
  minQueryLength = 2,
  listDensity = 'default',
  isLoading = false,
  value: valueProp,
  defaultValue = '',
  onValueChange,
  onQueryChange,
  disabled,
  ...searchFieldProps
}: SearchFieldAutocompleteProps) {
  const listboxId = useId()
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlledOpen = openProp !== undefined
  const open = isControlledOpen ? openProp! : uncontrolledOpen

  const isControlledValue = valueProp !== undefined
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = isControlledValue ? valueProp! : internalValue
  const query = String(value ?? '')
  const canSuggest =
    query.trim().length >= minQueryLength && (options.length > 0 || isLoading) && !disabled

  // Refs for stable access inside callbacks
  const optionsRef = useRef(options)
  optionsRef.current = options
  const focusedIndexRef = useRef(0)

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlledOpen) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlledOpen, onOpenChange],
  )

  const suggestionsOpen = open && canSuggest

  const pickOption = useCallback(
    (option: SearchFieldAutocompleteOption) => {
      onOptionSelect?.(option)
      setOpen(false)
    },
    [onOptionSelect, setOpen],
  )

  const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
    kind: 'list',
    itemCount: options.length,
    onIntent: (intent) => {
      const opts = optionsRef.current
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
          setOpen(false)
          return true
        case 'activate': {
          const opt = opts[currentIdx]
          if (opt) pickOption(opt)
          return true
        }
        default:
          return false
      }
    },
  })

  // Keep focusedIndexRef in sync with hook state
  focusedIndexRef.current = focusedIndex

  // The input (combobox) forwards arrow/enter/escape to the list context
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.defaultPrevented) return

      if (e.key === 'ArrowDown' && canSuggest) {
        e.preventDefault()
        if (!open) setOpen(true)
        setFocusedIndex(Math.min(focusedIndexRef.current + 1, optionsRef.current.length - 1))
        return
      }
      if (e.key === 'ArrowUp' && canSuggest) {
        e.preventDefault()
        if (!open) setOpen(true)
        setFocusedIndex(Math.max(focusedIndexRef.current - 1, 0))
        return
      }
      if (e.key === 'Escape' && suggestionsOpen) {
        e.preventDefault()
        setOpen(false)
        return
      }
      if (e.key === 'Enter' && suggestionsOpen && options[focusedIndex]) {
        e.preventDefault()
        pickOption(options[focusedIndex]!)
        return
      }
    },
    [
      canSuggest,
      open,
      options,
      focusedIndex,
      suggestionsOpen,
      pickOption,
      setOpen,
      setFocusedIndex,
    ],
  )

  const handleFocus = useCallback(() => {
    if (canSuggest) setOpen(true)
  }, [canSuggest, setOpen])

  const handleBlur = useCallback(() => {
    requestAnimationFrame(() => setOpen(false))
  }, [setOpen])

  const handleChange = useCallback(
    (nextQuery: string) => {
      if (!isControlledValue) setInternalValue(nextQuery)
      onValueChange?.(nextQuery)
      onQueryChange?.(nextQuery)
      setFocusedIndex(0) // reset highlight on query change
      if (nextQuery.trim().length >= minQueryLength) {
        setOpen(true)
      } else {
        setOpen(false)
      }
    },
    [isControlledValue, onValueChange, onQueryChange, minQueryLength, setOpen],
  )

  const listShellClass = useMemo(
    () => dropdownListShellVariants({ density: listDensity }),
    [listDensity],
  )

  const optionClass = useMemo(
    () => dropdownOptionDensityVariants({ density: listDensity }),
    [listDensity],
  )

  return (
    <div data-slot="search-autocomplete-root" className="relative w-full min-w-0">
      <AnchorContextSurface
        open={suggestionsOpen}
        onOpenChange={(next) => {
          if (!canSuggest && next) return
          setOpen(next)
        }}
        portaled
        dismissOnPointerDownOutside
        dismissOnEscape
        panelVariant="list"
        panelMatchSurfaceWidth
        panelScrollHint={false}
        panelRole="region"
        panelClassName="max-h-60 overflow-hidden p-0"
        panel={
          <div
            data-slot="search-autocomplete-suggestions"
            className="max-h-60 w-full overflow-y-auto"
          >
            {isLoading && options.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-fg-muted">검색 중…</div>
            ) : (
              /* contextProps provides role="listbox", aria-orientation, onKeyDown */
              <ul
                id={listboxId}
                aria-label={listLabel}
                data-slot="search-autocomplete-listbox"
                {...contextProps}
                className={cn(listShellClass, 'max-h-none py-0')}
              >
                {options.map((option, index) => {
                  const itemProps = getItemProps(index)
                  return (
                    <li
                      key={option.id}
                      role="presentation"
                      data-slot="search-autocomplete-option"
                      className="flex"
                    >
                      <button
                        type="button"
                        role="option"
                        id={`${listboxId}-option-${option.id}`}
                        aria-selected={focusedIndex === index}
                        tabIndex={itemProps.tabIndex}
                        onFocus={itemProps.onFocus}
                        className={cn(
                          'flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 text-left transition-colors outline-none select-none',
                          optionClass,
                          'hover:bg-surface focus-visible:bg-surface',
                          focusedIndex === index && 'bg-surface',
                        )}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickOption(option)}
                      >
                        <span className="truncate font-medium">{option.label}</span>
                        {option.description ? (
                          <span className="truncate text-fg-muted">{option.description}</span>
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        }
        surface={
          <SearchField
            {...searchFieldProps}
            disabled={disabled}
            value={value}
            onValueChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            role="combobox"
            aria-expanded={suggestionsOpen}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              suggestionsOpen && options[focusedIndex]
                ? `${listboxId}-option-${options[focusedIndex]!.id}`
                : undefined
            }
          />
        }
      />
    </div>
  )
}

SearchFieldAutocomplete.displayName = 'SearchFieldAutocomplete'

export { SearchFieldAutocomplete }
