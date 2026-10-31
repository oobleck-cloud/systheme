'use client'

import { AnimatePresence, motion } from 'motion/react'

import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { spring } from '@/foundations/motionTokens'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

export type SnackRecord = {
  id: string
  message: string
  open?: boolean
}

export type SnackbarRegionProps = {
  snacks: SnackRecord[]
  onDismiss: (id: string) => void
  onAction?: (id: string) => void
  /** Optional action label per snack; when omitted for a row, action button is hidden */
  actionLabel?: string
  className?: string
}

function CloseIcon() {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function SnackbarRegion({
  snacks,
  onDismiss,
  onAction,
  actionLabel = '실행',
  className,
}: SnackbarRegionProps) {
  const visible = snacks.filter((s) => s.open !== false)

  return (
    <div
      className={cn(
        'pointer-events-none fixed right-0 bottom-0 left-0 z-[70] flex flex-col items-center gap-2 p-4',
        className,
      )}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((snack) => (
          <motion.div
            key={snack.id}
            layout
            className="w-full max-w-lg"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: spring.expressive }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { ...spring.standard, duration: 0.15 },
            }}
          >
            <Panel
              role="status"
              appearance="solid"
              shape="compact"
              position="relative"
              offset="none"
              scrollHint={false}
              className="pointer-events-auto flex w-full items-center gap-3 rounded-lg px-3 py-2.5 shadow-lg"
            >
              <p className="min-w-0 flex-1 text-sm text-fg">{snack.message}</p>
              {onAction ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onAction(snack.id)}
                >
                  {actionLabel}
                </Button>
              ) : null}
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                shape="rounded"
                aria-label="Dismiss"
                className="shrink-0"
                onClick={() => onDismiss(snack.id)}
              >
                <CloseIcon />
              </IconButton>
            </Panel>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export { SnackbarRegion }
