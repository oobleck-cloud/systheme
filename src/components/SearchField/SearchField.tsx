'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { cloneElement, forwardRef, isValidElement, useCallback } from 'react'

import type { ButtonGroupEndShape } from '@/components/Button/ButtonGroup'

import { Button } from '@/components/Button/Button'
import { ConnectedBox, ConnectedBoxDivider, ConnectedBoxSegment } from '@/primitives/connectedBox'
import { cn } from '@/utils/cn'

const searchFieldVariants = cva(
  [
    'flex w-full min-w-0 items-stretch rounded-md border border-border bg-background transition-colors',
    'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-background',
    'has-[[aria-invalid=true]]:border-error-border has-[[aria-invalid=true]]:ring-error-primary',
  ],
  {
    variants: {
      size: {
        sm: 'min-h-8',
        md: 'min-h-10',
        lg: 'min-h-12',
      },
      density: {
        compact: 'gap-0.5',
        default: 'gap-1',
        loose: 'gap-1.5',
      },
    },
    compoundVariants: [
      {
        size: 'sm',
        density: 'compact',
        class: '[&_[data-slot=search-leading]]:pl-2 [&_[data-slot=search-trailing]]:pr-1',
      },
      {
        size: 'sm',
        density: 'default',
        class: '[&_[data-slot=search-leading]]:pl-2.5 [&_[data-slot=search-trailing]]:pr-1.5',
      },
      {
        size: 'sm',
        density: 'loose',
        class: '[&_[data-slot=search-leading]]:pl-3 [&_[data-slot=search-trailing]]:pr-2',
      },
      {
        size: 'md',
        density: 'compact',
        class: '[&_[data-slot=search-leading]]:pl-2.5 [&_[data-slot=search-trailing]]:pr-1.5',
      },
      {
        size: 'md',
        density: 'default',
        class: '[&_[data-slot=search-leading]]:pl-3 [&_[data-slot=search-trailing]]:pr-2',
      },
      {
        size: 'md',
        density: 'loose',
        class: '[&_[data-slot=search-leading]]:pl-3.5 [&_[data-slot=search-trailing]]:pr-2.5',
      },
      {
        size: 'lg',
        density: 'compact',
        class: '[&_[data-slot=search-leading]]:pl-3 [&_[data-slot=search-trailing]]:pr-2',
      },
      {
        size: 'lg',
        density: 'default',
        class: '[&_[data-slot=search-leading]]:pl-3.5 [&_[data-slot=search-trailing]]:pr-2.5',
      },
      {
        size: 'lg',
        density: 'loose',
        class: '[&_[data-slot=search-leading]]:pl-4 [&_[data-slot=search-trailing]]:pr-3',
      },
    ],
    defaultVariants: {
      size: 'md',
      density: 'default',
    },
  },
)

const searchInputSize = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-md',
} as const

const searchInputHeight = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
} as const

const searchInputPadding = {
  sm: 'px-density-sm',
  md: 'px-density-md',
  lg: 'px-density-lg',
} as const

const searchLeadingPadding = {
  sm: 'pl-2',
  md: 'pl-2.5',
  lg: 'pl-3',
} as const

type SearchFieldSubmitLayout = 'inline' | 'connected'

type SearchFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'size' | 'onChange' | 'defaultValue'
> &
  VariantProps<typeof searchFieldVariants> & {
    leadingIcon?: React.ReactNode
    /** 커스텀 clear 슬롯. `showClear`가 true이면 내장 clear 버튼이 우선 */
    clear?: React.ReactNode
    submit?: React.ReactNode
    /** 내장 clear 버튼 표시 (value가 비어있지 않을 때) */
    showClear?: boolean
    onValueChange?: (query: string) => void
    onSearch?: (query: string) => void
    onClear?: () => void
    onSubmit?: () => void
    /** submit 버튼 레이아웃 — `inline`(구분선) 또는 `connected`(붙은 버튼) */
    submitLayout?: SearchFieldSubmitLayout
    endShape?: ButtonGroupEndShape
  }

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      className,
      size = 'md',
      density,
      leadingIcon,
      clear,
      submit,
      showClear = false,
      onValueChange,
      onSearch,
      onClear,
      onSubmit,
      submitLayout = 'inline',
      endShape = 'md',
      disabled,
      readOnly,
      type = 'search',
      value,
      onKeyDown,
      ...inputProps
    },
    ref,
  ) => {
    const resolvedSize = size ?? 'md'
    const hasLeading = leadingIcon != null && leadingIcon !== false
    const useConnectedSubmit = submitLayout === 'connected' && submit != null && submit !== false
    const query = String(value ?? '')

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange?.(e.target.value)
      },
      [onValueChange],
    )

    const handleClear = useCallback(() => {
      onValueChange?.('')
      onClear?.()
    }, [onClear, onValueChange])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key === 'Enter') {
          e.preventDefault()
          if (onSearch) {
            onSearch(query)
          } else {
            onSubmit?.()
          }
        }
      },
      [onKeyDown, onSearch, onSubmit, query],
    )

    const inputClassName = cn(
      'min-w-0 flex-1 border-0 bg-transparent py-0 text-fg ring-0 outline-none placeholder:text-fg-muted',
      'focus-visible:ring-0',
      searchInputSize[resolvedSize],
      searchInputHeight[resolvedSize],
      hasLeading ? 'pl-2' : searchInputPadding[resolvedSize],
      clear != null && clear !== false ? 'pr-1' : searchInputPadding[resolvedSize],
    )

    const builtInClear =
      showClear && query.length > 0 && !disabled && !readOnly ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="검색어 지우기"
          className="h-7 min-h-0 px-2"
          onClick={handleClear}
        >
          ✕
        </Button>
      ) : null

    const hasCustomClear = clear != null && clear !== false
    const clearSlot =
      builtInClear != null || hasCustomClear ? (
        <div data-slot="search-trailing" className="flex shrink-0 items-center gap-1 pr-2">
          <span className="flex items-center" data-slot="search-clear">
            {builtInClear ?? clear}
          </span>
        </div>
      ) : null

    const inputElement = (
      <input
        ref={ref}
        type={type}
        data-slot="search-input"
        disabled={disabled}
        readOnly={readOnly}
        value={value}
        className={inputClassName}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...inputProps}
      />
    )

    const leadingSlot = hasLeading ? (
      <div
        data-slot="search-leading"
        className={cn(
          'flex shrink-0 items-center gap-2 text-fg-muted',
          searchLeadingPadding[resolvedSize],
        )}
      >
        <span className="flex items-center" aria-hidden="true">
          {leadingIcon}
        </span>
      </div>
    ) : null

    function renderConnectedSubmit(node: React.ReactNode) {
      if (!isValidElement(node)) return node
      return cloneElement(node, {
        className: cn(
          'h-full min-h-0 shrink-0 rounded-none shadow-none focus-visible:ring-0',
          endShape === 'full' && 'rounded-e-full',
          (node.props as { className?: string }).className,
        ),
      } as { className?: string })
    }

    const connectedSubmitSlot =
      submit != null && submit !== false ? (
        <ConnectedBoxSegment flex="shrink" data-slot="search-submit">
          {renderConnectedSubmit(submit)}
        </ConnectedBoxSegment>
      ) : null

    const inlineSubmitSlot =
      submit != null && submit !== false ? (
        <div
          data-slot="search-submit"
          className="flex h-full shrink-0 items-stretch border-s border-border"
        >
          {submit}
        </div>
      ) : null

    if (useConnectedSubmit) {
      return (
        <div
          data-slot="search-root"
          data-submit-layout="connected"
          data-end-shape={endShape}
          className={cn('w-full min-w-0', disabled && 'cursor-not-allowed opacity-50', className)}
        >
          <ConnectedBox size={resolvedSize} className={cn(endShape === 'full' && 'rounded-full')}>
            <ConnectedBoxSegment flex="grow" density={density} data-slot="search-input-segment">
              {leadingSlot}
              {inputElement}
              {clearSlot}
            </ConnectedBoxSegment>
            {connectedSubmitSlot ? (
              <>
                <ConnectedBoxDivider />
                {connectedSubmitSlot}
              </>
            ) : null}
          </ConnectedBox>
        </div>
      )
    }

    return (
      <div
        className={cn(
          searchFieldVariants({ size: resolvedSize, density }),
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
        data-slot="search-root"
        data-submit-layout="inline"
      >
        <div data-slot="search-input-segment" className="flex min-w-0 flex-1 items-stretch">
          {leadingSlot}
          {inputElement}
          {clearSlot}
        </div>
        {inlineSubmitSlot}
      </div>
    )
  },
)

SearchField.displayName = 'SearchField'

export { SearchField, searchFieldVariants }
export type { SearchFieldProps, SearchFieldSubmitLayout }
