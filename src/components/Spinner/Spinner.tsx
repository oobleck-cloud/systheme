import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn'

const spinnerVariants = cva(
  'inline-block animate-spin rounded-full border-2 border-primary border-t-transparent',
  {
    variants: {
      size: {
        sm: 'size-4 border-[0.09375rem]',
        md: 'size-8',
        lg: 'size-10 border-[0.1875rem]',
      },
      active: {
        true: 'opacity-100',
        false: 'pointer-events-none opacity-0',
      },
    },
    defaultVariants: {
      size: 'md',
      active: true,
    },
  },
)

type SpinnerProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof spinnerVariants> & {
    /** anatomy `active` — false 이면 시각적으로 숨기고 스크린리더용 라벨만 유지 */
    active?: boolean
    accessibilityLabel?: string
  }

function Spinner({
  className,
  size,
  active = true,
  accessibilityLabel,
  role = 'status',
  'aria-label': ariaLabel,
  ...props
}: SpinnerProps) {
  const label = ariaLabel ?? accessibilityLabel

  return (
    <span
      role={role}
      aria-label={label}
      aria-hidden={active ? undefined : true}
      className={cn(spinnerVariants({ size, active: active ? true : false }), className)}
      {...props}
    />
  )
}

export { Spinner, spinnerVariants }
export type { SpinnerProps }
