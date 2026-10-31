'use client'

import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, useRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { spring } from '@/foundations/motionTokens'
import { useFocusTrap } from '@/primitives/anchorPopover'
import { useInteractionContext } from '@/primitives/interaction'
import { OverlayScrim } from '@/primitives/overlayScrim'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

export type CommandPaletteRow = { id: string; title: string; subtitle?: string }

export type CommandPaletteProps = {
  open?: boolean
  defaultOpen?: boolean
  /**
   * 검색어 controlled 값. 미제공 시 내부에서 관리됩니다.
   * 대부분의 경우 생략하고 `onQueryChange`만 사용하세요.
   */
  query?: string
  commandRows: CommandPaletteRow[]
  onOpenChange?: (open: boolean) => void
  onQueryChange?: (q: string) => void
  onExecute?: (rowId: string) => void
  className?: string
}

const CommandPalette = forwardRef<HTMLDivElement, CommandPaletteProps>(
  (
    {
      open: openProp,
      defaultOpen = false,
      query: queryProp,
      commandRows,
      onOpenChange,
      onQueryChange,
      onExecute,
      className,
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const [internalQuery, setInternalQuery] = useState('')

    const isOpenControlled = openProp !== undefined
    const open = isOpenControlled ? openProp! : internalOpen

    const isQueryControlled = queryProp !== undefined
    const query = isQueryControlled ? queryProp! : internalQuery

    function handleOpenChange(next: boolean) {
      if (!isOpenControlled) setInternalOpen(next)
      onOpenChange?.(next)
    }

    function handleQueryChange(q: string) {
      if (!isQueryControlled) setInternalQuery(q)
      onQueryChange?.(q)
      setFocusedIndex(0) // reset highlight on query change
    }

    const filteredRows = query.trim()
      ? commandRows.filter(
          (r) =>
            r.title.toLowerCase().includes(query.toLowerCase()) ||
            r.subtitle?.toLowerCase().includes(query.toLowerCase()),
        )
      : commandRows

    // Focus trap for the dialog panel
    const panelRef = useRef<HTMLDivElement>(null)
    useFocusTrap(panelRef, open)

    // Stable refs for use inside onIntent callback (avoids stale closure)
    const filteredRowsRef = useRef(filteredRows)
    filteredRowsRef.current = filteredRows
    const focusedIndexRef = useRef(0)

    const { contextProps, getItemProps, focusedIndex, setFocusedIndex } = useInteractionContext({
      kind: 'list',
      itemCount: filteredRows.length,
      onIntent: (intent) => {
        const rows = filteredRowsRef.current
        const currentIdx = focusedIndexRef.current
        switch (intent.type) {
          case 'nav.next':
            setFocusedIndex(Math.min(currentIdx + 1, rows.length - 1))
            return true
          case 'nav.prev':
            setFocusedIndex(Math.max(currentIdx - 1, 0))
            return true
          case 'nav.first':
            setFocusedIndex(0)
            return true
          case 'nav.last':
            setFocusedIndex(rows.length - 1)
            return true
          case 'cancel':
            handleOpenChange(false)
            return true
          case 'activate': {
            const row = rows[currentIdx]
            if (row) onExecute?.(row.id)
            return true
          }
          default:
            return false
        }
      },
    })

    // Keep focusedIndexRef in sync with hook state
    focusedIndexRef.current = focusedIndex

    // 첫 행을 기본 하이라이트 (표준 command-palette UX)
    const effectiveSelectedId = filteredRows[focusedIndex]?.id ?? filteredRows[0]?.id ?? ''

    return (
      <AnimatePresence>
        {open && (
          <div
            ref={ref}
            data-slot="command-palette-root"
            className={cn('fixed inset-0 z-50', className)}
          >
            {/* Scrim — fade */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: spring.standard }}
              exit={{ opacity: 0, transition: spring.standard }}
            >
              <OverlayScrim
                data-slot="command-palette-backdrop"
                dismissLabel="명령어 팔레트 닫기"
                onClick={() => handleOpenChange(false)}
              />
            </motion.div>

            {/* Panel — scale + fade, centered via inset-x-0 + mx-auto (no translate conflict) */}
            <motion.div
              className="fixed inset-x-0 top-24 z-10 mx-auto w-full max-w-lg"
              initial={{ opacity: 0, scale: 0.96, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: spring.expressive }}
              exit={{ opacity: 0, scale: 0.96, y: -8, transition: spring.standard }}
            >
              <Panel
                ref={panelRef}
                data-slot="command-palette-surface"
                appearance="solid"
                shape="dialog"
                position="static"
                offset="none"
                scrollHint={false}
                className="p-3"
                role="dialog"
                aria-modal="true"
              >
                <Input
                  data-slot="command-palette-search"
                  className="mb-2"
                  value={query}
                  placeholder="명령어 이름을 입력하세요..."
                  aria-label="명령어 검색"
                  aria-controls="command-palette-listbox"
                  aria-activedescendant={
                    effectiveSelectedId ? `command-palette-row-${effectiveSelectedId}` : undefined
                  }
                  onValueChange={handleQueryChange}
                  onKeyDown={(e) => {
                    // Forward navigation keys to the list context
                    switch (e.key) {
                      case 'ArrowDown':
                      case 'ArrowUp':
                      case 'Home':
                      case 'End':
                        e.preventDefault()
                        contextProps.onKeyDown?.(e as unknown as React.KeyboardEvent<HTMLElement>)
                        break
                      case 'Enter': {
                        e.preventDefault()
                        const row = filteredRowsRef.current[focusedIndexRef.current]
                        if (row) onExecute?.(row.id)
                        break
                      }
                      case 'Escape':
                        e.preventDefault()
                        handleOpenChange(false)
                        break
                    }
                  }}
                />
                {/* contextProps provides role="listbox", aria-orientation, onKeyDown */}
                <div
                  id="command-palette-listbox"
                  data-slot="command-palette-results"
                  {...contextProps}
                  className="flex max-h-80 flex-col gap-1 overflow-y-auto"
                >
                  {filteredRows.map((row, i) => {
                    const itemProps = getItemProps(i)
                    return (
                      <div
                        key={row.id}
                        id={`command-palette-row-${row.id}`}
                        role="option"
                        aria-selected={row.id === effectiveSelectedId}
                        tabIndex={itemProps.tabIndex}
                        onFocus={itemProps.onFocus}
                        data-slot="command-palette-result-row"
                        className={cn(
                          'flex flex-col gap-1 rounded-md border border-transparent px-2 py-2 text-left',
                          row.id === effectiveSelectedId && 'border-border bg-muted',
                        )}
                      >
                        <button
                          type="button"
                          tabIndex={-1}
                          className="w-full text-left"
                          onClick={() => setFocusedIndex(i)}
                          aria-current={row.id === effectiveSelectedId}
                        >
                          <span
                            data-slot="command-palette-title"
                            className="block text-sm font-medium text-fg"
                          >
                            {row.title}
                          </span>
                          {row.subtitle ? (
                            <span
                              data-slot="command-palette-subtitle"
                              className="block text-xs text-fg-muted"
                            >
                              {row.subtitle}
                            </span>
                          ) : (
                            <span data-slot="command-palette-subtitle" className="sr-only">
                              {' '}
                            </span>
                          )}
                        </button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          data-slot="command-palette-run"
                          disabled={!onExecute || row.id !== effectiveSelectedId}
                          onClick={() => onExecute?.(row.id)}
                        >
                          실행
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    )
  },
)

CommandPalette.displayName = 'CommandPalette'

export { CommandPalette }
