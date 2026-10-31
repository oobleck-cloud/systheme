import { cva, type VariantProps } from 'class-variance-authority'

export const boxShapeVariants = cva(
  'inline-flex shrink-0 items-center justify-center overflow-hidden font-medium select-none',
  {
    variants: {
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-lg',
        square: 'rounded-sm',
      },
      size: {
        xs: 'h-6 w-6 text-[0.625rem]',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
      variant: {
        default: 'border border-border bg-surface text-fg',
        primary: 'bg-brand-100 text-primary',
        success: 'bg-success-subtle text-success-text',
        warning: 'bg-warning-subtle text-warning-text',
        error: 'bg-error-subtle text-error-text',
        info: 'bg-info-subtle text-info-text',
        outline: 'border border-border bg-transparent text-fg',
        'outline-primary': 'border border-primary bg-transparent text-primary',
        'outline-success': 'border border-success-border bg-transparent text-success-text',
        'outline-warning': 'border border-warning-border bg-transparent text-warning-text',
        'outline-error': 'border border-error-border bg-transparent text-error-text',
        'outline-info': 'border border-info-border bg-transparent text-info-text',
      },
    },
    defaultVariants: {
      shape: 'circle',
      size: 'md',
      variant: 'default',
    },
  },
)

export type BoxShapeVariants = VariantProps<typeof boxShapeVariants>

export function getInitials(name: string, maxLength = 2): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, maxLength)
}
