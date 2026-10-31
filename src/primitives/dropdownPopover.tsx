'use client'

import { forwardRef, useCallback, useRef } from 'react'

import {
  anchorPopoverRootClassName,
  useDismissOnEscape,
  usePointerDownOutside,
} from './anchorPopover'

import { cn } from '@/utils/cn'

function assignRef<T>(instance: T | null, ref: React.Ref<T> | undefined) {
  if (!ref) return
  if (typeof ref === 'function') ref(instance)
  else (ref as React.MutableRefObject<T | null>).current = instance
}

export type DropdownPopoverProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  /** 기본 true — 바깥 pointer 시 닫힘 */
  dismissOnPointerDownOutside?: boolean
  /** 기본 true — Escape 시 닫힘 */
  dismissOnEscape?: boolean
}

/**
 * 트리거 + 앵커 패널을 감싸는 루트. `Select` / `MultiSelect` / `Dropdown` 등이 공유.
 * 바깥 클릭·Escape 으로 `onOpenChange(false)` 호출.
 */
const DropdownPopover = forwardRef<HTMLDivElement, DropdownPopoverProps>(
  (
    {
      open,
      onOpenChange,
      children,
      className,
      dismissOnPointerDownOutside = true,
      dismissOnEscape = true,
      ...props
    },
    ref,
  ) => {
    const innerRef = useRef<HTMLDivElement>(null)

    const setRootNode = useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node
        assignRef(node, ref)
      },
      [ref],
    )

    usePointerDownOutside({
      enabled: dismissOnPointerDownOutside && open,
      containerRef: innerRef,
      onPointerDownOutside: () => onOpenChange(false),
    })
    useDismissOnEscape(dismissOnEscape && open, () => onOpenChange(false))

    return (
      <div ref={setRootNode} className={cn(anchorPopoverRootClassName, className)} {...props}>
        {children}
      </div>
    )
  },
)

DropdownPopover.displayName = 'DropdownPopover'

export { DropdownPopover }
