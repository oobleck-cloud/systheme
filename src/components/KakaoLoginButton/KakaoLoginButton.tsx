'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { KakaoSymbol } from './KakaoSymbol'

import { cn } from '@/utils/cn'

const KAKAO_LABELS = {
  ko: { full: '카카오 로그인', short: '로그인' },
  en: { full: 'Login with Kakao', short: 'Login' },
} as const

const kakaoLoginButtonVariants = cva(
  [
    'inline-flex items-center',
    'h-[var(--ds-kakao-height)] rounded-[var(--ds-kakao-radius)]',
    'bg-[var(--ds-kakao-container-bg)] text-[length:var(--ds-kakao-font-size)]',
    'font-[family-name:var(--ds-font-system)] font-[weight:var(--ds-font-weight-regular)]',
    'text-[var(--ds-kakao-label-color)]',
    'transition-opacity hover:opacity-90',
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
    'focus-visible:ring-ring focus-visible:ring-offset-surface',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      block: {
        true: 'w-full',
        false: 'min-w-[var(--ds-kakao-height)] px-4',
      },
      align: {
        center: 'justify-center gap-[var(--ds-kakao-gap)]',
        start: 'justify-start gap-[var(--ds-kakao-gap)] px-4',
      },
      labelVariant: {
        full: '',
        short: '',
      },
      locale: {
        ko: '',
        en: '',
      },
    },
    defaultVariants: {
      block: true,
      align: 'center',
      labelVariant: 'full',
      locale: 'ko',
    },
  },
)

type KakaoLoginButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof kakaoLoginButtonVariants> & {
    /** 레이블을 직접 지정할 때 사용. 미지정 시 locale·labelVariant 조합 사용 */
    label?: string
  }

const KakaoLoginButton = forwardRef<HTMLButtonElement, KakaoLoginButtonProps>(
  (
    {
      className,
      block,
      align,
      labelVariant = 'full',
      locale = 'ko',
      label,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) => {
    const resolvedLocale = locale ?? 'ko'
    const resolvedVariant = labelVariant ?? 'full'
    const resolvedLabel =
      label ?? KAKAO_LABELS[resolvedLocale][resolvedVariant === 'short' ? 'short' : 'full']

    return (
      <button
        ref={ref}
        type={type}
        data-slot="kakao-login-button-root"
        className={cn(
          kakaoLoginButtonVariants({
            block,
            align,
            labelVariant: resolvedVariant,
            locale: resolvedLocale,
          }),
          className,
        )}
        aria-label={props['aria-label'] ?? resolvedLabel}
        {...props}
      >
        <KakaoSymbol />
        <span data-slot="kakao-login-button-label">{children ?? resolvedLabel}</span>
      </button>
    )
  },
)

KakaoLoginButton.displayName = 'KakaoLoginButton'

export { KakaoLoginButton, kakaoLoginButtonVariants, KAKAO_LABELS }
export type { KakaoLoginButtonProps }
