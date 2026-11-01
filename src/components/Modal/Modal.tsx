'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { IconButton } from '@/components/IconButton'
import { spring } from '@/foundations/motionTokens'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { useOverlayContainer } from '@/primitives/overlayContainer'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import { usePortalRoot } from '@/primitives/portalRoot'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

export type ModalProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title: React.ReactNode
  /** 제목 아래 한 줄 — 이 대화상자가 무엇을 대상으로 하는지 (주소·식별자 등) */
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Optional id for `aria-labelledby` when `title` is text-only */
  titleId?: string
}

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

function Modal({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  titleId: titleIdProp,
}: ModalProps) {
  const portalRoot = usePortalRoot()
  const autoTitleId = useId()
  const titleId = titleIdProp ?? autoTitleId
  const panelRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const [internalOpen, setInternalOpen] = useState(defaultOpen)

  // 스코프 컨테이너가 있으면 그 영역(예: 탭 패널)으로 portal하고 스크림을 제한한다.
  // 없으면 document.body로 portal해 뷰포트 전체를 덮는다(기본).
  const overlayContainer = useOverlayContainer()

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

  const scoped = overlayContainer != null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          data-slot="modal-root"
          className={cn(
            // 하단에 떠 있는 앱 크롬(AI Dock 등)만큼을 아래로 비운다.
            // 예전에는 "backdrop 이 크롬을 덮는다"고 보고 소비하지 않았는데, 크롬이 같은
            // z 층에 더 나중에 그려지면 backdrop 위로 올라온다 — 실제로 확정 버튼이 채팅
            // 독에 가려 눌리지 않았다. 가려진 액션은 없는 액션이다.
            'z-50 flex items-center justify-center p-4',
            'pb-[calc(var(--ds-spacing-4)+var(--ds-bottom-chrome-clearance))]',
            scoped ? 'absolute inset-0' : 'fixed inset-0',
          )}
          role="presentation"
        >
          {/* Scrim — dim fade + blur ramp (자체 애니메이션) */}
          <OverlayScrim
            data-slot="modal-backdrop"
            dismissLabel="닫기"
            onClick={() => handleOpenChange(false)}
          />

          {/*
            Dialog — scale + fade (expressive enter, standard exit).
            래퍼는 폭을 가져야 한다(`w-full`). 폭 없는 flex 아이템 안에서 패널의 `w-full max-w-lg` 는
            부모가 내용 크기라 퍼센트가 무효가 되고, 대화상자가 내용의 최소 폭으로 오그라든다 —
            입력이 전부 `w-full` 인 폼은 폰 폭에서 200px 남짓으로 접혔다(2026-09-10 실사고).
            소비자가 `w-[920px]` 처럼 폭을 박아 넣던 것도 이 결함의 우회였다.
          */}
          <motion.div
            className="relative z-10 flex w-full max-h-full min-h-0 max-w-full justify-center"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1, transition: spring.expressive }}
            exit={{ opacity: 0, scale: 0.97, transition: spring.standard }}
          >
            <Panel
              ref={panelRef}
              role="dialog"
              data-slot="modal-dialog"
              appearance="solid"
              shape="dialog"
              position="relative"
              offset="none"
              scrollHint={false}
              aria-modal="true"
              aria-labelledby={titleId}
              tabIndex={-1}
              // 기본 폭은 계약대로 max-w-lg. 여기 `max-w-full` 을 두면 twMerge 가 Panel 의 max-w-lg 를
              // 지워 대화상자가 화면 폭까지 벌어진다 — 폭을 바꾸려면 소비자가 max-w-*/w-* 를 준다.
              className={cn(
                'flex max-h-full min-h-0 w-full max-w-lg flex-col outline-none',
                className,
              )}
            >
              <Surface
                kind="section"
                density="default"
                className={cn(
                  'min-h-0 border-0 bg-transparent shadow-none',
                  // 본문 칸을 세로 flex 로 — 그래야 안쪽 modal-body(overflow-auto)가 남은 높이에 갇혀 스크롤한다.
                  // 아니면 긴 본문이 칸 밖으로 넘쳐 투명한 바닥(footer) 뒤로 비친다(일괄 발송 대화상자 실측).
                  '[&>[data-slot=surface-body]]:flex [&>[data-slot=surface-body]]:flex-col',
                  // 스코프 모달은 뷰포트가 아니라 자기 컨테이너(탭 패널) 안에 갇힌다 —
                  // vh 로 재면 패널보다 커져 잘린다.
                  scoped ? 'max-h-full' : 'max-h-[85vh]',
                )}
                header={
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 id={titleId} className="text-base font-semibold text-fg">
                        {title}
                      </h2>
                      {description != null && description !== false ? (
                        <div
                          data-slot="modal-description"
                          className="mt-0.5 text-xs text-fg-subtle"
                        >
                          {description}
                        </div>
                      ) : null}
                    </div>
                    <IconButton
                      type="button"
                      data-slot="modal-close"
                      variant="ghost"
                      size="sm"
                      shape="rounded"
                      aria-label="대화상자 닫기"
                      onClick={() => handleOpenChange(false)}
                    >
                      <CloseIcon />
                    </IconButton>
                  </div>
                }
                footer={footer ?? undefined}
              >
                <div
                  data-slot="modal-body"
                  className="@container/modal-body min-h-0 overflow-auto text-sm text-fg"
                >
                  {children}
                </div>
              </Surface>
            </Panel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    overlayContainer ?? portalRoot,
  )
}

export { Modal }
