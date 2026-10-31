'use client'

import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

export const workspaceTabRowShellVariants = cva(
  'group/tab-shell relative flex shrink-0 items-center gap-1 my-1 mx-px rounded-md transition-colors duration-150',
  {
    variants: {
      selected: {
        true: ['bg-secondary text-fg'],
        false: ['text-fg-muted', 'hover:bg-secondary/60 hover:text-fg'],
      },
      density: {
        compact: 'min-h-6 px-2 py-px',
        default: 'min-h-7 px-2.5 py-0.5',
        loose: 'min-h-8 px-3 py-0.5',
      },
    },
    defaultVariants: { selected: false, density: 'default' },
  },
)

export type WorkspaceTabRowShellProps = VariantProps<typeof workspaceTabRowShellVariants> & {
  children: React.ReactNode
  className?: string
  fixedWidth?: number
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>

export function WorkspaceTabRowShell({
  selected,
  density,
  fixedWidth,
  className,
  style,
  children,
  ...props
}: WorkspaceTabRowShellProps) {
  const fixedStyle =
    fixedWidth != null
      ? ({ '--ws-tab-w': `${fixedWidth}px`, ...style } as React.CSSProperties)
      : style

  return (
    <div
      data-slot="workspace-tab-row-shell-root"
      className={cn(
        workspaceTabRowShellVariants({
          selected,
          density,
        }),
        fixedWidth != null && 'w-[var(--ws-tab-w)]',
        className,
      )}
      // eslint-disable-next-line design-system/no-inline-style
      style={fixedStyle}
      {...props}
    >
      {children}
    </div>
  )
}
