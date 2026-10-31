'use client'

import { forwardRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Stack } from '@/components/layout/Stack'
import { Modal } from '@/components/Modal/Modal'
import { cn } from '@/utils/cn'

export type SavedViewModel = { id: string; name: string }

export type SavedViewRailProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  views: SavedViewModel[]
  selectedViewId?: string
  defaultSelectedViewId?: string
  onSelectView?: (id: string) => void
  /**
   * 이름 편집 후 저장 버튼을 눌렀을 때 호출됩니다.
   * @param name - 편집된 뷰 이름
   * @param viewId - 현재 선택된 뷰 ID
   */
  onSaveView?: (name: string, viewId: string) => void
  /**
   * 삭제 버튼을 눌렀을 때 호출됩니다.
   * @param viewId - 삭제할 뷰 ID
   */
  onDeleteView?: (viewId: string) => void
  /**
   * 복제 버튼을 눌렀을 때 호출됩니다.
   * @param viewId - 복제할 뷰 ID
   */
  onDuplicateView?: (viewId: string) => void
}

const SavedViewRail = forwardRef<HTMLDivElement, SavedViewRailProps>(
  (
    {
      className,
      views,
      selectedViewId: selectedViewIdProp,
      defaultSelectedViewId,
      onSelectView,
      onSaveView,
      onDeleteView,
      onDuplicateView,
      ...props
    },
    ref,
  ) => {
    const [internalSelectedViewId, setInternalSelectedViewId] = useState<string>(
      () => defaultSelectedViewId ?? views[0]?.id ?? '',
    )
    const [editorOpen, setEditorOpen] = useState(false)
    const [draftName, setDraftName] = useState('')
    // Roving tabindex: the focused view is the single tab stop, following arrow-key / focus movement.
    const [focusedViewId, setFocusedViewId] = useState<string | null>(null)

    const isSelectedViewIdControlled = selectedViewIdProp !== undefined
    const selectedViewId = isSelectedViewIdControlled ? selectedViewIdProp! : internalSelectedViewId

    function handleSelectView(id: string) {
      if (!isSelectedViewIdControlled) setInternalSelectedViewId(id)
      onSelectView?.(id)
    }

    function openEditor() {
      const currentName = views.find((v) => v.id === selectedViewId)?.name ?? ''
      setDraftName(currentName)
      setEditorOpen(true)
    }

    function closeEditor() {
      setEditorOpen(false)
    }

    function handleSave() {
      onSaveView?.(draftName, selectedViewId)
      closeEditor()
    }

    function handleDelete() {
      onDeleteView?.(selectedViewId)
      closeEditor()
    }

    function handleDuplicate() {
      onDuplicateView?.(selectedViewId)
      closeEditor()
    }

    function handleViewListKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      const key = e.key
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return

      const rows = Array.from(
        e.currentTarget.querySelectorAll<HTMLElement>('[data-slot="saved-view-rail-view-row"]'),
      )
      const current = document.activeElement as HTMLElement
      const idx = rows.indexOf(current)
      if (idx < 0) return

      e.preventDefault()
      let next = idx
      if (key === 'ArrowDown') next = Math.min(idx + 1, rows.length - 1)
      else if (key === 'ArrowUp') next = Math.max(idx - 1, 0)
      else if (key === 'Home') next = 0
      else if (key === 'End') next = rows.length - 1
      rows[next]?.focus()
    }

    return (
      <div
        ref={ref}
        data-slot="saved-view-rail-root"
        className={cn('flex w-full flex-col gap-2', className)}
        {...props}
      >
        <div
          data-slot="saved-view-rail-view-list"
          role="listbox"
          tabIndex={-1}
          aria-label="저장된 뷰"
          className="flex flex-col gap-1"
          onKeyDown={handleViewListKeyDown}
        >
          {(() => {
            const selectedIdx = views.findIndex((x) => x.id === selectedViewId)
            const defaultTabStopId =
              (selectedIdx >= 0 ? views[selectedIdx]?.id : views[0]?.id) ?? null
            const activeTabStopId =
              focusedViewId != null && views.some((x) => x.id === focusedViewId)
                ? focusedViewId
                : defaultTabStopId
            return views.map((v) => {
              const selected = v.id === selectedViewId
              const isTabStop = v.id === activeTabStopId
              return (
                <button
                  key={v.id}
                  type="button"
                  role="option"
                  data-slot="saved-view-rail-view-row"
                  aria-selected={selected}
                  tabIndex={isTabStop ? 0 : -1}
                  className={cn(
                    'rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                    selected ? 'bg-muted font-medium text-fg' : 'text-fg-muted hover:bg-muted',
                  )}
                  onFocus={() => setFocusedViewId(v.id)}
                  onClick={() => handleSelectView(v.id)}
                >
                  <span data-slot="saved-view-rail-name">{v.name}</span>
                </button>
              )
            })
          })()}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="saved-view-rail-open-editor"
          onClick={openEditor}
        >
          이름 편집
        </Button>
        <Modal open={editorOpen} onOpenChange={setEditorOpen} title="저장된 뷰">
          <div data-slot="saved-view-rail-editor" className="flex flex-col gap-3">
            <Input
              data-slot="saved-view-rail-name-input"
              value={draftName}
              aria-label="뷰 이름"
              onValueChange={setDraftName}
            />
            <Stack direction="horizontal" gap={2} wrap>
              <Button
                type="button"
                size="sm"
                variant="primary"
                data-slot="saved-view-rail-save"
                onClick={handleSave}
              >
                저장
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-slot="saved-view-rail-delete"
                disabled={!onDeleteView}
                onClick={handleDelete}
              >
                삭제
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-slot="saved-view-rail-duplicate"
                disabled={!onDuplicateView}
                onClick={handleDuplicate}
              >
                복제
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-slot="saved-view-rail-close-editor"
                onClick={closeEditor}
              >
                닫기
              </Button>
            </Stack>
          </div>
        </Modal>
      </div>
    )
  },
)

SavedViewRail.displayName = 'SavedViewRail'

export { SavedViewRail }
