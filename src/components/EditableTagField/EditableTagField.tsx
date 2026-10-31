'use client'

import { useEffect, useState } from 'react'

import { Badge, type BadgeProps } from '@/components/Badge'
import { IconButton } from '@/components/IconButton'
import { Stack } from '@/components/layout/Stack'
import { MultiSelect, type MultiSelectOption } from '@/components/MultiSelect'
import { Check, Pencil, X, createIconElement } from '@/icons'
import { cn } from '@/utils/cn'

export type EditableTagFieldOption = MultiSelectOption

type EditableTagFieldProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  options: EditableTagFieldOption[]
  /** 선택된 태그 값 (controlled). 미제공 시 내부에서 관리됩니다. */
  value?: readonly string[]
  /** Uncontrolled 초기 태그 값 */
  defaultValue?: readonly string[]
  /**
   * 저장 버튼 클릭 시 호출됩니다. 비동기 작업(서버 persist) 시 사용합니다.
   * 미제공 시 `onChange`를 통해 동기적으로 값을 전달합니다.
   */
  onSave?: (next: string[]) => void | Promise<void>
  /** 저장 완료 후(또는 onSave 미제공 시 즉시) 호출됩니다. */
  onChange?: (next: string[]) => void
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
  tagVariant?: BadgeProps['variant']
  tagSize?: BadgeProps['size']
  emptyFallback?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  saving?: boolean
  editLabel?: string
  saveLabel?: string
  cancelLabel?: string
}

function resolveOptionLabel(options: EditableTagFieldOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value
}

function EditableTagField({
  className,
  options,
  value,
  defaultValue,
  onSave,
  onChange,
  editing,
  onEditingChange,
  tagVariant = 'primary',
  tagSize = 'sm',
  emptyFallback = '—',
  placeholder = '선택…',
  disabled = false,
  saving = false,
  editLabel = '수정',
  saveLabel = '저장',
  cancelLabel = '취소',
  ...props
}: EditableTagFieldProps) {
  const [internalEditing, setInternalEditing] = useState(false)
  const [draftValue, setDraftValue] = useState<string[]>([])

  const isControlledValue = value !== undefined
  const [internalValue, setInternalValue] = useState<readonly string[]>(defaultValue ?? [])
  const currentValue = isControlledValue ? value : internalValue

  const isControlledEditing = editing !== undefined
  const isEditing = isControlledEditing ? editing : internalEditing

  function setEditing(next: boolean) {
    if (!isControlledEditing) setInternalEditing(next)
    onEditingChange?.(next)
  }

  useEffect(() => {
    if (!isEditing) return
    setDraftValue([...currentValue])
  }, [isEditing, currentValue])

  useEffect(() => {
    if (isControlledEditing && editing === false) {
      setDraftValue([])
    }
  }, [editing, isControlledEditing])

  function startEditing() {
    if (disabled || saving) return
    setDraftValue([...currentValue])
    setEditing(true)
  }

  function cancelEditing() {
    setDraftValue([])
    setEditing(false)
  }

  async function commitEditing() {
    try {
      if (onSave) {
        await onSave(draftValue)
      } else {
        onChange?.(draftValue)
      }
      if (!isControlledValue) setInternalValue(draftValue)
      setEditing(false)
      setDraftValue([])
    } catch {
      // Parent handles errors; keep edit mode open for retry.
    }
  }

  if (isEditing) {
    return (
      <div
        data-slot="editable-tag-field-root"
        data-editing="true"
        className={cn('min-w-0', className)}
        {...props}
      >
        <Stack direction="horizontal" gap={1} align="center" wrap>
          <div className="min-w-48 flex-1" data-slot="editable-tag-field-editor">
            <MultiSelect
              options={options}
              value={draftValue}
              onChange={setDraftValue}
              placeholder={placeholder}
              size="sm"
              density="compact"
              disabled={disabled || saving}
            />
          </div>
          <IconButton
            type="button"
            variant="ghost"
            size="xs"
            shape="square"
            data-slot="editable-tag-field-save"
            aria-label={saveLabel}
            disabled={disabled || saving}
            onClick={() => void commitEditing()}
          >
            {createIconElement(Check, 'sm')}
          </IconButton>
          <IconButton
            type="button"
            variant="ghost"
            size="xs"
            shape="square"
            data-slot="editable-tag-field-cancel"
            aria-label={cancelLabel}
            disabled={disabled || saving}
            onClick={cancelEditing}
          >
            {createIconElement(X, 'sm')}
          </IconButton>
        </Stack>
      </div>
    )
  }

  return (
    <div
      data-slot="editable-tag-field-root"
      data-editing="false"
      className={cn('min-w-0', className)}
      {...props}
    >
      <Stack direction="horizontal" gap={1} align="center" wrap>
        {currentValue.length === 0 ? (
          <span data-slot="editable-tag-field-empty" className="text-xs text-fg-muted">
            {emptyFallback}
          </span>
        ) : (
          currentValue.map((item) => (
            <Badge
              key={item}
              data-slot="editable-tag-field-tag"
              variant={tagVariant}
              size={tagSize}
            >
              {resolveOptionLabel(options, item)}
            </Badge>
          ))
        )}
        <IconButton
          type="button"
          variant="ghost"
          size="xs"
          shape="square"
          data-slot="editable-tag-field-edit"
          aria-label={editLabel}
          disabled={disabled || saving}
          onClick={startEditing}
        >
          {createIconElement(Pencil, 'sm')}
        </IconButton>
      </Stack>
    </div>
  )
}

export { EditableTagField }
export type { EditableTagFieldProps }
