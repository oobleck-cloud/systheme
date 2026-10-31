'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Input } from '@/components/Input/Input'
import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type RichTextEditorProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Controlled HTML content */
  value?: string
  /** Uncontrolled initial HTML content */
  defaultValue?: string
  onChange?: (html: string) => void
  /**
   * mention 기능 활성화 시 검색어가 바뀔 때마다 호출됩니다.
   * 외부 mention picker 연동이 필요하지 않으면 생략하세요.
   */
  onMentionQuery?: (q: string) => void
}

const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ className, value, defaultValue, onChange, onMentionQuery, ...props }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const isControlled = value !== undefined
    const initialHtml = value ?? defaultValue ?? ''

    const [linkOpen, setLinkOpen] = useState(false)
    const [linkUrl, setLinkUrl] = useState('')
    const [mentionQuery, setMentionQuery] = useState('')

    useEffect(() => {
      const el = editorRef.current
      if (!el) return
      if (isControlled) {
        if (el.innerHTML !== value) el.innerHTML = value ?? ''
        return
      }
      if (initialHtml && !el.innerHTML) {
        el.innerHTML = initialHtml
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isControlled, value])

    useEffect(() => {
      if (isControlled) return
      const el = editorRef.current
      if (el && initialHtml && el.innerHTML === '') {
        el.innerHTML = initialHtml
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const notifyChange = useCallback(() => {
      const html = editorRef.current?.innerHTML ?? ''
      onChange?.(html)
    }, [onChange])

    const execFormat = useCallback(
      (command: string, val?: string) => {
        editorRef.current?.focus()
        document.execCommand(command, false, val ?? undefined) // execCommand는 deprecated지만 서드파티 없이 contentEditable 서식 적용을 위한 표준 방법
        notifyChange()
      },
      [notifyChange],
    )

    const handleLinkEditorToggle = useCallback(() => {
      setLinkOpen((prev) => !prev)
    }, [])

    const handleApplyLink = useCallback(() => {
      if (linkUrl) {
        execFormat('createLink', linkUrl)
      }
      setLinkOpen(false)
      setLinkUrl('')
      notifyChange()
    }, [linkUrl, execFormat, notifyChange])

    const handleCloseLink = useCallback(() => {
      setLinkOpen(false)
    }, [])

    const handleMentionChange = useCallback(
      (q: string) => {
        setMentionQuery(q)
        onMentionQuery?.(q)
      },
      [onMentionQuery],
    )

    return (
      <div
        ref={ref}
        data-slot="rich-text-editor-root"
        className={cn(
          'flex w-full flex-col gap-2 rounded-lg border border-border bg-background p-2',
          className,
        )}
        {...props}
      >
        <div data-slot="rich-text-editor-toolbar">
          <Stack direction="horizontal" gap={2} wrap>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-slot="rich-text-editor-bold"
              onClick={() => execFormat('bold')}
            >
              굵게
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-slot="rich-text-editor-italic"
              onClick={() => execFormat('italic')}
            >
              기울임
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-slot="rich-text-editor-bullet-list"
              onClick={() => execFormat('insertUnorderedList')}
            >
              글머리 기호
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-slot="rich-text-editor-numbered-list"
              onClick={() => execFormat('insertOrderedList')}
            >
              번호 목록
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="rich-text-editor-open-link-editor"
              onClick={handleLinkEditorToggle}
            >
              링크
            </Button>
          </Stack>
        </div>

        {/* contentEditable로 실제 서식 적용 가능 */}
        <div
          ref={editorRef}
          data-slot="rich-text-editor-body"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label="서식 있는 텍스트 본문"
          className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onInput={notifyChange}
        />

        {linkOpen ? (
          <div
            data-slot="rich-text-editor-link-overlay"
            className="flex flex-col gap-2 rounded-md border border-border bg-muted p-2"
            role="region"
            aria-label="링크 편집기"
          >
            <Input
              data-slot="rich-text-editor-link-url"
              value={linkUrl}
              placeholder="https://"
              aria-label="링크 URL"
              onValueChange={setLinkUrl}
            />
            <Stack direction="horizontal" gap={2} wrap>
              <Button
                type="button"
                size="sm"
                variant="primary"
                data-slot="rich-text-editor-apply-link"
                onClick={handleApplyLink}
              >
                링크 적용
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                data-slot="rich-text-editor-close-link"
                onClick={handleCloseLink}
              >
                닫기
              </Button>
            </Stack>
          </div>
        ) : null}

        <Input
          data-slot="rich-text-editor-mention-query"
          value={mentionQuery}
          placeholder="멘션..."
          aria-label="멘션 검색"
          onValueChange={handleMentionChange}
        />
      </div>
    )
  },
)

RichTextEditor.displayName = 'RichTextEditor'

export { RichTextEditor }
