'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

export type ImageLightboxProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** controlled: 현재 열림 상태. 미제공 시 defaultOpen으로 내부 관리됩니다. */
  open?: boolean
  /** uncontrolled 초기 열림 상태 (기본값: false) */
  defaultOpen?: boolean
  /** controlled: 현재 활성 이미지 인덱스. 미제공 시 defaultActiveIndex로 내부 관리됩니다. */
  activeIndex?: number
  /** uncontrolled 초기 인덱스 (기본값: 0) */
  defaultActiveIndex?: number
  caption: string
  /** 이미지 수. 주면 이전·다음을 끝에서 막고, 1장이면 숨긴다. 없으면 다음의 상한을 모른다. */
  count?: number
  onOpenChange?: (open: boolean) => void
  onActiveIndexChange?: (index: number) => void
  onDownloadRequest?: () => void
  children?: React.ReactNode
}

const ImageLightbox = forwardRef<HTMLDivElement, ImageLightboxProps>(
  (
    {
      className,
      open: openProp,
      defaultOpen = false,
      activeIndex: activeIndexProp,
      defaultActiveIndex = 0,
      caption,
      count,
      onOpenChange,
      onActiveIndexChange,
      onDownloadRequest,
      children,
      ...props
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const [internalActiveIndex, setInternalActiveIndex] = useState(defaultActiveIndex)

    const isOpenControlled = openProp !== undefined
    const isIndexControlled = activeIndexProp !== undefined

    const open = isOpenControlled ? openProp : internalOpen
    const activeIndex = isIndexControlled ? activeIndexProp : internalActiveIndex
    const activeIndexRef = useRef(activeIndex)
    activeIndexRef.current = activeIndex
    const countRef = useRef(count)
    countRef.current = count
    const clampNext = (next: number) =>
      countRef.current == null ? next : Math.min(next, countRef.current - 1)
    const stepper = count == null || count > 1

    function handleOpenChange(next: boolean) {
      if (!isOpenControlled) setInternalOpen(next)
      onOpenChange?.(next)
    }

    function handleActiveIndexChange(next: number) {
      if (!isIndexControlled) setInternalActiveIndex(next)
      onActiveIndexChange?.(next)
    }

    useDismissOnEscape(open, () => handleOpenChange(false))
    const surfaceRef = useRef<HTMLDivElement>(null)
    useFocusTrap(surfaceRef, open)

    const handleGlobalKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handleActiveIndexChange(Math.max(0, activeIndexRef.current - 1))
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleActiveIndexChange(clampNext(activeIndexRef.current + 1))
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    )

    useEffect(() => {
      if (!open) return
      document.addEventListener('keydown', handleGlobalKeyDown)
      return () => document.removeEventListener('keydown', handleGlobalKeyDown)
    }, [open, handleGlobalKeyDown])

    if (!open) return null

    return (
      <div
        ref={ref}
        data-slot="image-lightbox-root"
        className={cn('fixed inset-0 z-50', className)}
        {...props}
      >
        <OverlayScrim
          data-slot="image-lightbox-backdrop"
          dismissLabel="갤러리 닫기"
          className="bg-background/90"
          onClick={() => handleOpenChange(false)}
        />
        <Panel
          ref={surfaceRef}
          data-slot="image-lightbox-surface"
          appearance="solid"
          shape="dialog"
          position="fixed"
          offset="none"
          scrollHint={false}
          className="inset-4 z-10 flex max-h-none max-w-none flex-col gap-3 p-3 md:inset-8"
          role="dialog"
          aria-modal="true"
        >
          <Stack direction="horizontal" align="center" justify="between" gap={2} wrap>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="image-lightbox-close"
              onClick={() => handleOpenChange(false)}
            >
              닫기
            </Button>
            <Stack direction="horizontal" gap={2} wrap>
              {stepper && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-slot="image-lightbox-prev"
                    disabled={activeIndex <= 0}
                    onClick={() => handleActiveIndexChange(Math.max(0, activeIndex - 1))}
                  >
                    이전
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-slot="image-lightbox-next"
                    disabled={count != null && activeIndex >= count - 1}
                    onClick={() => handleActiveIndexChange(clampNext(activeIndex + 1))}
                  >
                    다음
                  </Button>
                </>
              )}
              <Button
                type="button"
                size="sm"
                variant="primary"
                data-slot="image-lightbox-download"
                disabled={!onDownloadRequest}
                onClick={onDownloadRequest}
              >
                다운로드
              </Button>
            </Stack>
          </Stack>
          <div
            data-slot="image-lightbox-image-slot"
            // min-h-0 이 없으면 flex 자식이 내용(원본 이미지) 높이로 늘어나 화면 밖이 잘린다. 자리 크기가
            // 정해져야 안의 이미지가 max-h-full 로 맞춰 줄어든다.
            className="relative flex min-h-48 flex-1 basis-0 items-center justify-center overflow-hidden rounded-md bg-muted"
          >
            {children}
          </div>
          <p data-slot="image-lightbox-caption" className="text-center text-sm text-fg-muted">
            {caption || '\u00A0'}
          </p>
        </Panel>
      </div>
    )
  },
)

ImageLightbox.displayName = 'ImageLightbox'

export { ImageLightbox }
