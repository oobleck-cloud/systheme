'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { AnimatePresence, motion } from 'motion/react'

import { IconButton } from '@/components/IconButton'
import { spring } from '@/foundations/motionTokens'
import { Panel } from '@/primitives/panel'
import { cn } from '@/utils/cn'

export type ToastSeverity = 'info' | 'success' | 'warning' | 'danger' | 'neutral'

export type ToastRecord = {
  id: string
  severity: ToastSeverity
  title: string
  description?: string
  /** When `false`, the item is hidden (controlled lifecycle). */
  open?: boolean
}

const toastBarVariants = cva('border-l-4', {
  variants: {
    severity: {
      info: 'border-l-info-primary bg-background',
      success: 'border-l-success-primary bg-background',
      warning: 'border-l-warning-primary bg-background',
      danger: 'border-l-error-primary bg-background',
      neutral: 'border-l-border-strong bg-background',
    },
  },
  defaultVariants: { severity: 'neutral' },
})

const severityDotVariants = cva('mt-0.5 h-2 w-2 shrink-0 rounded-full', {
  variants: {
    severity: {
      info: 'bg-info-primary',
      success: 'bg-success-primary',
      warning: 'bg-warning-primary',
      danger: 'bg-error-primary',
      neutral: 'bg-fg-muted',
    },
  },
  defaultVariants: { severity: 'neutral' },
})

const regionPositionVariants = cva(
  'pointer-events-none fixed z-[70] flex max-w-sm flex-col gap-2 p-4',
  {
    variants: {
      position: {
        'top-right': 'top-0 right-0 items-end',
        'top-left': 'top-0 left-0 items-start',
        'bottom-right': 'right-0 bottom-0 items-end',
        'bottom-left': 'bottom-0 left-0 items-start',
      },
    },
    defaultVariants: { position: 'bottom-right' },
  },
)

export type ToastRegionProps = {
  toasts: ToastRecord[]
  onDismiss: (id: string) => void
  className?: string
} & VariantProps<typeof regionPositionVariants>

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

function ToastRegion({ toasts, onDismiss, className, position }: ToastRegionProps) {
  const visible = toasts.filter((t) => t.open !== false)

  return (
    <div
      className={cn(regionPositionVariants({ position }), className)}
      aria-live="polite"
      aria-relevant="additions text"
    >
      {/* mode="popLayout": 퇴장 아이템이 차지하던 공간을 즉시 확보해 나머지가 부드럽게 이동 */}
      <AnimatePresence mode="popLayout">
        {visible.map((toast) => (
          <motion.div
            key={toast.id}
            layout
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
              className={cn(
                toastBarVariants({ severity: toast.severity }),
                'pointer-events-auto flex w-full gap-3 rounded-lg border-border-subtle p-3',
              )}
            >
              <span className={severityDotVariants({ severity: toast.severity })} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-fg-muted">{toast.description}</p>
                ) : null}
              </div>
              <IconButton
                type="button"
                variant="ghost"
                size="xs"
                shape="rounded"
                aria-label="Dismiss notification"
                className="shrink-0 self-start"
                onClick={() => onDismiss(toast.id)}
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

export { ToastRegion, toastBarVariants, severityDotVariants, regionPositionVariants }
