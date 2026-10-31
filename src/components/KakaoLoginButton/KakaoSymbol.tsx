import { cn } from '@/utils/cn'

type KakaoSymbolProps = {
  className?: string
}

/** 카카오 로그인 버튼 심볼 — 형태·비율·색상 변경 불가(가이드). */
export function KakaoSymbol({ className }: KakaoSymbolProps) {
  return (
    <svg
      data-slot="kakao-login-button-symbol"
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        'size-[var(--ds-kakao-symbol-size)] shrink-0 text-[var(--ds-kakao-symbol-color)]',
        className,
      )}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3C7.03 3 3 6.13 3 10.02c0 2.51 1.68 4.72 4.22 5.96L6.06 20.5l3.24-1.62c.99.27 2.04.41 3.1.41 4.97 0 9-3.13 9-7.02S16.97 3 12 3z"
        fill="currentColor"
      />
    </svg>
  )
}
