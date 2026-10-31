'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'

import { duration, spring } from '@/foundations/motionTokens'
import { cn } from '@/utils/cn'

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('size-4 shrink-0', className)}
      aria-hidden
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

export type AccordionItem = {
  id: string
  label: React.ReactNode
  description?: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

type AccordionType = 'single' | 'multiple'

type AccordionProps = React.HTMLAttributes<HTMLDivElement> & {
  items: AccordionItem[]
  type?: AccordionType
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

function Accordion({
  className,
  items,
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: AccordionProps) {
  const normalise = (v: string | string[] | undefined): string[] => {
    if (v === undefined) return []
    return Array.isArray(v) ? v : [v]
  }

  const [uncontrolled, setUncontrolled] = useState<string[]>(() => normalise(defaultValue))

  const isControlled = controlledValue !== undefined
  const openItems = isControlled ? normalise(controlledValue) : uncontrolled

  const toggle = useCallback(
    (id: string) => {
      const next =
        type === 'single'
          ? openItems.includes(id)
            ? []
            : [id]
          : openItems.includes(id)
            ? openItems.filter((i) => i !== id)
            : [...openItems, id]

      if (!isControlled) setUncontrolled(next)
      onValueChange?.(type === 'single' ? (next[0] ?? '') : next)
    },
    [openItems, type, isControlled, onValueChange],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return

    const triggers = Array.from(
      e.currentTarget.querySelectorAll<HTMLElement>(
        '[data-slot="accordion-trigger"]:not(:disabled)',
      ),
    )
    const current = document.activeElement as HTMLElement
    const idx = triggers.indexOf(current)
    if (idx < 0) return

    e.preventDefault()
    let next = idx
    if (key === 'ArrowDown') next = Math.min(idx + 1, triggers.length - 1)
    else if (key === 'ArrowUp') next = Math.max(idx - 1, 0)
    else if (key === 'Home') next = 0
    else if (key === 'End') next = triggers.length - 1
    triggers[next]?.focus()
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- onKeyDown delegated to inner button triggers only
    <div
      data-slot="accordion-root"
      className={cn('divide-y divide-border', className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {items.map((item) => {
        const isOpen = openItems.includes(item.id)
        const triggerId = `accordion-trigger-${item.id}`
        const regionId = `accordion-region-${item.id}`

        return (
          <div key={item.id} data-slot="accordion-item">
            <button
              id={triggerId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={regionId}
              disabled={item.disabled}
              onClick={() => toggle(item.id)}
              data-slot="accordion-trigger"
              data-state={isOpen ? 'open' : 'closed'}
              className={cn(
                'flex w-full items-center justify-between gap-4 py-4 text-left',
                'text-sm font-medium text-fg transition-colors hover:text-fg',
                'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span>{item.label}</span>
                {item.description != null && (
                  <span className="text-xs font-normal text-fg-subtle">{item.description}</span>
                )}
              </span>
              <ChevronDown
                className={cn(
                  'text-fg-muted transition-transform duration-200',
                  isOpen && 'rotate-180',
                )}
              />
            </button>

            {/* initial={false}: 첫 렌더에서 닫힌 항목을 즉시 표시하지 않음 */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                    transition: spring.standard,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: { ...spring.standard, duration: duration.spatial.fast },
                  }}
                  className="overflow-hidden"
                >
                  <div
                    id={regionId}
                    role="region"
                    aria-labelledby={triggerId}
                    data-slot="accordion-content"
                    data-state="open"
                    className="pb-4 text-sm text-fg-subtle"
                  >
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

Accordion.displayName = 'Accordion'

export { Accordion }
export type { AccordionProps, AccordionType }
