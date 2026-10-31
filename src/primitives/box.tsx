'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/utils/cn'

/** 스크롤 힌트(하단 그라데이션) 감지 대상 — 레거시 `panel-scroll-region` 포함 */
export const BOX_SCROLL_REGION_SELECTOR =
  '[data-slot="box-scroll-region"], [data-slot="panel-scroll-region"], [data-slot="rich-list-scroll-region"], [data-slot="surface-body"]'

const boxVariants = cva('min-w-0', {
  variants: {
    scrollHint: {
      true: '',
      false: '',
    },
  },
  defaultVariants: {
    scrollHint: true,
  },
})

function resolveBoxScrollElements(root: HTMLElement): HTMLElement[] {
  const marked = Array.from(root.querySelectorAll<HTMLElement>(BOX_SCROLL_REGION_SELECTOR))
  if (marked.length > 0) return marked

  const style = getComputedStyle(root)
  if (/(auto|scroll|overlay)/.test(style.overflowY)) return [root]

  return []
}

function useBoxScrollRegionHint(
  rootRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
): boolean {
  const [showHint, setShowHint] = useState(false)

  const update = useCallback(() => {
    const root = rootRef.current
    if (!root || !enabled) {
      setShowHint(false)
      return
    }
    const scrollEls = resolveBoxScrollElements(root)
    if (scrollEls.length === 0) {
      setShowHint(false)
      return
    }
    const needsHint = scrollEls.some((scrollEl) => {
      const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight + 1
      const atEnd = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1
      return canScroll && !atEnd
    })
    setShowHint(needsHint)
  }, [enabled, rootRef])

  useEffect(() => {
    update()
    const root = rootRef.current
    if (!root || !enabled) return

    const scrollEls = resolveBoxScrollElements(root)
    if (scrollEls.length === 0) return

    for (const scrollEl of scrollEls) {
      scrollEl.addEventListener('scroll', update, { passive: true })
    }
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    for (const scrollEl of scrollEls) {
      ro?.observe(scrollEl)
    }
    ro?.observe(root)

    return () => {
      for (const scrollEl of scrollEls) {
        scrollEl.removeEventListener('scroll', update)
      }
      ro?.disconnect()
    }
  }, [enabled, rootRef, update])

  return showHint
}

type ScrollHintTone = 'solid' | 'frosted'

function BoxScrollHintOverlay({
  className,
  tone = 'solid',
}: {
  className?: string
  tone?: ScrollHintTone
}) {
  return (
    <div
      data-slot="box-scroll-hint"
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8',
        tone === 'frosted'
          ? 'bg-gradient-to-t from-background/90 from-10% via-background/40 to-transparent'
          : 'bg-gradient-to-t from-background from-25% via-background/90 to-transparent',
        className,
      )}
    />
  )
}

type BoxProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof boxVariants> & {
    /** 스크롤 가능 시 하단 페이드 힌트 (기본 true) */
    scrollHint?: boolean
    /** 힌트 오버레이에 추가 클래스 (예: Panel/Surface `rounded-b-lg`) */
    scrollHintClassName?: string
    /** glass Panel 은 `frosted`, 불투명 리스트 패널은 `solid` */
    scrollHintTone?: ScrollHintTone
  }

/**
 * 콘텐츠 컨테이너 — 스크롤 영역 + 선택적 하단 blur 힌트.
 * {@link Panel}(오버레이), {@link Surface}(부착 레이아웃)의 공통 기반.
 */
const Box = forwardRef<HTMLDivElement, BoxProps>(
  (
    {
      className,
      scrollHint = true,
      scrollHintClassName,
      scrollHintTone = 'solid',
      children,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null)
    const mergedRef = useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const showScrollHint = useBoxScrollRegionHint(innerRef, scrollHint !== false)

    return (
      <div
        ref={mergedRef}
        data-slot="box-root"
        className={cn(boxVariants({ scrollHint: scrollHint !== false }), className)}
        {...props}
      >
        {children}
        {showScrollHint ? (
          <BoxScrollHintOverlay className={scrollHintClassName} tone={scrollHintTone} />
        ) : null}
      </div>
    )
  },
)

Box.displayName = 'Box'

/** @deprecated {@link BoxScrollHintOverlay} */
const PanelScrollHintOverlay = BoxScrollHintOverlay

/** @deprecated {@link useBoxScrollRegionHint} */
const usePanelScrollRegionHint = useBoxScrollRegionHint

export {
  Box,
  BoxScrollHintOverlay,
  boxVariants,
  useBoxScrollRegionHint,
  PanelScrollHintOverlay,
  usePanelScrollRegionHint,
}
export type { BoxProps }
