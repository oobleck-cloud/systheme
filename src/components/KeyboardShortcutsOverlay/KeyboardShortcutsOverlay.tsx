'use client'

import { forwardRef, useRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

export type ShortcutItemModel = { chord: string; description: string }

export type ShortcutGroupModel = { title: string; items: ShortcutItemModel[] }

export type KeyboardShortcutsOverlayProps = {
  open?: boolean
  defaultOpen?: boolean
  groups: ShortcutGroupModel[]
  onOpenChange?: (open: boolean) => void
  className?: string
}

const KeyboardShortcutsOverlay = forwardRef<HTMLDivElement, KeyboardShortcutsOverlayProps>(
  ({ className, open: openProp, defaultOpen = false, groups, onOpenChange }, ref) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp! : internalOpen

    function handleOpenChange(next: boolean) {
      if (!isControlled) setInternalOpen(next)
      onOpenChange?.(next)
    }

    useDismissOnEscape(open, () => handleOpenChange(false))
    const panelRef = useRef<HTMLDivElement>(null)
    useFocusTrap(panelRef, open)

    if (!open) return null

    return (
      <div
        ref={ref}
        data-slot="keyboard-shortcuts-overlay-root"
        className={cn('fixed inset-0 z-50', className)}
      >
        <OverlayScrim
          data-slot="keyboard-shortcuts-overlay-backdrop"
          dismissLabel="단축키 창 닫기"
          className="bg-background/80"
          onClick={() => handleOpenChange(false)}
        />
        <Panel
          ref={panelRef}
          data-slot="keyboard-shortcuts-overlay-surface"
          appearance="solid"
          shape="dialog"
          position="fixed"
          offset="none"
          scrollHint={false}
          className="left-1/2 top-1/2 z-10 max-h-96 max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto p-4"
          role="dialog"
          aria-modal="true"
        >
          <Stack direction="horizontal" align="center" justify="between" gap={2} className="mb-3">
            <span className="text-sm font-semibold text-fg">키보드 단축키</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="keyboard-shortcuts-overlay-close"
              onClick={() => handleOpenChange(false)}
            >
              닫기
            </Button>
          </Stack>
          <div data-slot="keyboard-shortcuts-overlay-group-list" className="flex flex-col gap-4">
            {groups.map((grp) => (
              <section key={grp.title} data-slot="keyboard-shortcuts-overlay-group-block">
                <h3
                  data-slot="keyboard-shortcuts-overlay-group-title"
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted"
                >
                  {grp.title}
                </h3>
                <div data-slot="keyboard-shortcuts-overlay-rows" className="flex flex-col gap-1">
                  {grp.items.map((item) => (
                    <div
                      key={`${grp.title}-${item.chord}`}
                      data-slot="keyboard-shortcuts-overlay-shortcut-row"
                      className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md px-2 py-1 hover:bg-muted"
                    >
                      <span
                        data-slot="keyboard-shortcuts-overlay-description"
                        className="min-w-0 truncate text-sm text-fg"
                      >
                        {item.description}
                      </span>
                      <kbd
                        data-slot="keyboard-shortcuts-overlay-chord"
                        className="shrink-0 rounded border border-border bg-surface px-2 py-0.5 font-mono text-xs text-fg"
                      >
                        {item.chord}
                      </kbd>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Panel>
      </div>
    )
  },
)

KeyboardShortcutsOverlay.displayName = 'KeyboardShortcutsOverlay'

export { KeyboardShortcutsOverlay }
