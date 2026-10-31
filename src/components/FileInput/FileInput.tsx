'use client'

import { forwardRef, useId, useRef, useState } from 'react'

import { cn } from '@/utils/cn'

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-8 text-fg-muted"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4 shrink-0 text-fg-muted"
      aria-hidden
    >
      <path d="M10 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6l-3-4z" />
      <polyline points="10 2 10 6 14 6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      className="size-3.5"
      aria-hidden
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type FileInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> & {
  value?: File[]
  onChange?: (files: File[]) => void
  maxSize?: number
  placeholder?: React.ReactNode
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  (
    {
      className,
      value,
      onChange,
      accept,
      multiple = false,
      maxSize,
      disabled,
      placeholder,
      id,
      ...props
    },
    ref,
  ) => {
    const autoId = useId()
    const inputId = id ?? autoId
    const [dragOver, setDragOver] = useState(false)
    const [sizeErrors, setSizeErrors] = useState<string[]>([])
    // value가 제공되지 않을 때(uncontrolled 모드)를 위한 내부 상태
    const [internalFiles, setInternalFiles] = useState<File[]>([])
    const internalRef = useRef<HTMLInputElement>(null)
    const inputRef = (ref as React.RefObject<HTMLInputElement>) ?? internalRef

    // controlled / uncontrolled 통합 접근자
    const files = value !== undefined ? value : internalFiles

    const addFiles = (newFiles: FileList | null) => {
      if (!newFiles) return
      const arr = Array.from(newFiles)
      const errors: string[] = []
      const valid = arr.filter((f) => {
        if (maxSize && f.size > maxSize) {
          errors.push(`${f.name}: 최대 ${formatFileSize(maxSize)} 초과`)
          return false
        }
        return true
      })
      setSizeErrors(errors)
      if (valid.length === 0) return
      const next = multiple ? [...files, ...valid] : valid.slice(0, 1)
      if (value === undefined) setInternalFiles(next)
      onChange?.(next)
    }

    const removeFile = (index: number) => {
      const next = files.filter((_, i) => i !== index)
      if (value === undefined) setInternalFiles(next)
      onChange?.(next)
      if (next.length === 0 && inputRef.current) inputRef.current.value = ''
    }

    return (
      <div data-slot="file-input-root" className={cn('flex flex-col gap-2', className)}>
        {/* Drop zone */}
        <label
          htmlFor={inputId}
          data-drag-over={dragOver || undefined}
          data-slot="file-input-drop-zone"
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg',
            'border-2 border-dashed border-border bg-surface px-6 py-8',
            'transition-colors hover:border-primary/50 hover:bg-surface',
            dragOver && 'border-primary bg-primary/5',
            disabled && 'cursor-not-allowed opacity-50',
          )}
          onDragOver={(e) => {
            e.preventDefault()
            if (!disabled) setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (!disabled) addFiles(e.dataTransfer.files)
          }}
        >
          <UploadIcon />
          {placeholder ?? (
            <div className="text-center">
              <p className="text-sm font-medium text-fg">
                파일을 드래그하거나 <span className="text-primary">클릭하여 선택</span>
              </p>
              {accept && (
                <p className="mt-0.5 text-xs text-fg-muted">{accept.replaceAll(',', ', ')}</p>
              )}
              {maxSize && (
                <p className="mt-0.5 text-xs text-fg-muted">최대 {formatFileSize(maxSize)}</p>
              )}
            </div>
          )}
        </label>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => addFiles(e.target.files)}
          {...props}
        />

        {/* Size errors */}
        {sizeErrors.length > 0 && (
          <ul className="flex flex-col gap-0.5" role="alert">
            {sizeErrors.map((err, i) => (
              <li key={i} className="text-xs text-error-text">
                {err}
              </li>
            ))}
          </ul>
        )}

        {/* File list */}
        {files.length > 0 && (
          <ul data-slot="file-input-list" className="flex flex-col gap-1">
            {files.map((file, i) => (
              <li
                key={i}
                data-slot="file-input-item"
                className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
              >
                <FileIcon />
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{file.name}</span>
                <span className="shrink-0 text-xs text-fg-muted tabular-nums">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  aria-label={`${file.name} 제거`}
                  onClick={() => removeFile(i)}
                  data-slot="file-input-remove"
                  className={cn(
                    'flex shrink-0 items-center justify-center rounded-sm p-0.5',
                    'text-fg-muted transition-colors hover:text-fg',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  )}
                >
                  <CloseIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  },
)

FileInput.displayName = 'FileInput'

export { FileInput }
export type { FileInputProps }
