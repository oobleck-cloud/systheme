'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useId, useState } from 'react'

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

export type CollapsibleProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'onChange'
> & {
  /** 트리거 좌측에 표시할 내용 (라벨·아이콘 등). */
  trigger: React.ReactNode
  /** 접혔을 때 트리거 우측에 표시할 요약·보조 내용. */
  accessory?: React.ReactNode
  children: React.ReactNode
  /** controlled 열림 상태. */
  open?: boolean
  /** uncontrolled 초기 열림 상태 (기본 닫힘). */
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  /** 펼쳐진 콘텐츠 래퍼의 className (패딩 등 소비자가 제어). */
  contentClassName?: string
}

/**
 * 단일 disclosure(접기/펼치기) 프리미티브.
 * DS 모션 토큰(spring.standard · duration)으로 height·opacity를 애니메이션하며,
 * 접힘 상태에서 우측에 요약(accessory)을 cross-fade로 노출한다.
 * 여러 개를 독립 토글하려면 그대로 나열하고, 상호배타 그룹은 Accordion을 쓴다.
 */
function Collapsible({
  trigger,
  accessory,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  disabled,
  className,
  contentClassName,
  ...props
}: CollapsibleProps) {
  const id = useId()
  const triggerId = `collapsible-trigger-${id}`
  const regionId = `collapsible-region-${id}`

  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : uncontrolled

  const toggle = useCallback(() => {
    const next = !isOpen
    if (!isControlled) setUncontrolled(next)
    onOpenChange?.(next)
  }, [isOpen, isControlled, onOpenChange])

  const showAccessory = !isOpen && accessory != null && accessory !== ''

  return (
    <div data-slot="collapsible-root" className={className} {...props}>
      <button
        id={triggerId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={regionId}
        disabled={disabled}
        onClick={toggle}
        data-slot="collapsible-trigger"
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'flex w-full items-center gap-2 text-left',
          'text-sm font-medium text-fg transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        {trigger}
        <span className="ml-auto flex min-w-0 items-center gap-1.5">
          <AnimatePresence initial={false} mode="wait">
            {showAccessory && (
              <motion.span
                key="accessory"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: duration.effects.fast } }}
                exit={{ opacity: 0, transition: { duration: duration.effects.fast } }}
                className="truncate text-xs font-normal text-fg-muted"
                data-slot="collapsible-accessory"
              >
                {accessory}
              </motion.span>
            )}
          </AnimatePresence>
          <ChevronDown
            className={cn(
              'text-fg-muted transition-transform duration-200',
              isOpen && 'rotate-180',
            )}
          />
        </span>
      </button>

      {/* initial={false}: 첫 렌더에서 열린 패널을 애니메이션 없이 즉시 표시 */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1, transition: spring.standard }}
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
              data-slot="collapsible-content"
              className={contentClassName}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

Collapsible.displayName = 'Collapsible'

export { Collapsible }
