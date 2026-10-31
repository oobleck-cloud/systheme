'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/utils/cn'

export type ScrollWheelOption<T extends string | number> = {
  value: T
  label: string
}

const wheelListVariants = cva(
  'relative z-0 overflow-y-auto scroll-smooth snap-y snap-mandatory overscroll-y-contain',
  {
    variants: {
      density: {
        compact: 'h-40',
        default: 'h-52',
        loose: 'h-64',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const wheelItemVariants = cva(
  'flex min-h-10 shrink-0 cursor-pointer snap-center items-center justify-center transition-[color,opacity] select-none',
  {
    variants: {
      density: {
        compact: 'px-3 text-xs',
        default: 'px-5 text-sm',
        loose: 'px-6 text-base',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const WHEEL_INSET_BY_DENSITY = {
  compact: '4rem',
  default: '5.25rem',
  loose: '6.5rem',
} as const

function findCenteredValue<T extends string | number>(container: HTMLElement): T | null {
  const centerY = container.scrollTop + container.clientHeight / 2
  const items = container.querySelectorAll<HTMLElement>('[data-wheel-item]')
  let bestEl: HTMLElement | undefined
  let bestDist = Infinity

  items.forEach((el) => {
    const mid = el.offsetTop + el.offsetHeight / 2
    const dist = Math.abs(mid - centerY)
    if (dist < bestDist) {
      bestDist = dist
      bestEl = el
    }
  })

  if (!bestEl) return null
  const raw = bestEl.getAttribute('data-value')
  if (raw == null) return null
  const num = Number(raw)
  return (Number.isNaN(num) ? raw : num) as T
}

type ScrollWheelColumnProps<T extends string | number> = {
  options: ScrollWheelOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  density?: VariantProps<typeof wheelListVariants>['density']
  className?: string
  /** 열 식별 — data-slot 접미사 */
  columnId: string
  /** `data-slot` 접두사 (기본 birth-date-scroll-picker) */
  slotPrefix?: string
}

function ScrollWheelColumn<T extends string | number>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  density = 'default',
  className,
  columnId,
  slotPrefix = 'birth-date-scroll-picker',
}: ScrollWheelColumnProps<T>) {
  const den = density ?? 'default'
  const listRef = useRef<HTMLUListElement>(null)
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressScrollRef = useRef(false)

  const scrollToValue = useCallback((next: T, behavior: ScrollBehavior = 'instant') => {
    const container = listRef.current
    if (!container) return
    const target = container.querySelector<HTMLElement>(
      `[data-wheel-item][data-value="${String(next)}"]`,
    )
    target?.scrollIntoView({ block: 'center', behavior })
  }, [])

  useEffect(() => {
    scrollToValue(value, 'instant')
  }, [value, scrollToValue])

  const commitCentered = useCallback(() => {
    const container = listRef.current
    if (!container || suppressScrollRef.current) return
    const centered = findCenteredValue<T>(container)
    if (centered != null && centered !== value) {
      onChange(centered)
    } else if (centered != null) {
      scrollToValue(centered, 'smooth')
    }
  }, [onChange, scrollToValue, value])

  const handleScroll = useCallback(() => {
    if (scrollEndTimerRef.current) clearTimeout(scrollEndTimerRef.current)
    scrollEndTimerRef.current = setTimeout(commitCentered, 80)
  }, [commitCentered])

  function pick(next: T) {
    suppressScrollRef.current = true
    onChange(next)
    scrollToValue(next, 'smooth')
    requestAnimationFrame(() => {
      suppressScrollRef.current = false
    })
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return
    const currentIdx = options.findIndex((opt) => opt.value === value)
    if (currentIdx < 0) return
    e.preventDefault()
    let nextIdx = currentIdx
    if (key === 'ArrowDown') nextIdx = Math.min(currentIdx + 1, options.length - 1)
    else if (key === 'ArrowUp') nextIdx = Math.max(currentIdx - 1, 0)
    else if (key === 'Home') nextIdx = 0
    else if (key === 'End') nextIdx = options.length - 1
    const nextOpt = options[nextIdx]
    if (nextOpt) pick(nextOpt.value)
  }

  const inset = WHEEL_INSET_BY_DENSITY[den]

  return (
    <div
      className={cn('relative flex min-w-0 flex-1 flex-col', className)}
      data-slot={`${slotPrefix}-${columnId}-column`}
    >
      <ul
        ref={listRef}
        data-slot="panel-scroll-region"
        role="listbox"
        aria-label={ariaLabel}
        className={wheelListVariants({ density: den })}
        style={{ '--ds-wheel-inset': inset }}
        onScroll={handleScroll}
        onKeyDown={handleListKeyDown}
      >
        <li aria-hidden className="min-h-[var(--ds-wheel-inset)] shrink-0 snap-none" />
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <li
              key={String(opt.value)}
              role="option"
              tabIndex={selected ? 0 : -1}
              aria-selected={selected}
              data-wheel-item
              data-value={String(opt.value)}
              onClick={() => pick(opt.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  pick(opt.value)
                }
              }}
              className={cn(
                wheelItemVariants({ density: den }),
                selected ? 'font-semibold text-primary' : 'text-fg-muted',
              )}
            >
              {opt.label}
            </li>
          )
        })}
        <li aria-hidden className="min-h-[var(--ds-wheel-inset)] shrink-0 snap-none" />
      </ul>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-center"
      >
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-background to-transparent" />
        <div className="h-10 border-y border-border bg-surface/40" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background to-transparent" />
      </div>
    </div>
  )
}

export { ScrollWheelColumn, wheelListVariants }
