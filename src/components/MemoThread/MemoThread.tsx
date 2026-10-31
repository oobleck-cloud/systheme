'use client'

import { forwardRef, useCallback, useMemo, useState } from 'react'

import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button/Button'
import { Textarea } from '@/components/Textarea'
import { cn } from '@/utils/cn'

export type MemoThreadComment = {
  id: string
  author: string
  timestamp: string
  body: string
  deleted?: boolean
  /** 정렬용 — ISO datetime */
  createdAt?: string
}

export type MemoThreadProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  author: string
  timestamp: string
  body: string
  deleted?: boolean
  comments?: MemoThreadComment[]
  /** 접힘 상태에서 보여줄 최근 댓글 수 (Facebook 패턴 — 시간순, 마지막 N개) */
  previewCount?: number
  defaultExpanded?: boolean
  onSubmitComment?: (comment: string) => void | Promise<void>
  commentPlaceholder?: string
  isSubmitting?: boolean
}

const DEFAULT_PREVIEW = 2

const MemoThread = forwardRef<HTMLDivElement, MemoThreadProps>(
  (
    {
      className,
      author,
      timestamp,
      body,
      deleted = false,
      comments = [],
      previewCount = DEFAULT_PREVIEW,
      defaultExpanded = false,
      onSubmitComment,
      commentPlaceholder = '댓글을 입력하세요…',
      isSubmitting = false,
      ...props
    },
    ref,
  ) => {
    const [expanded, setExpanded] = useState(defaultExpanded)
    const [draft, setDraft] = useState('')
    /**
     * 입력창은 **누를 때 열린다.** 메모마다 펼쳐 두면 카드 하나가 세 배로 커져서, 열 개만 쌓여도
     * 정작 읽어야 할 본문이 화면 밖으로 밀린다. 쓰는 일은 가끔이고 읽는 일이 늘 있다.
     */
    const [composerOpen, setComposerOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const sortedComments = useMemo(
      () =>
        [...comments].sort(
          (a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime(),
        ),
      [comments],
    )

    const totalComments = sortedComments.length
    const canToggle = totalComments > previewCount
    const hiddenCount = canToggle ? totalComments - previewCount : 0

    const visibleComments = useMemo(() => {
      if (expanded || !canToggle) return sortedComments
      return sortedComments.slice(-previewCount)
    }, [sortedComments, expanded, canToggle, previewCount])

    const handleToggle = useCallback(() => {
      setExpanded((prev) => !prev)
    }, [])

    /**
     * 등록은 대개 서버 왕복이라 실패할 수 있다. 거부를 잡지 않으면 두 가지가 같이 나빠진다 —
     * 처리되지 않은 거부가 콘솔로 새고, 화면은 아무 말도 하지 않아 사용자가 등록된 줄 안다.
     *
     * 실패하면 초안을 지우지도 접지도 않는다. 쓴 글이 남아 있어야 다시 누르기만 하면 된다.
     */
    const handleSubmit = useCallback(async () => {
      const trimmed = draft.trim()
      if (!trimmed || !onSubmitComment) return
      try {
        setError(null)
        await onSubmitComment(trimmed)
      } catch (e) {
        setError(e instanceof Error ? e.message : '댓글을 등록하지 못했습니다.')
        return
      }
      setDraft('')
      // 다 쓰고 나면 다시 접는다 — 남겨 두면 방금 단 댓글이 입력창에 가린다.
      setComposerOpen(false)
    }, [draft, onSubmitComment])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleSubmit()
      }
    }

    const canSubmit = draft.trim().length > 0 && !isSubmitting

    return (
      <div
        ref={ref}
        data-slot="memo-thread-root"
        className={cn('flex w-full flex-col gap-3', className)}
        {...props}
      >
        <header data-slot="memo-thread-header" className="flex items-start gap-3">
          <Avatar size="sm" name={author} className="shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span data-slot="memo-thread-author" className="text-sm font-semibold text-fg">
                {author}
              </span>
              <span data-slot="memo-thread-timestamp" className="text-xs text-fg-muted">
                {timestamp}
              </span>
            </div>
            <p
              data-slot="memo-thread-body"
              className={cn(
                'mt-1 whitespace-pre-wrap text-sm',
                deleted ? 'text-fg-muted line-through' : 'text-fg',
              )}
            >
              {deleted ? '삭제된 메모입니다' : body}
            </p>
          </div>
        </header>

        {totalComments > 0 ? (
          <section data-slot="memo-thread-comments" className="flex flex-col gap-2 pl-11">
            {canToggle ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                data-slot="memo-thread-toggle"
                className="h-auto self-start px-0 py-0 text-xs font-semibold text-fg-muted hover:bg-transparent hover:text-primary"
                onClick={handleToggle}
                aria-expanded={expanded}
              >
                {expanded ? '댓글 접기' : `댓글 ${totalComments}개 모두 보기`}
              </Button>
            ) : null}

            <ul data-slot="memo-thread-comment-list" className="flex flex-col gap-3">
              {visibleComments.map((comment) => (
                <li key={comment.id} data-slot="memo-thread-comment" className="flex gap-2">
                  <Avatar size="sm" name={comment.author} className="shrink-0" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span
                        data-slot="memo-thread-comment-author"
                        className="text-xs font-semibold text-fg"
                      >
                        {comment.author}
                      </span>
                      <span
                        data-slot="memo-thread-comment-timestamp"
                        className="text-xs text-fg-muted"
                      >
                        {comment.timestamp}
                      </span>
                    </div>
                    <p
                      data-slot="memo-thread-comment-body"
                      className={cn(
                        'mt-0.5 whitespace-pre-wrap text-xs',
                        comment.deleted ? 'text-fg-muted line-through' : 'text-fg-subtle',
                      )}
                    >
                      {comment.deleted ? '삭제된 댓글입니다' : comment.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {!expanded && hiddenCount > 0 ? (
              <p className="sr-only">
                {hiddenCount}개의 이전 댓글이 숨겨져 있습니다. 모두 보기를 눌러 펼칠 수 있습니다.
              </p>
            ) : null}
          </section>
        ) : null}

        {onSubmitComment && !deleted && !composerOpen ? (
          <div className="border-t border-border pt-2 pl-11">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="memo-thread-compose-open"
              className="-ml-2"
              onClick={() => setComposerOpen(true)}
            >
              댓글 달기
            </Button>
          </div>
        ) : null}

        {onSubmitComment && !deleted && composerOpen ? (
          <div
            data-slot="memo-thread-compose"
            className="flex gap-2 border-t border-border pt-3 pl-11"
          >
            <Avatar size="sm" name="나" className="mt-1 shrink-0" aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Textarea
                data-slot="memo-thread-compose-input"
                size="sm"
                resize="none"
                rows={2}
                value={draft}
                onValueChange={setDraft}
                onKeyDown={handleKeyDown}
                placeholder={commentPlaceholder}
                aria-label="댓글 입력"
                disabled={isSubmitting}
              />
              {error !== null ? (
                <p
                  role="alert"
                  data-slot="memo-thread-compose-error"
                  className="text-xs text-error-text"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-fg-muted">Ctrl + Enter</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    data-slot="memo-thread-compose-cancel"
                    disabled={isSubmitting}
                    onClick={() => {
                      setDraft('')
                      setError(null)
                      setComposerOpen(false)
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    data-slot="memo-thread-compose-submit"
                    disabled={!canSubmit}
                    onClick={() => void handleSubmit()}
                  >
                    {isSubmitting ? '등록 중…' : '댓글 등록'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  },
)

MemoThread.displayName = 'MemoThread'

export { MemoThread }
