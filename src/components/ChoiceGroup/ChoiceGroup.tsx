'use client'

import { forwardRef, useState } from 'react'

import { cn } from '@/utils/cn'

/**
 * 폼에서 선택지를 고르는 묶음 — 요일·시간대·종류처럼 답이 보기 안에 있는 질문.
 *
 * - `appearance="chip"` — 짧은 보기(요일·횟수). 캡슐 토글 한 줄, 넘치면 줄바꿈.
 * - `appearance="card"` — 설명이 붙는 보기(시간대 + 시각). 카드 전체가 누르는 자리.
 *
 * 체크박스·라디오를 카드 안에 넣지 않는다 — 선택은 카드 자체의 색·테두리·체크 표시로 말한다.
 * `selectionMode="single"` 은 radiogroup, `multiple` 은 checkbox 묶음으로 읽힌다.
 */

export type ChoiceOption = {
  value: string
  label: React.ReactNode
  /** 카드에서 라벨 아래 한 줄(칩에서는 그리지 않는다) */
  description?: React.ReactNode
  disabled?: boolean
}

export type ChoiceGroupProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'children'
> & {
  options: ChoiceOption[]
  selectionMode?: 'single' | 'multiple'
  appearance?: 'chip' | 'card'
  /** 고른 값 — 고른 순서가 아니라 options 순서로 돌려준다 */
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  /** card 의 열 수(기본: 보기 수, 최대 4). chip 은 무시 */
  columns?: 1 | 2 | 3 | 4
  /** chip 이 한 줄을 고르게 나눠 채운다(요일 7개를 모바일 폭 한 줄에). card 는 무시 */
  fill?: boolean
  disabled?: boolean
}

const COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const

function CheckMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3"
      aria-hidden
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  )
}

const ChoiceGroup = forwardRef<HTMLDivElement, ChoiceGroupProps>(
  (
    {
      className,
      options,
      selectionMode = 'multiple',
      appearance = 'card',
      value: valueProp,
      defaultValue = [],
      onValueChange,
      columns,
      fill = false,
      disabled = false,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const [internal, setInternal] = useState<string[]>(defaultValue)
    const value = valueProp ?? internal
    const single = selectionMode === 'single'

    const firstSelected = options.findIndex((o) => value.includes(o.value) && !o.disabled)
    const firstEnabled = options.findIndex((o) => !o.disabled)
    const [focusIdx, setFocusIdx] = useState<number | null>(null)
    const tabStop = focusIdx ?? (firstSelected >= 0 ? firstSelected : firstEnabled)

    function commit(next: string[]) {
      const ordered = options.map((o) => o.value).filter((v) => next.includes(v))
      if (valueProp === undefined) setInternal(ordered)
      onValueChange?.(ordered)
    }

    function toggle(v: string) {
      if (single) {
        if (!value.includes(v)) commit([v])
        return
      }
      commit(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']
      if (!keys.includes(e.key)) return
      const items = Array.from(
        e.currentTarget.querySelectorAll<HTMLButtonElement>(
          '[data-slot="choice-group-item"]:not(:disabled)',
        ),
      )
      const idx = items.indexOf(document.activeElement as HTMLButtonElement)
      if (idx < 0) return
      e.preventDefault()
      const last = items.length - 1
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? last
            : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
              ? Math.max(idx - 1, 0)
              : Math.min(idx + 1, last)
      const target = items[next]
      if (!target) return
      target.focus()
      // 라디오 묶음은 화살표가 곧 선택이다(WAI-ARIA radiogroup).
      if (single && target.dataset.value) toggle(target.dataset.value)
    }

    const card = appearance === 'card'
    const cols = columns ?? (Math.min(Math.max(options.length, 1), 4) as 1 | 2 | 3 | 4)

    return (
      <div
        ref={ref}
        role={single ? 'radiogroup' : 'group'}
        data-slot="choice-group-root"
        data-appearance={appearance}
        aria-disabled={disabled || undefined}
        className={cn(
          card
            ? cn('grid gap-2', COLUMNS[cols])
            : cn('flex gap-2', fill ? 'flex-nowrap' : 'flex-wrap'),
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {options.map((option, index) => {
          const selected = value.includes(option.value)
          const isDisabled = disabled || option.disabled === true
          return (
            <button
              key={option.value}
              type="button"
              role={single ? 'radio' : 'checkbox'}
              aria-checked={selected}
              data-slot="choice-group-item"
              data-value={option.value}
              data-state={selected ? 'on' : 'off'}
              disabled={isDisabled}
              tabIndex={index === tabStop ? 0 : -1}
              onFocus={() => setFocusIdx(index)}
              onClick={() => toggle(option.value)}
              className={cn(
                'relative cursor-pointer text-left transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                card
                  ? cn(
                      'flex min-w-0 items-start gap-3 rounded-lg border p-4 pr-10',
                      // 선택 신호는 하나 — 두꺼운 primary 테두리(+ 체크 원). 바탕·글자색은 그대로 둔다.
                      selected
                        ? 'border-primary bg-background text-fg ring-1 ring-primary ring-inset'
                        : 'border-border bg-background text-fg hover:border-border-strong',
                    )
                  : cn(
                      'inline-flex min-h-[var(--ds-density-control-h-md)] min-w-12 items-center justify-center rounded-full',
                      'text-sm font-medium',
                      fill ? 'min-w-0 flex-1 basis-0 px-1' : 'px-[var(--ds-density-control-px-sm)]',
                      // 선택 신호는 하나 — 채운 primary. 고르지 않은 칩은 테두리 없는 회색 면.
                      selected
                        ? 'bg-primary text-primary-fg'
                        : 'bg-container text-fg hover:bg-container-high',
                    ),
                /*
                 * 모바일 현장(틴트 바탕) — 플래너 앱 `option-list` 문법으로 바꾼다.
                 * 고르지 않은 보기 = 흰 filled 타일(보더 없음), 고른 보기 = primary-container + 굵은 글자.
                 * 스트로크는 현장 금지 어휘라 선택 신호도 면으로 말한다(contexts.md 모바일 현장).
                 */
                'in-data-[surface=tinted]:border-transparent in-data-[surface=tinted]:ring-0',
                selected
                  ? 'in-data-[surface=tinted]:bg-primary-container in-data-[surface=tinted]:font-semibold in-data-[surface=tinted]:text-on-primary-container'
                  : 'in-data-[surface=tinted]:bg-background',
              )}
            >
              {card ? (
                <span data-slot="choice-group-content" className="flex min-w-0 flex-col gap-0.5">
                  <span data-slot="choice-group-label" className="text-sm font-medium">
                    {option.label}
                  </span>
                  {option.description != null && (
                    <span
                      data-slot="choice-group-description"
                      className={cn(
                        'text-xs text-fg-muted',
                        selected && 'in-data-[surface=tinted]:text-on-primary-container/80',
                      )}
                    >
                      {option.description}
                    </span>
                  )}
                </span>
              ) : (
                <span data-slot="choice-group-label">{option.label}</span>
              )}
              {card && selected && (
                <span
                  data-slot="choice-group-check"
                  aria-hidden
                  className="absolute top-4 right-4 flex size-5 items-center justify-center rounded-full bg-primary text-primary-fg"
                >
                  <CheckMark />
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  },
)

ChoiceGroup.displayName = 'ChoiceGroup'

export { ChoiceGroup }
