'use client'

import { AnimatePresence } from 'motion/react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { duration, ease } from '@/foundations/motionTokens'
import { useDismissOnEscape } from '@/primitives/anchorPopover'
import { MotionPanel } from '@/primitives/panelMotion'
import { usePortalRoot } from '@/primitives/portalRoot'
import { useAnchoredPanel } from '@/primitives/useAnchoredPanel'
import { cn } from '@/utils/cn'

// 툴팁은 pointer-events-none + 작은 UI → 빠른 tween이 spring보다 자연스러움
const tooltipTransition = {
  type: 'tween',
  duration: duration.effects.fast,
  ease: ease.standard,
} as const

type TooltipSide = 'top' | 'bottom' | 'left' | 'right'

type TooltipProps = {
  content: React.ReactNode
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** 호버 시 열림 지연 (ms) */
  delayDuration?: number
  side?: TooltipSide
  className?: string
  /** 트리거 래퍼(`tooltip-trigger`) — 그리드 셀 등에서 `flex h-full w-full` 로 채울 때 사용 */
  triggerClassName?: string
  contentClassName?: string
}

function Tooltip({
  content,
  children,
  open: openControlled,
  onOpenChange,
  delayDuration = 200,
  side = 'bottom',
  className,
  triggerClassName,
  contentClassName,
}: TooltipProps) {
  const portalRoot = usePortalRoot()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openControlled !== undefined
  const open = isControlled ? openControlled : uncontrolledOpen

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const tipId = useId()

  const clearDelay = useCallback(() => {
    if (delayRef.current) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
  }, [])

  const openSoon = useCallback(() => {
    clearDelay()
    delayRef.current = setTimeout(() => setOpen(true), delayDuration)
  }, [clearDelay, delayDuration, setOpen])

  const closeSoon = useCallback(() => {
    clearDelay()
    delayRef.current = setTimeout(() => setOpen(false), 50)
  }, [clearDelay, setOpen])

  useEffect(() => () => clearDelay(), [clearDelay])

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open,
    anchorRef: rootRef,
    panelRef,
    placement: side,
    align: 'center',
    onPointerDownOutside: () => setOpen(false),
  })

  useDismissOnEscape(open, () => setOpen(false))

  return (
    <div
      ref={rootRef}
      data-slot="tooltip-root"
      className={cn('relative inline-flex', className)}
      onMouseEnter={openSoon}
      onMouseLeave={closeSoon}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setOpen(false)
        }
      }}
    >
      <div
        data-slot="tooltip-trigger"
        className={triggerClassName}
        aria-describedby={open ? tipId : undefined}
      >
        {children}
      </div>
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <MotionPanel
                ref={panelRef}
                id={tipId}
                role="tooltip"
                appearance="solid"
                shape="compact"
                position="fixed"
                offset="none"
                scrollHint={false}
                data-slot="tooltip-bubble"
                className={cn('pointer-events-none', positionClassName, contentClassName)}
                style={panelStyle}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: tooltipTransition }}
                exit={{ opacity: 0, transition: { ...tooltipTransition, duration: 0.08 } }}
              >
                <div data-slot="tooltip-content">{content}</div>
              </MotionPanel>
            )}
          </AnimatePresence>,
          portalRoot,
        )}
    </div>
  )
}

export { Tooltip }
export type { TooltipProps }
