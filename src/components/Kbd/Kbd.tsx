import { forwardRef } from 'react'

import { cn } from '@/utils/cn'

type KbdProps = React.HTMLAttributes<HTMLSpanElement> & {
  keys?: string[]
}

/**
 * 키보드 단축키 표시.
 * `keys` prop: 키 배열 — e.g. ['⌘', 'K'] 또는 ['Ctrl', 'Shift', 'P']
 * children: 단일 키 문자열 사용 시 fallback
 */
const Kbd = forwardRef<HTMLSpanElement, KbdProps>(
  ({ className, keys, children, ...props }, ref) => {
    const items =
      keys ??
      (typeof children === 'string' ? children.split('+').map((k) => k.trim()) : [String(children)])

    return (
      <span
        ref={ref}
        data-slot="kbd-root"
        className={cn('inline-flex items-center gap-0.5', className)}
        {...props}
      >
        {items.map((key, i) => (
          <kbd
            key={i}
            data-slot="kbd-key"
            className={cn(
              'inline-flex min-w-[1.375rem] items-center justify-center',
              'rounded border border-border bg-surface px-1.5 py-0.5',
              'font-mono text-xs text-fg-subtle',
              'shadow-[inset_0_-1px_0] shadow-border',
            )}
          >
            {key}
          </kbd>
        ))}
      </span>
    )
  },
)

Kbd.displayName = 'Kbd'

export { Kbd }
export type { KbdProps }
