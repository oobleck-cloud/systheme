'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useState } from 'react'

import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

const alertVariants = cva(
  '[&_[data-slot=surface-body]]:flex [&_[data-slot=surface-body]]:gap-3 [&_[data-slot=surface-body]]:px-4 [&_[data-slot=surface-body]]:py-3',
  {
    variants: {
      severity: {
        info: '',
        success: '',
        warning: '',
        danger: '',
        neutral: '',
      },
    },
    defaultVariants: { severity: 'info' },
  },
)

export type AlertSeverity = NonNullable<VariantProps<typeof alertVariants>['severity']>

/* ── severity 아이콘 ─────────────────────────────────────────────────── */

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('mt-0.5 size-4 shrink-0', className)}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5v3M8 5.25v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('mt-0.5 size-4 shrink-0', className)}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 8.5l2 2 4-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('mt-0.5 size-4 shrink-0', className)}>
      <path
        d="M7.13 2.33a1 1 0 0 1 1.74 0l5.5 9.5A1 1 0 0 1 13.5 13.5h-11a1 1 0 0 1-.87-1.67l5.5-9.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M8 6.5v3M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DangerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('mt-0.5 size-4 shrink-0', className)}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

function NeutralIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={cn('mt-0.5 size-4 shrink-0', className)}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5v3M8 5.25v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

const SeverityIconMap: Record<AlertSeverity, typeof InfoIcon> = {
  info: InfoIcon,
  success: SuccessIcon,
  warning: WarningIcon,
  danger: DangerIcon,
  neutral: NeutralIcon,
}

/* ── Alert ───────────────────────────────────────────────────────────── */

type AlertProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> &
  VariantProps<typeof alertVariants> & {
    title?: React.ReactNode
    icon?: React.ReactNode
    dismissible?: boolean
    open?: boolean
    defaultOpen?: boolean
    onDismiss?: () => void
    action?: React.ReactNode
  }

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      severity = 'info',
      title,
      children,
      icon,
      dismissible = false,
      open: openProp,
      defaultOpen = true,
      onDismiss,
      action,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : uncontrolledOpen

    const handleDismiss = () => {
      if (!isControlled) setUncontrolledOpen(false)
      onDismiss?.()
    }

    if (!open) return null

    const IconComponent = SeverityIconMap[severity ?? 'info']

    return (
      <Surface
        ref={ref}
        role="alert"
        kind="section"
        variant="callout"
        calloutSeverity={severity ?? 'info'}
        data-slot="alert-root"
        data-severity={severity}
        className={cn(alertVariants(), className)}
        {...props}
      >
        <span data-slot="alert-icon" aria-hidden>
          {icon ?? <IconComponent />}
        </span>

        <div data-slot="alert-body" className="min-w-0 flex-1">
          {title != null && (
            <p data-slot="alert-title" className="mb-0.5 text-sm font-semibold">
              {title}
            </p>
          )}
          {children != null && (
            <div data-slot="alert-description" className="text-sm">
              {children}
            </div>
          )}
          {action != null && (
            <div data-slot="alert-action" className="mt-2">
              {action}
            </div>
          )}
        </div>

        {dismissible && (
          <button
            type="button"
            aria-label="닫기"
            onClick={handleDismiss}
            data-slot="alert-dismiss"
            className={cn(
              '-mt-0.5 -mr-1 flex shrink-0 items-center justify-center rounded-md p-1',
              'opacity-60 transition-opacity hover:opacity-100',
              'focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none',
            )}
          >
            <CloseIcon />
          </button>
        )}
      </Surface>
    )
  },
)

Alert.displayName = 'Alert'

export { Alert, alertVariants }
export type { AlertProps }
