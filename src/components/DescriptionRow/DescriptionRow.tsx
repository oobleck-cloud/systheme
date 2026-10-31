'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { IconButton } from '@/components/IconButton'
import { Copy, createIconElement } from '@/icons'
import { cn } from '@/utils/cn'

const descriptionRowVariants = cva('grid w-full min-w-0 items-center gap-x-3 gap-y-1', {
  variants: {
    density: {
      compact: 'text-xs',
      default: 'text-sm',
      loose: 'text-base',
    },
    columns: {
      fixed: 'grid-cols-[minmax(6rem,10rem)_minmax(0,1fr)_auto]',
      fluid: 'grid-cols-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto]',
    },
  },
  defaultVariants: {
    density: 'default',
    columns: 'fluid',
  },
})

type DescriptionRowProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof descriptionRowVariants> & {
    label: React.ReactNode
    value: React.ReactNode
    /** Slot: custom copy control; if omitted and `onCopy` is set, a default copy icon button is shown */
    copy?: React.ReactNode
    onCopy?: () => void
    copyButtonLabel?: string
  }

const DescriptionRow = forwardRef<HTMLDivElement, DescriptionRowProps>(
  (
    {
      className,
      density,
      columns,
      label,
      value,
      copy,
      onCopy,
      copyButtonLabel = 'Copy value',
      ...props
    },
    ref,
  ) => {
    const showDefaultCopy = copy == null && typeof onCopy === 'function'
    const hasCopySlot = copy != null || showDefaultCopy

    return (
      <div
        ref={ref}
        className={cn(
          descriptionRowVariants({ density, columns }),
          !hasCopySlot &&
            (columns === 'fixed'
              ? 'grid-cols-[minmax(6rem,10rem)_minmax(0,1fr)]'
              : 'sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)]'),
          className,
        )}
        {...props}
      >
        <div className="min-w-0 font-medium text-fg-subtle" data-part="label">
          {label}
        </div>
        <div className="min-w-0 text-fg tabular-nums" data-part="value">
          {value}
        </div>
        {hasCopySlot ? (
          <div className="flex shrink-0 justify-end" data-part="copy">
            {copy ??
              (showDefaultCopy ? (
                <IconButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  shape="rounded"
                  aria-label={copyButtonLabel}
                  onClick={onCopy}
                >
                  <CopyGlyph />
                </IconButton>
              ) : null)}
          </div>
        ) : null}
      </div>
    )
  },
)

DescriptionRow.displayName = 'DescriptionRow'

function CopyGlyph() {
  return createIconElement(Copy, 'md')
}

export { DescriptionRow, descriptionRowVariants }
export type { DescriptionRowProps }
