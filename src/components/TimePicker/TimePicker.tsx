'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { inputVariants } from '@/components/Input'
import {
  ANCHOR_PANEL_FALLBACK_SIZE_PX,
  computeAnchorPanelPosition,
} from '@/primitives/anchorPanelPosition'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
import { cn } from '@/utils/cn'

const timePickerColumnHeaderVariants = cva(
  'border-b border-border text-center font-medium text-fg-muted',
  {
    variants: {
      density: {
        compact: 'px-3 py-1 text-[0.625rem]',
        default: 'px-5 py-1.5 text-xs',
        loose: 'px-6 py-2 text-sm',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

const timePickerListVariants = cva('overflow-y-auto scroll-smooth', {
  variants: {
    density: {
      compact: 'h-40 py-0.5',
      default: 'h-52 py-1',
      loose: 'h-64 py-1.5',
    },
  },
  defaultVariants: { density: 'default' },
})

const timePickerOptionVariants = cva(
  'cursor-pointer text-center transition-colors select-none hover:bg-surface',
  {
    variants: {
      density: {
        compact: 'px-3 py-1 text-xs',
        default: 'px-5 py-1.5 text-sm',
        loose: 'px-6 py-2 text-base',
      },
    },
    defaultVariants: { density: 'default' },
  },
)

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function parseTime(v: string): { h: number; m: number } | null {
  const match = v.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return { h: parseInt(match[1]), m: parseInt(match[2]) }
}

function formatDisplay(h: number, m: number, use12Hour: boolean): string {
  if (use12Hour) {
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${pad(h12)}:${pad(m)} ${period}`
  }
  return `${pad(h)}:${pad(m)}`
}

type TimePickerProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> &
  Pick<VariantProps<typeof inputVariants>, 'variant' | 'size'> &
  Pick<VariantProps<typeof timePickerListVariants>, 'density'> & {
    /** Controlled: 현재 시간 "HH:mm" 24시간 형식. 미제공 시 defaultValue로 내부 관리됩니다. */
    value?: string
    /** Uncontrolled 초기 시간 "HH:mm" (기본값: undefined — 미선택) */
    defaultValue?: string
    onChange?: (time: string) => void
    placeholder?: string
    disabled?: boolean
    step?: number // minute step (default 15)
    use12Hour?: boolean
  }

function TimePicker({
  className,
  variant,
  size = 'md',
  value: valueProp,
  defaultValue,
  onChange,
  placeholder = '시간 선택',
  disabled = false,
  step = 15,
  use12Hour = false,
  density,
  ...props
}: TimePickerProps) {
  const portalRoot = usePortalRoot()
  const isControlled = valueProp !== undefined
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)
  const value = useMemo(
    () => (isControlled ? valueProp : internalValue),
    [isControlled, valueProp, internalValue],
  )
  const den = density ?? 'default'
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hourListRef = useRef<HTMLUListElement>(null)
  const minuteListRef = useRef<HTMLUListElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const popoverId = useId()

  const parsed = value ? parseTime(value) : null
  const selH = parsed?.h ?? null
  const selM = parsed?.m ?? null

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step)

  // Scroll selected items into view when popover opens
  useEffect(() => {
    if (!isOpen) return
    const id = setTimeout(() => {
      hourListRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'center', behavior: 'instant' })
      minuteListRef.current
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'center', behavior: 'instant' })
    }, 0)
    return () => clearTimeout(id)
  }, [isOpen])

  const updatePos = useCallback(() => {
    const trigger = rootRef.current
    const panelEl = panelRef.current
    if (!trigger) return
    const panelWidth = panelEl?.offsetWidth ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.width
    const panelHeight = panelEl?.offsetHeight ?? ANCHOR_PANEL_FALLBACK_SIZE_PX.height
    setPanelPos(
      computeAnchorPanelPosition({
        anchorRect: trigger.getBoundingClientRect(),
        panelWidth,
        panelHeight,
      }),
    )
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) return
    updatePos()
  }, [isOpen, updatePos])

  useEffect(() => {
    if (!isOpen) return
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [isOpen, updatePos])

  useEffect(() => {
    if (!isOpen) return
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null
      if (!target) return
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown, true)
    return () => document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isOpen])

  useDismissOnEscape(isOpen, () => setIsOpen(false))
  useFocusTrap(panelRef, isOpen)

  function handleColumnKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLLIElement>('[role="option"]'))
    const current = document.activeElement as HTMLLIElement
    const idx = items.indexOf(current)
    if (idx < 0) return
    let next = idx
    if (e.key === 'ArrowDown') next = Math.min(idx + 1, items.length - 1)
    else if (e.key === 'ArrowUp') next = Math.max(idx - 1, 0)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    items[next]?.focus()
    items[next]?.scrollIntoView({ block: 'nearest' })
  }

  function selectHour(h: number) {
    const next = `${pad(h)}:${pad(selM ?? 0)}`
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function selectMinute(m: number) {
    const next = `${pad(selH ?? 0)}:${pad(m)}`
    if (!isControlled) setInternalValue(next)
    onChange?.(next)
  }

  function displayHourLabel(h: number): string {
    if (use12Hour) {
      const period = h >= 12 ? 'PM' : 'AM'
      return `${pad(h % 12 || 12)} ${period}`
    }
    return pad(h)
  }

  const panelNode = isOpen ? (
    <Panel
      ref={panelRef}
      id={popoverId}
      role="dialog"
      aria-modal="true"
      aria-label="시간 선택기"
      position="fixed"
      offset="none"
      className="z-[1000] overflow-hidden"
      style={{ top: panelPos.top, left: panelPos.left }}
    >
      <div className="flex divide-x divide-border">
        {/* Hours */}
        <div className="flex flex-col">
          <span className={timePickerColumnHeaderVariants({ density: den })}>
            {use12Hour ? 'Hour' : 'HH'}
          </span>
          <ul
            ref={hourListRef}
            data-slot="panel-scroll-region"
            role="listbox"
            aria-label="시"
            onKeyDown={handleColumnKeyDown}
            className={timePickerListVariants({ density: den })}
          >
            {hours.map((h) => {
              const isSelected = selH === h
              const isTabStop = selH !== null ? isSelected : h === 0
              return (
                <li
                  key={h}
                  role="option"
                  tabIndex={isTabStop ? 0 : -1}
                  aria-selected={isSelected}
                  onClick={() => selectHour(h)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectHour(h)
                    }
                  }}
                  className={cn(
                    timePickerOptionVariants({ density: den }),
                    isSelected && 'bg-primary font-medium text-primary-fg',
                  )}
                >
                  {displayHourLabel(h)}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Minutes */}
        <div className="flex flex-col">
          <span className={timePickerColumnHeaderVariants({ density: den })}>MM</span>
          <ul
            ref={minuteListRef}
            data-slot="panel-scroll-region"
            role="listbox"
            aria-label="분"
            onKeyDown={handleColumnKeyDown}
            className={timePickerListVariants({ density: den })}
          >
            {minutes.map((m) => {
              const isSelected = selM === m
              const isTabStop = selM !== null ? isSelected : m === minutes[0]
              return (
                <li
                  key={m}
                  role="option"
                  tabIndex={isTabStop ? 0 : -1}
                  aria-selected={isSelected}
                  onClick={() => selectMinute(m)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectMinute(m)
                    }
                  }}
                  className={cn(
                    timePickerOptionVariants({ density: den }),
                    isSelected && 'bg-primary font-medium text-primary-fg',
                  )}
                >
                  {pad(m)}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Panel>
  ) : null

  return (
    <div ref={rootRef} className={cn('relative w-full', className)} {...props}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={popoverId}
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          inputVariants({ variant, size }),
          'flex cursor-pointer items-center justify-between gap-2 text-left',
          !value && 'text-fg-muted',
        )}
      >
        <span>
          {selH !== null && selM !== null ? formatDisplay(selH, selM, use12Hour) : placeholder}
        </span>
        <span aria-hidden="true" className="flex shrink-0 items-center text-fg-muted">
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5v3.5l2.5 1.5" />
          </svg>
        </span>
      </button>
      {panelNode ? createPortal(panelNode, portalRoot) : null}
    </div>
  )
}

export { TimePicker }
export type { TimePickerProps }
