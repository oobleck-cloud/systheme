import { cva } from 'class-variance-authority'

/** Shared list shell + option rhythm for Select / MultiSelect panels */
export const dropdownListShellVariants = cva('overflow-y-auto', {
  variants: {
    density: {
      compact: 'max-h-48 py-0.5',
      default: 'max-h-60 py-1',
      loose: 'max-h-72 py-1.5',
    },
  },
  defaultVariants: { density: 'default' },
})

// Option rows render a full-width `bg-surface` highlight on hover/focus/selection. Inset each row
// with a horizontal margin + matching radius so the highlight is a rounded pill that stays clear of
// the panel's rounded corners — a square edge-to-edge highlight would otherwise poke past them.
export const dropdownOptionDensityVariants = cva('', {
  variants: {
    density: {
      compact: 'mx-1 rounded px-2.5 py-1.5 text-xs',
      default: 'mx-1 rounded-md px-3 py-2 text-sm',
      loose: 'mx-1.5 rounded-lg px-4 py-2.5 text-base',
    },
  },
  defaultVariants: { density: 'default' },
})

export const dropdownSearchPaddingVariants = cva('border-b border-border', {
  variants: {
    density: {
      compact: 'p-1.5',
      default: 'p-2',
      loose: 'p-2.5',
    },
  },
  defaultVariants: { density: 'default' },
})
