import { cn } from '@/utils/cn'

type FoundationTokenChipProps = {
  /** `--ds-*` 원시 토큰 이름 */
  token: string
  /** Tailwind 유틸리티 (예: `shadow-panel`, `rounded-lg`) */
  utility?: string
  hint?: string
  children: React.ReactNode
  className?: string
}

/** Foundations 스토리 — spacing / radius / shadow 토큰 칩 */
function FoundationTokenChip({
  token,
  utility,
  hint,
  children,
  className,
}: FoundationTokenChipProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border bg-surface p-3',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-medium text-fg">
          {token}
        </span>
        {utility ? (
          <span className="inline-flex rounded-full border border-border-subtle px-2 py-0.5 font-mono text-xs text-fg-muted">
            {utility}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-xs leading-snug text-fg-muted">{hint}</p> : null}
      {children}
    </div>
  )
}

const SPACING_TOKENS = [
  { token: '--ds-spacing-0', utility: '—', hint: '0px' },
  { token: '--ds-spacing-px', utility: '—', hint: '1px' },
  { token: '--ds-spacing-0_5', utility: '—', hint: '2px' },
  { token: '--ds-spacing-1', utility: '—', hint: '4px' },
  { token: '--ds-spacing-1_5', utility: '—', hint: '6px' },
  { token: '--ds-spacing-2', utility: '—', hint: '8px' },
  { token: '--ds-spacing-2_5', utility: '—', hint: '10px' },
  { token: '--ds-spacing-3', utility: '—', hint: '12px' },
  { token: '--ds-spacing-4', utility: '—', hint: '16px' },
  { token: '--ds-spacing-5', utility: '—', hint: '20px' },
  { token: '--ds-spacing-6', utility: '—', hint: '24px' },
  { token: '--ds-spacing-8', utility: '—', hint: '32px' },
  { token: '--ds-spacing-10', utility: '—', hint: '40px' },
  { token: '--ds-spacing-12', utility: '—', hint: '48px' },
  { token: '--ds-spacing-16', utility: '—', hint: '64px' },
  { token: '--ds-spacing-20', utility: '—', hint: '80px' },
  { token: '--ds-spacing-24', utility: '—', hint: '96px' },
] as const

const RADIUS_TOKENS = [
  { token: '--ds-radius-none', utility: 'rounded-none', hint: '0px' },
  { token: '--ds-radius-sm', utility: 'rounded-sm', hint: '4px — micro' },
  { token: '--ds-radius-md', utility: 'rounded-md', hint: '8px — control' },
  { token: '--ds-radius-lg', utility: 'rounded-lg', hint: '12px — card' },
  { token: '--ds-radius-xl', utility: 'rounded-xl', hint: '16px' },
  { token: '--ds-radius-2xl', utility: 'rounded-2xl', hint: '20px — panel' },
  { token: '--ds-radius-full', utility: 'rounded-full', hint: 'pill' },
] as const

const SHADOW_TOKENS = [
  {
    token: '--ds-shadow-float',
    utility: 'shadow-float',
    hint: 'Panel solid compact — Tooltip, Toast, Snackbar',
  },
  {
    token: '--ds-shadow-panel',
    utility: 'shadow-panel',
    hint: 'Panel glass (overlay | list) — Select, Menu, Popover',
  },
  {
    token: '--ds-shadow-dialog',
    utility: 'shadow-dialog',
    hint: 'Panel solid dialog | edge — Modal, Drawer',
  },
] as const

function TokenCatalogGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

export { FoundationTokenChip, RADIUS_TOKENS, SHADOW_TOKENS, SPACING_TOKENS, TokenCatalogGrid }
