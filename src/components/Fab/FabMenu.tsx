'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'

import { spring } from '@/foundations/motionTokens'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { cn } from '@/utils/cn'
import { pressScale } from '@/utils/interactionUtils'

function MenuGlyph() {
  return (
    <svg
      aria-hidden
      className="h-5 w-5"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" />
    </svg>
  )
}

function CloseGlyph() {
  return (
    <svg
      aria-hidden
      className="h-4.5 w-4.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

export type FabMenuItem = {
  id: string
  label: React.ReactNode
  icon?: React.ReactNode
  onSelect?: () => void
}

export type FabMenuProps = {
  items: FabMenuItem[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** 닫힘 트리거 아이콘 (기본: 메뉴 글리프) */
  icon?: React.ReactNode
  'aria-label'?: string
  className?: string
}

/**
 * FAB 메뉴 — 화면을 벗어나는 탈출구(다른 메뉴로 이동)를 FAB 하나에 접어둔다.
 * M3E shape morph: 닫힘 = 사각 FAB(corner 16) → 열림 = 작은 원형 ✕.
 * 아이템은 트리거 위로 쌓이는 흰 필(토널 표면 위 흰 필 = 액션 문법).
 *
 * 이 컴포넌트는 클러스터만 그린다 — scrim·배치는 호스트 몫
 * (모달 dim 이 필요하면 호스트가 OverlayScrim 을 함께 렌더).
 */
function FabMenu({
  items,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  icon,
  'aria-label': ariaLabel = '메뉴',
  className,
}: FabMenuProps) {
  const clusterRef = useRef<HTMLDivElement>(null)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : internalOpen

  function handleOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  useDismissOnEscape(open, () => handleOpenChange(false))
  useFocusTrap(clusterRef, open)

  return (
    <div
      ref={clusterRef}
      data-slot="fab-menu-root"
      className={cn('flex flex-col items-end gap-2', className)}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="fab-menu-items"
            data-slot="fab-menu-items"
            role="menu"
            aria-label={ariaLabel}
            className="flex flex-col items-end gap-2"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring.expressive }}
            exit={{ opacity: 0, y: 8, scale: 0.96, transition: spring.standard }}
          >
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                role="menuitem"
                data-slot="fab-menu-item"
                className={cn(
                  'flex min-h-12 items-center gap-2.5 rounded-full bg-background px-5 text-sm font-semibold text-fg shadow-dialog',
                  'transition-colors duration-effects-default ease-standard hover:bg-surface',
                  pressScale,
                  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                )}
                onClick={() => {
                  it.onSelect?.()
                  handleOpenChange(false)
                }}
              >
                {it.icon != null && (
                  <span aria-hidden className="grid place-items-center">
                    {it.icon}
                  </span>
                )}
                {it.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {/* M3E shape morph: 사각 FAB → 작은 원형 닫기 */}
      <button
        type="button"
        data-slot="fab-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={open ? `${ariaLabel} 닫기` : ariaLabel}
        className={cn(
          'inline-flex items-center justify-center shadow-dialog',
          'transition-all duration-effects-default ease-standard',
          pressScale,
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
          open
            ? 'size-12 rounded-full bg-primary text-primary-fg'
            : 'size-14 rounded-xl bg-primary-container text-on-primary-container hover:bg-primary-container-hover',
        )}
        onClick={() => handleOpenChange(!open)}
      >
        {open ? <CloseGlyph /> : (icon ?? <MenuGlyph />)}
      </button>
    </div>
  )
}

export { FabMenu }
