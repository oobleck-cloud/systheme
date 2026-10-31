'use client'

import { forwardRef, useCallback, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { Textarea } from '@/components/Textarea'
import { cn } from '@/utils/cn'

export type ThreadMessageViewModel = {
  id: string
  author: string
  timestamp: string
  body: string
}

export type CommentThreadPanelProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** 표시할 메시지 목록. 기본값: [] */
  messages?: ThreadMessageViewModel[]
  onReply?: (messageId: string) => void
  onLoadMore?: () => void
  /**
   * 댓글 작성 완료 시 호출됩니다.
   * 답글(특정 메시지에 대한 회신)인 경우 `context.replyToMessageId`로 대상 메시지를 식별합니다.
   * 최상위 댓글이면 `context`는 생략됩니다.
   */
  onSubmit?: (comment: string, context?: { replyToMessageId: string }) => void
}

const PAGE_SIZE = 3

const CommentThreadPanel = forwardRef<HTMLDivElement, CommentThreadPanelProps>(
  ({ className, messages = [], onReply, onLoadMore, onSubmit, ...props }, ref) => {
    const [draft, setDraft] = useState('')
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [replyTargetId, setReplyTargetId] = useState<string | null>(null)
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

    const visibleMessages = messages.slice(0, visibleCount)
    const hasMore = visibleCount < messages.length || !!onLoadMore

    const handleReply = useCallback(
      (id: string) => {
        setReplyTargetId((prev) => (prev === id ? null : id))
        onReply?.(id)
      },
      [onReply],
    )

    const handleLoadMore = useCallback(() => {
      if (visibleCount < messages.length) {
        setVisibleCount((prev) => prev + PAGE_SIZE)
      }
      onLoadMore?.()
    }, [visibleCount, messages.length, onLoadMore])

    const handleSubmit = useCallback(() => {
      const trimmed = draft.trim()
      if (!trimmed) return
      onSubmit?.(trimmed)
      setDraft('')
    }, [draft, onSubmit])

    const handleComposeKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          handleSubmit()
        }
      },
      [handleSubmit],
    )

    const handleReplySubmit = useCallback(
      (messageId: string) => {
        const text = replyDrafts[messageId]?.trim()
        if (!text) return
        onSubmit?.(text, { replyToMessageId: messageId })
        setReplyDrafts((prev) => ({ ...prev, [messageId]: '' }))
        setReplyTargetId(null)
      },
      [replyDrafts, onSubmit],
    )

    const handleReplyKeyDown = useCallback(
      (messageId: string, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setReplyTargetId(null)
          return
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault()
          handleReplySubmit(messageId)
        }
      },
      [handleReplySubmit],
    )

    return (
      <div
        ref={ref}
        data-slot="comment-thread-panel-root"
        className={cn('flex w-full flex-col gap-0', className)}
        {...props}
      >
        <div data-slot="comment-thread-panel-feed" className="flex flex-col">
          {visibleMessages.map((m) => (
            <div
              key={m.id}
              data-slot="comment-thread-panel-bubble"
              className="flex gap-3 border-b border-border px-1 py-3 last:border-b-0"
            >
              <div
                data-slot="comment-thread-panel-avatar-slot"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-fg-muted"
              >
                —
              </div>
              <div className="min-w-0 flex-1">
                <Stack direction="horizontal" align="baseline" gap={2} wrap>
                  <span
                    data-slot="comment-thread-panel-author"
                    className="text-sm font-semibold text-fg"
                  >
                    {m.author}
                  </span>
                  <span
                    data-slot="comment-thread-panel-timestamp"
                    className="text-xs text-fg-muted"
                  >
                    {m.timestamp}
                  </span>
                </Stack>
                <p data-slot="comment-thread-panel-body" className="mt-1 text-sm text-fg">
                  {m.body}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-1"
                  data-slot="comment-thread-panel-reply"
                  onClick={() => handleReply(m.id)}
                >
                  {replyTargetId === m.id ? '취소' : '답글'}
                </Button>

                {/* 인라인 답글 입력 UI */}
                {replyTargetId === m.id && (
                  <div
                    data-slot="comment-thread-panel-reply-area"
                    className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3"
                  >
                    <Textarea
                      data-slot="comment-thread-panel-reply-input"
                      value={replyDrafts[m.id] ?? ''}
                      onValueChange={(v) => setReplyDrafts((prev) => ({ ...prev, [m.id]: v }))}
                      placeholder="답글을 입력하세요..."
                      size="sm"
                      aria-label="답글 입력"
                      onKeyDown={(e) => handleReplyKeyDown(m.id, e)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      data-slot="comment-thread-panel-reply-submit"
                      disabled={!replyDrafts[m.id]?.trim()}
                      onClick={() => handleReplySubmit(m.id)}
                    >
                      작성
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2 self-start"
            data-slot="comment-thread-panel-load-more"
            onClick={handleLoadMore}
          >
            더보기
          </Button>
        )}

        {/* Compose area */}
        <div
          data-slot="comment-thread-panel-compose"
          className="mt-2 flex flex-col gap-2 border-t border-border pt-2"
        >
          <Textarea
            data-slot="comment-thread-panel-compose-input"
            value={draft}
            onValueChange={setDraft}
            placeholder="댓글을 입력하세요..."
            size="sm"
            aria-label="댓글 입력"
            onKeyDown={handleComposeKeyDown}
          />
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-slot="comment-thread-panel-compose-submit"
            disabled={!draft.trim()}
            onClick={handleSubmit}
          >
            작성
          </Button>
        </div>
      </div>
    )
  },
)

CommentThreadPanel.displayName = 'CommentThreadPanel'

export { CommentThreadPanel }
