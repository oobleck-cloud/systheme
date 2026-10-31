'use client'

import { type RefObject, useEffect, useRef } from 'react'

import { panelVariants } from './panel'

/** Root wrapper for trigger + anchored overlay (shared stacking context). */
export const anchorPopoverRootClassName = 'relative w-full'

/**
 * @deprecated Prefer {@link Panel} with `position="absolute"` and `offset="anchored"`.
 * Kept for consumers that only need the class string.
 */
export const anchorPopoverPanelBaseClassName = panelVariants({
  position: 'absolute',
  offset: 'anchored',
})

/**
 * @deprecated Prefer {@link Panel} with `position="fixed"` and `offset="anchored"`.
 * Kept for consumers that only need the class string.
 */
export const anchorPopoverPanelFixedClassName = panelVariants({
  position: 'fixed',
  offset: 'anchored',
})

type UsePointerDownOutsideParams = {
  enabled: boolean
  containerRef: RefObject<HTMLElement | null>
  onPointerDownOutside: (event: PointerEvent) => void
}

/**
 * Invokes `onPointerDownOutside` when `pointerdown` occurs outside `containerRef`.
 * Matches existing Select / DatePicker dismiss behavior (pointerdown on document).
 */
export function usePointerDownOutside({
  enabled,
  containerRef,
  onPointerDownOutside,
}: UsePointerDownOutsideParams) {
  const handlerRef = useRef(onPointerDownOutside)
  handlerRef.current = onPointerDownOutside

  useEffect(() => {
    if (!enabled) return
    function handlePointerDown(event: PointerEvent) {
      const root = containerRef.current
      if (!root?.contains(event.target as Node)) handlerRef.current(event)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [enabled, containerRef])
}

/** Calls `onEscape` when `Escape` is pressed while `enabled`. */
export function useDismissOnEscape(enabled: boolean, onEscape: () => void) {
  const cbRef = useRef(onEscape)
  cbRef.current = onEscape

  useEffect(() => {
    if (!enabled) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cbRef.current()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [enabled])
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Tab 키가 `containerRef` 내부에 갇히도록 강제하는 focus trap.
 * overlay-surface intent 컴포넌트(Modal, Drawer)에 사용한다.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return
    const container = containerRef.current

    function getFocusable(): HTMLElement[] {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) {
        e.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || active === container) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last || active === container) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [containerRef, enabled])
}
