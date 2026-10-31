import { cva, type VariantProps } from 'class-variance-authority'

import { surfaceVariants } from '@/primitives/surface'
import { cn } from '@/utils/cn'
import { TYPO_SLOT_DEFAULTS, typoContainer, type WithTypoSlots } from '@/utils/createTypoSlots'

const accentStripeRootVariants = cva(
  cn(
    surfaceVariants({ kind: 'section', variant: 'default' }),
    'flex w-full min-w-0 flex-row overflow-hidden gap-0',
  ),
  {
    variants: {
      density: {
        compact: 'gap-0',
        default: 'gap-0',
        loose: 'gap-0',
      },
    },
    defaultVariants: {
      density: 'default',
    },
  },
)

const accentStripeBarVariants = cva('shrink-0 self-stretch', {
  variants: {
    emphasis: {
      info: 'bg-info-primary',
      success: 'bg-success-primary',
      warning: 'bg-warning-primary',
      error: 'bg-error-primary',
      primary: 'bg-primary',
      neutral: 'bg-border-strong',
    },
    density: {
      compact: 'w-0.5',
      default: 'w-1',
      loose: 'w-1.5',
    },
  },
  defaultVariants: {
    emphasis: 'neutral',
    density: 'default',
  },
})

const accentStripeBodyVariants = cva('min-w-0 flex-1', {
  variants: {
    density: {
      compact: 'px-3 py-3',
      default: 'px-4 py-4',
      loose: 'px-5 py-5',
    },
  },
  defaultVariants: {
    density: 'default',
  },
})

type AccentStripeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof accentStripeRootVariants> &
  VariantProps<typeof accentStripeBarVariants> &
  VariantProps<typeof accentStripeBodyVariants> & {
    /** 제목 문자열 단축 prop. `<AccentStripe.Title>`과 동일합니다. */
    title?: string
    /** 설명 문자열 단축 prop. `<AccentStripe.Description>`과 동일합니다. */
    description?: string
    /** 캡션 문자열 단축 prop. `<AccentStripe.Caption>`과 동일합니다. */
    caption?: string
  }

function AccentStripeRoot({
  className,
  emphasis,
  density,
  children,
  title,
  description,
  caption,
  ...props
}: AccentStripeProps) {
  const synthesized =
    children == null && (title != null || description != null || caption != null) ? (
      <>
        {title != null && (
          <p data-slot="accent-stripe-title" className={TYPO_SLOT_DEFAULTS.Title.className}>
            {title}
          </p>
        )}
        {description != null && (
          <p
            data-slot="accent-stripe-description"
            className={TYPO_SLOT_DEFAULTS.Description.className}
          >
            {description}
          </p>
        )}
        {caption != null && (
          <p data-slot="accent-stripe-caption" className={TYPO_SLOT_DEFAULTS.Caption.className}>
            {caption}
          </p>
        )}
      </>
    ) : null

  return (
    <div className={cn(accentStripeRootVariants({ density }), className)} {...props}>
      <div
        data-slot="accent-stripe-bar"
        aria-hidden
        className={cn(accentStripeBarVariants({ emphasis, density }))}
      />
      <div data-slot="accent-stripe-body" className={cn(accentStripeBodyVariants({ density }))}>
        {synthesized ?? children}
      </div>
    </div>
  )
}

// ── Compound slots (typoContainer = root + slot map + WithTypoSlots typing) ───

type AccentStripeSlots = 'Title' | 'Description' | 'Caption'

const AccentStripe: typeof AccentStripeRoot & WithTypoSlots<AccentStripeSlots> = typoContainer(
  AccentStripeRoot,
  ['Title', 'Description', 'Caption'] as const,
)

export { AccentStripe, accentStripeRootVariants, accentStripeBarVariants, accentStripeBodyVariants }
export type { AccentStripeProps }
