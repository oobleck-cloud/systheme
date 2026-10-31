'use client'

import { cn } from '@/utils/cn'

function ExternalArrowIcon() {
  return (
    <svg
      aria-hidden
      data-slot="external-link-external-icon"
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7.5M7 1h4m0 0v4M11 1L5.5 6.5" />
    </svg>
  )
}

export type ExternalLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> & {
  /** 표시할 서비스·링크 이름 */
  label: string
}

/**
 * 외부 URL로 이동하는 링크를 칩 형태로 표시한다.
 * `target="_blank"` + `rel="noopener noreferrer"` 가 기본으로 적용된다.
 *
 * @example
 * ```tsx
 * <ExternalLink label="HubSpot CRM" href="https://app.hubspot.com/..." />
 * ```
 */
function ExternalLink({ label, className, ...props }: ExternalLinkProps) {
  return (
    <a
      data-slot="external-link-root"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5',
        'text-xs font-medium text-fg-muted transition-colors',
        'hover:border-border-strong hover:text-fg',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
      {...props}
    >
      <span data-slot="external-link-label">{label}</span>
      <ExternalArrowIcon />
    </a>
  )
}

export { ExternalLink }
