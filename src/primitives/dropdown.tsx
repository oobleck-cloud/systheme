'use client'

import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { DropdownPopover } from './dropdownPopover'
import { Panel } from './panel'
import { useAnchoredPanel } from './useAnchoredPanel'

import { cn } from '@/utils/cn'

export type DropdownProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** 패널 내용 */
  children: React.ReactNode
  /** 트리거 왼쪽 라벨 */
  label: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
}

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center text-fg-muted transition-transform',
        open && 'rotate-180',
      )}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6l4 4 4-4" />
      </svg>
    </span>
  )
}

// L1 — 기본 트리거 스타일 + 패널. 커스텀 트리거는 `DropdownPopover` 직접 사용.
function Dropdown({
  className,
  label,
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  ...props
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp! : uncontrolledOpen

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next)
    onOpenChange?.(next)
  }

  const panelId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    mounted,
    style: panelStyle,
    positionClassName,
  } = useAnchoredPanel({
    open,
    anchorRef: rootRef,
    panelRef,
    placement: 'below',
    onPointerDownOutside: () => setOpen(false),
  })

  return (
    <DropdownPopover
      ref={rootRef}
      open={open}
      onOpenChange={setOpen}
      className={className}
      // Panel is portaled to document.body; dismiss is handled by useAnchoredPanel (two-ref aware)
      dismissOnPointerDownOutside={false}
      {...props}
    >
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? panelId : undefined}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-sm font-medium text-fg',
          'transition-colors hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        <Chevron open={open} />
      </button>

      {mounted &&
        createPortal(
          open ? (
            <Panel
              ref={panelRef}
              id={panelId}
              role="region"
              position="fixed"
              offset="none"
              className={cn('max-w-md min-w-[10rem] overflow-hidden', positionClassName)}
              style={panelStyle}
            >
              {children}
            </Panel>
          ) : null,
          document.body,
        )}
    </DropdownPopover>
  )
}

export { Dropdown }
