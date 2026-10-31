'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { spring } from '@/foundations/motionTokens'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

export type BottomSheetProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title?: React.ReactNode
  children: React.ReactNode
  /**
   * 시트를 가둘 컨테이너. 지정하면 body 대신 이 요소 안에 absolute 로 뜬다
   * (`position: relative; overflow: hidden` 필요) — 탭 워크스페이스·프리뷰 프레임처럼
   * 화면 일부에만 모달을 띄우는 호스트용. 생략하면 뷰포트(fixed) 기준.
   */
  container?: HTMLElement | null
  className?: string
  titleId?: string
}

/**
 * 화면 하단에서 올라오는 모달 시트 — 모바일 현장 셸의 기본 오버레이.
 * Drawer(side="bottom")와 달리: 상단만 radius-3xl(M3 extra-large), 드래그 핸들,
 * safe-area 하단 패딩, `container` 포털을 갖는다.
 *
 * 시트가 열리는 동안 페이지의 primary CTA 는 숨겨야 한다(D-1 정책) —
 * 시각 dim 이 아니라 unmount. 그 규율은 호스트 몫이다.
 */
function BottomSheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  children,
  container,
  className,
  titleId: titleIdProp,
}: BottomSheetProps) {
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

  // body 스크롤 잠금은 뷰포트 모달일 때만 — container 모달은 호스트 스크롤을 존중한다.
  useEffect(() => {
    if (!open || container != null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, container])

  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(() => {
      panelRef.current?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  if (!mounted) return null

  const contained = container != null
  const positionClass = contained ? 'absolute' : 'fixed'

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          data-slot="bottom-sheet-root"
          className={cn(positionClass, 'inset-0 z-50')}
          role="presentation"
        >
          <OverlayScrim
            data-slot="bottom-sheet-backdrop"
            dismissLabel="닫기"
            onClick={() => handleOpenChange(false)}
          />
          <motion.div
            className={cn(positionClass, 'inset-x-0 bottom-0 z-[60] max-h-[85svh]')}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: spring.expressive }}
            exit={{ y: '100%', opacity: 0, transition: spring.standard }}
          >
            <Panel
              ref={panelRef}
              role="dialog"
              data-slot="bottom-sheet-panel"
              appearance="solid"
              shape="edge-bottom"
              position="static"
              offset="none"
              scrollHint={false}
              aria-modal="true"
              aria-labelledby={title != null ? titleId : undefined}
              aria-label={title != null ? undefined : '시트'}
              tabIndex={-1}
              className={cn(
                'rounded-t-3xl rounded-b-none px-5 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]',
                className,
              )}
            >
              <div
                aria-hidden
                data-slot="bottom-sheet-handle"
                className="mx-auto mb-3.5 h-1 w-10 rounded-full bg-border-strong"
              />
              {title != null && (
                <h2
                  id={titleId}
                  data-slot="bottom-sheet-title"
                  className="text-xl font-bold text-fg"
                >
                  {title}
                </h2>
              )}
              <div data-slot="bottom-sheet-body" className="text-sm text-fg">
                {children}
              </div>
            </Panel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    container ?? document.body,
  )
}

export { BottomSheet }
