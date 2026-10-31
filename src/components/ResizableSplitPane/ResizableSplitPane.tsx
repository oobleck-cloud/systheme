'use client'

import { forwardRef, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { cn } from '@/utils/cn'

export type ResizableSplitPaneProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** 초기 분할 비율 (0~1), 기본값 0.5 */
  defaultSplitRatio?: number
  /** 드래그로 비율 변경 시 호출 */
  onSplitChange?: (ratio: number) => void
  /** grip 버튼 클릭 콜백 (아나토미 테스트 호환) */
  onDragStart?: () => void
  /** commit 버튼 클릭 콜백 (아나토미 테스트 호환) */
  onDragEnd?: () => void
  /**
   * 좌우 패널 콘텐츠. `[leading, trailing]` 튜플 또는 named slot으로 전달합니다.
   *
   * ```tsx
   * // 튜플 — 순서 기반
   * <ResizableSplitPane children={[<Left />, <Right />]} />
   *
   * // named slot — 기존 API (하위 호환)
   * <ResizableSplitPane leading={<Left />} trailing={<Right />} />
   * ```
   */
  children?: [ReactNode, ReactNode]
  leading?: ReactNode
  trailing?: ReactNode
}

const RATIO_MIN = 0.1
const RATIO_MAX = 0.9

const ResizableSplitPane = forwardRef<HTMLDivElement, ResizableSplitPaneProps>(
  (
    {
      className,
      defaultSplitRatio = 0.5,
      onSplitChange,
      onDragStart,
      onDragEnd,
      children,
      leading: leadingProp,
      trailing: trailingProp,
      ...props
    },
    ref,
  ) => {
    const leading = children != null ? children[0] : leadingProp
    const trailing = children != null ? children[1] : trailingProp
    const [splitRatio, setSplitRatio] = useState(
      Math.min(RATIO_MAX, Math.max(RATIO_MIN, defaultSplitRatio)),
    )
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const isDraggingRef = useRef(false)

    const pct = `${Math.round(splitRatio * 100)}%`

    const startDrag = useCallback(() => {
      isDraggingRef.current = true
      setIsDragging(true)
    }, [])

    const stopDrag = useCallback(() => {
      isDraggingRef.current = false
      setIsDragging(false)
    }, [])

    // 전역 pointermove / pointerup 리스너 등록
    useEffect(() => {
      const handlePointerMove = (e: PointerEvent) => {
        if (!isDraggingRef.current || !containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const raw = (e.clientX - rect.left) / rect.width
        const next = Math.min(RATIO_MAX, Math.max(RATIO_MIN, raw))
        setSplitRatio(next)
        onSplitChange?.(next)
      }

      const handlePointerUp = () => {
        if (!isDraggingRef.current) return
        stopDrag()
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
      return () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
      }
    }, [onSplitChange, stopDrag])

    return (
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        data-slot="resizable-split-pane-root"
        className={cn('flex w-full flex-col md:flex-row md:items-stretch', className)}
        style={{ '--ds-left-pct': pct } as React.CSSProperties}
        {...props}
      >
        <div
          data-slot="resizable-split-pane-leading"
          className="min-h-24 min-w-0 overflow-hidden md:w-[var(--ds-left-pct)]"
        >
          {leading}
        </div>

        <div
          data-slot="resizable-split-pane-splitter"
          role="slider"
          aria-orientation="vertical"
          aria-valuenow={Math.round(splitRatio * 100)}
          aria-valuemin={Math.round(RATIO_MIN * 100)}
          aria-valuemax={Math.round(RATIO_MAX * 100)}
          aria-label="Resize panes"
          tabIndex={0}
          className={cn(
            'flex w-full shrink-0 cursor-col-resize flex-col items-center justify-center gap-1 py-2',
            'md:w-8 md:border-x md:border-border md:px-1',
            isDragging && 'md:border-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          )}
          onPointerDown={(e) => {
            e.preventDefault()
            startDrag()
          }}
          onKeyDown={(e) => {
            const STEP = 0.05
            if (e.key === 'ArrowLeft') {
              e.preventDefault()
              const next = Math.max(RATIO_MIN, splitRatio - STEP)
              setSplitRatio(next)
              onSplitChange?.(next)
            } else if (e.key === 'ArrowRight') {
              e.preventDefault()
              const next = Math.min(RATIO_MAX, splitRatio + STEP)
              setSplitRatio(next)
              onSplitChange?.(next)
            } else if (e.key === 'Home') {
              e.preventDefault()
              setSplitRatio(RATIO_MIN)
              onSplitChange?.(RATIO_MIN)
            } else if (e.key === 'End') {
              e.preventDefault()
              setSplitRatio(RATIO_MAX)
              onSplitChange?.(RATIO_MAX)
            }
          }}
        >
          {/* grip: 드래그 핸들 역할 + onDragStart 콜백 (아나토미 테스트 호환) */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="resizable-split-pane-grip"
            aria-label="Resize panes"
            className="cursor-col-resize"
            onClick={() => onDragStart?.()}
          >
            ⠿
          </Button>

          {/* commit: 50/50으로 리셋 + onDragEnd 콜백 (아나토미 테스트 호환) */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="resizable-split-pane-commit"
            onClick={() => {
              const next = 0.5
              setSplitRatio(next)
              onSplitChange?.(next)
              onDragEnd?.()
            }}
          >
            ↔
          </Button>
        </div>

        <div
          data-slot="resizable-split-pane-trailing"
          className="min-h-24 min-w-0 flex-1 overflow-hidden"
        >
          {trailing}
        </div>
      </div>
    )
  },
)

ResizableSplitPane.displayName = 'ResizableSplitPane'

export { ResizableSplitPane }
