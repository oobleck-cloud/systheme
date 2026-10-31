'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from '@/components/IconButton'
import { spring } from '@/foundations/motionTokens'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { drawerPanelVariants, Panel } from '@/primitives/panel'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

type DrawerSide = 'left' | 'right' | 'top' | 'bottom'

// motion.div owns the fixed positioning so transforms work correctly.
// Panel inside uses position="static" (overrides the edge shape's `fixed`).
const drawerPositionClass: Record<DrawerSide, string> = {
  left: 'fixed inset-y-0 left-0 h-full w-full max-w-md',
  right: 'fixed inset-y-0 right-0 h-full w-full max-w-md',
  top: 'fixed inset-x-0 top-0 max-h-[85vh] w-full',
  bottom: 'fixed inset-x-0 bottom-0 max-h-[85vh] w-full',
}

// Slide direction: 100% of the element's own size → fully off-screen
const drawerSlide: Record<DrawerSide, { x?: string; y?: string }> = {
  left: { x: '-100%' },
  right: { x: '100%' },
  top: { y: '-100%' },
  bottom: { y: '100%' },
}

const drawerShapeBySide = {
  left: 'edge-left',
  right: 'edge-right',
  top: 'edge-top',
  bottom: 'edge-bottom',
} as const

export type DrawerProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  titleId?: string
  side?: DrawerSide
}

/**
 * 화면 위를 **덮는** 모달 서랍. scrim(dim + blur) 뒤로 본문이 잠기고, 포커스가 안에 갇히며,
 * body 스크롤이 멈춘다 — "지금 이것부터 처리하라"는 요구다. 폼 작성·확인 흐름에 쓴다.
 *
 * 열어둔 채 본문과 **대조**하는 정보(고객 이력, 근거 패널)라면 자리를 나눠 갖는
 * [`SideSheet`](../SideSheet/SideSheet.tsx) 쪽이다. 둘의 차이는 폭이 아니라 모달 여부다.
 */
function Drawer({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  footer,
  className,
  titleId: titleIdProp,
  side = 'right',
}: DrawerProps) {
  const autoTitleId = useId()
  const titleId = titleIdProp ?? autoTitleId
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : internalOpen

  function handleOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useDismissOnEscape(open, () => handleOpenChange(false))
  useFocusTrap(panelRef, open && mounted)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      panelRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  if (!mounted) return null

  const hasHeader = title != null
  const shape = drawerShapeBySide[side]
  const slide = drawerSlide[side]

  return createPortal(
    <AnimatePresence>
      {open && (
        <div data-slot="drawer-root" className="fixed inset-0 z-50" role="presentation">
          {/* Scrim — dim fade + blur ramp (자체 애니메이션) */}
          <OverlayScrim
            data-slot="drawer-backdrop"
            dismissLabel="닫기"
            onClick={() => handleOpenChange(false)}
          />

          {/* Panel — directional slide + fade (expressive enter, standard exit) */}
          <motion.div
            className={cn(drawerPositionClass[side], 'z-[60]')}
            initial={{ ...slide, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1, transition: spring.expressive }}
            exit={{ ...slide, opacity: 0, transition: spring.standard }}
          >
            <Panel
              ref={panelRef}
              role="dialog"
              data-slot="drawer-panel"
              appearance="solid"
              shape={shape}
              position="static"
              offset="none"
              scrollHint={false}
              aria-modal="true"
              aria-labelledby={hasHeader ? titleId : undefined}
              aria-label={hasHeader ? undefined : '서랍'}
              tabIndex={-1}
              className={cn('h-full', className)}
            >
              <Surface
                kind="section"
                density="default"
                className="h-full max-h-none border-0 bg-transparent shadow-none"
                header={
                  hasHeader ? (
                    <div className="flex items-start justify-between gap-3">
                      <h2 id={titleId} className="text-base font-semibold text-fg">
                        {title}
                      </h2>
                      <IconButton
                        type="button"
                        data-slot="drawer-close"
                        variant="ghost"
                        size="sm"
                        shape="rounded"
                        aria-label="서랍 닫기"
                        onClick={() => handleOpenChange(false)}
                      >
                        <CloseIcon />
                      </IconButton>
                    </div>
                  ) : (
                    <div className="flex shrink-0 justify-end">
                      <IconButton
                        type="button"
                        data-slot="drawer-close"
                        variant="ghost"
                        size="sm"
                        shape="rounded"
                        aria-label="서랍 닫기"
                        onClick={() => handleOpenChange(false)}
                      >
                        <CloseIcon />
                      </IconButton>
                    </div>
                  )
                }
                footer={footer ?? undefined}
              >
                <div data-slot="drawer-body" className="text-sm text-fg">
                  {children}
                </div>
              </Surface>
            </Panel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

export { Drawer, drawerPanelVariants }
