'use client'

import { AnimatePresence } from 'motion/react'
import { useCallback, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { spring } from '@/foundations/motionTokens'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { MotionPanel } from '@/primitives/panelMotion'
import { anchoredPanelHasOpenNested, useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'

type PopoverSide = 'top' | 'bottom' | 'left' | 'right'
type PopoverAlign = 'start' | 'center' | 'end'

type PopoverTriggerProps = {
  onClick: () => void
  'aria-expanded': boolean
  'aria-controls': string | undefined
  'aria-haspopup': 'dialog'
}

type PopoverProps = {
  /**
   * 트리거 엘리먼트.
   * - `ReactNode`: `<div role="button">` 래퍼에 표시됩니다.
   * - `(props: PopoverTriggerProps) => ReactNode`: 명시적 render function. props를 직접 내려받습니다.
   */
  trigger: React.ReactNode | ((props: PopoverTriggerProps) => React.ReactNode)
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  side?: PopoverSide
  align?: PopoverAlign
  showDismiss?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-3.5"
      aria-hidden
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  side = 'bottom',
  align = 'start',
  showDismiss = false,
  className,
  triggerClassName,
  contentClassName,
}: PopoverProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const [uncontrolled, setUncontrolled] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolled

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open,
    anchorRef: rootRef,
    panelRef,
    placement: side,
    align,
    onPointerDownOutside: () => setOpen(false),
  })
  // Escape 는 중첩 드롭다운(Select/Menu)이 열려 있으면 그쪽 몫 — 팝오버까지 같이 닫으면
  // 편집 중이던 패널이 통째로 사라진다. 중첩이 닫힌 다음 Escape 에서 팝오버가 닫힌다.
  useDismissOnEscape(open, () => {
    if (anchoredPanelHasOpenNested(panelRef.current)) return
    setOpen(false)
  })
  useFocusTrap(panelRef, open)

  const triggerProps: PopoverTriggerProps = {
    onClick: () => setOpen(!open),
    'aria-expanded': open,
    'aria-controls': open ? panelId : undefined,
    'aria-haspopup': 'dialog',
  }

  return (
    <div ref={rootRef} data-slot="popover-root" className={cn('relative inline-flex', className)}>
      {typeof trigger === 'function' ? (
        trigger(triggerProps)
      ) : (
        <div
          data-slot="popover-trigger"
          className={triggerClassName}
          role="button"
          tabIndex={0}
          onClick={triggerProps.onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setOpen(!open)
            }
          }}
          aria-expanded={triggerProps['aria-expanded']}
          aria-controls={triggerProps['aria-controls']}
          aria-haspopup={triggerProps['aria-haspopup']}
        >
          {trigger}
        </div>
      )}

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <MotionPanel
                ref={panelRef}
                id={panelId}
                role="dialog"
                aria-modal="true"
                position="fixed"
                offset="none"
                data-slot="popover-panel"
                className={cn('min-w-[12rem] p-3', contentClassName, positionClassName)}
                style={panelStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: spring.standard }}
                exit={{ opacity: 0, transition: spring.standard }}
              >
                {showDismiss && (
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="닫기"
                    data-slot="popover-dismiss"
                    className={cn(
                      'absolute top-2 right-2 flex items-center justify-center rounded-md p-1',
                      'text-fg-muted transition-colors hover:bg-surface hover:text-fg',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    )}
                  >
                    <CloseIcon />
                  </button>
                )}
                {children}
              </MotionPanel>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}

Popover.displayName = 'Popover'

export { Popover }
export type { PopoverProps, PopoverSide, PopoverAlign, PopoverTriggerProps }
