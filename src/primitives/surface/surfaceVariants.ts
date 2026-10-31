import { cva, type VariantProps } from 'class-variance-authority'

const fieldControlDisabled = [
  'disabled:cursor-not-allowed disabled:bg-disabled-subtle disabled:text-disabled-text disabled:border-disabled-border disabled:hover:border-disabled-border',
] as const

const fieldControlVariantTone = {
  default: 'border-border hover:border-border-strong focus-visible:ring-ring',
  error: 'border-error-border hover:border-error-primary focus-visible:ring-error-primary',
  success: 'border-success-border hover:border-success-primary focus-visible:ring-success-primary',
} as const

const fieldControlVariantTonePeer = {
  default: 'border-border hover:border-border-strong peer-focus-visible:ring-ring',
  error: 'border-error-border hover:border-error-primary peer-focus-visible:ring-error-primary',
  success:
    'border-success-border hover:border-success-primary peer-focus-visible:ring-success-primary',
} as const

/** 부착 section/card — header/body/footer 슬롯 */
const surfaceVariants = cva('text-fg', {
  variants: {
    kind: {
      /** flex-col은 `<Surface>` 컴포넌트에서만 — chrome 문자열을 PanelNavBar 등에 재사용할 때 row 레이아웃 유지 */
      section: 'overflow-hidden rounded-lg border border-border',
      connected:
        'inline-flex w-full min-w-0 items-stretch overflow-hidden rounded-md border border-border bg-background transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background has-[[aria-invalid=true]]:border-error-border has-[[aria-invalid=true]]:ring-2 has-[[aria-invalid=true]]:ring-error-primary',
      control: '',
    },
    variant: {
      default: 'bg-background',
      /** recessed well — 흰 카드 내부의 중첩 그룹(통계 박스 등). border 없이 눌린 면으로 구분 */
      subtle: 'bg-surface',
      /** raised — recessed 캔버스 위에 떠 있는 흰 카드/패널. shadow 로 고도 표현 */
      raised: 'bg-background shadow-sm',
      inverse: 'border-white/15 bg-inverse text-fg-inverse',
      callout: '',
    },
    density: {
      compact: '',
      default: '',
      loose: '',
    },
    connectedSize: {
      sm: 'min-h-8',
      md: 'min-h-10',
      lg: 'min-h-12',
    },
    calloutSeverity: {
      info: 'border-info-border bg-info-subtle text-info-text',
      success: 'border-success-border bg-success-subtle text-success-text',
      warning: 'border-warning-border bg-warning-subtle text-warning-text',
      danger: 'border-error-border bg-error-subtle text-error-text',
      neutral: 'border-border bg-surface text-fg',
    },
  },
  compoundVariants: [
    {
      kind: 'section',
      density: 'compact',
      class:
        '[&_[data-slot=surface-body]]:px-3 [&_[data-slot=surface-body]]:py-3 [&_[data-slot=surface-footer]]:px-3 [&_[data-slot=surface-footer]]:py-2 [&_[data-slot=surface-header]]:px-3 [&_[data-slot=surface-header]]:py-2',
    },
    {
      kind: 'section',
      density: 'default',
      class:
        '[&_[data-slot=surface-body]]:px-4 [&_[data-slot=surface-body]]:py-4 [&_[data-slot=surface-footer]]:px-4 [&_[data-slot=surface-footer]]:py-3 [&_[data-slot=surface-header]]:px-4 [&_[data-slot=surface-header]]:py-3',
    },
    {
      kind: 'section',
      density: 'loose',
      class:
        '[&_[data-slot=surface-body]]:px-5 [&_[data-slot=surface-body]]:py-5 [&_[data-slot=surface-footer]]:px-5 [&_[data-slot=surface-footer]]:py-4 [&_[data-slot=surface-header]]:px-5 [&_[data-slot=surface-header]]:py-4',
    },
    {
      kind: 'section',
      variant: 'inverse',
      class:
        '[&_[data-slot=surface-footer]]:border-white/10 [&_[data-slot=surface-header]]:border-white/10',
    },
    { kind: 'connected', variant: 'default', class: 'bg-background' },
    { kind: 'connected', connectedSize: 'sm', class: 'min-h-8' },
    { kind: 'connected', connectedSize: 'md', class: 'min-h-10' },
    { kind: 'connected', connectedSize: 'lg', class: 'min-h-12' },
    { kind: 'section', variant: 'callout', class: 'rounded-lg border' },
    {
      kind: 'section',
      variant: 'callout',
      calloutSeverity: 'info',
      class: 'border-info-border bg-info-subtle text-info-text',
    },
    {
      kind: 'section',
      variant: 'callout',
      calloutSeverity: 'success',
      class: 'border-success-border bg-success-subtle text-success-text',
    },
    {
      kind: 'section',
      variant: 'callout',
      calloutSeverity: 'warning',
      class: 'border-warning-border bg-warning-subtle text-warning-text',
    },
    {
      kind: 'section',
      variant: 'callout',
      calloutSeverity: 'danger',
      class: 'border-error-border bg-error-subtle text-error-text',
    },
    {
      kind: 'section',
      variant: 'callout',
      calloutSeverity: 'neutral',
      class: 'border-border bg-surface text-fg',
    },
  ],
  defaultVariants: {
    kind: 'section',
    variant: 'default',
    density: 'default',
    connectedSize: 'md',
    calloutSeverity: 'neutral',
  },
})

/**
 * Input · Select 트리거 등 — native element에 직접 적용.
 * @deprecated `inputVariants` — 동일 alias 유지
 */
const surfaceControlVariants = cva(
  [
    'w-full border bg-background text-fg transition-colors outline-none',
    'placeholder:text-fg-muted',
    'focus-visible:ring-2 focus-visible:ring-offset-1',
    ...fieldControlDisabled,
    'read-only:bg-surface read-only:focus-visible:ring-0 read-only:focus-visible:ring-offset-0',
  ],
  {
    variants: {
      variant: fieldControlVariantTone,
      size: {
        sm: 'h-density-sm px-density-sm rounded-md text-xs',
        md: 'h-density-md px-density-md rounded-lg text-sm',
        lg: 'h-density-lg px-density-lg rounded-xl text-md',
      },
      /**
       * 필드 크롬(테두리/배경).
       * - `solid`(기본): 테두리 있는 입력 박스 — 기존 동작 그대로.
       * - `ghost`: 테두리·배경 없는 인라인 편집(노션식 표 셀/제목 인라인 편집). 평소 투명,
       *   hover 시 옅은 surface, focus 시 얇은 링+배경. tone(default/error/success)과 직교.
       */
      chrome: {
        solid: '',
        ghost:
          'border-transparent bg-transparent shadow-none hover:border-transparent hover:bg-surface focus-visible:border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-offset-0 read-only:bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      chrome: 'solid',
    },
  },
)

/** @deprecated `checkboxControlFrameVariants` — 동일 alias 유지 */
const surfaceCheckboxFrameVariants = cva(
  [
    'border bg-background text-fg transition-colors outline-none',
    'relative inline-flex shrink-0 items-center justify-center',
    'peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1',
    'peer-disabled:cursor-not-allowed peer-disabled:border-disabled-border peer-disabled:bg-disabled-subtle peer-disabled:text-disabled-text peer-disabled:hover:border-disabled-border',
    'peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-fg',
    'peer-indeterminate:border-primary peer-indeterminate:bg-primary peer-indeterminate:text-primary-fg',
  ],
  {
    variants: {
      variant: fieldControlVariantTonePeer,
      size: {
        sm: 'size-4 rounded-sm',
        md: 'size-5 rounded-sm',
        lg: 'size-6 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

const surfaceConnectedSegmentVariants = cva('flex min-w-0 items-stretch bg-transparent', {
  variants: {
    flex: {
      grow: 'min-w-0 flex-1',
      shrink: 'shrink-0',
      none: '',
    },
    density: {
      compact: 'gap-0.5',
      default: 'gap-1',
      loose: 'gap-1.5',
    },
  },
  defaultVariants: {
    flex: 'none',
    density: 'default',
  },
})

const surfaceConnectedDividerVariants = cva('shrink-0 self-stretch border-border bg-transparent', {
  variants: {
    orientation: {
      horizontal: 'border-s',
      vertical: 'w-full border-t',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
})

/** @deprecated ConnectedBox — surfaceConnected* 사용 */
const connectedBoxVariants = surfaceVariants
const connectedBoxSegmentVariants = surfaceConnectedSegmentVariants
const connectedBoxDividerVariants = surfaceConnectedDividerVariants

export {
  connectedBoxDividerVariants,
  connectedBoxSegmentVariants,
  connectedBoxVariants,
  surfaceCheckboxFrameVariants,
  surfaceConnectedDividerVariants,
  surfaceConnectedSegmentVariants,
  surfaceControlVariants,
  surfaceVariants,
}

export type SurfaceCheckboxFrameVariantProps = VariantProps<typeof surfaceCheckboxFrameVariants>
export type SurfaceControlVariantProps = VariantProps<typeof surfaceControlVariants>
export type SurfaceVariantProps = VariantProps<typeof surfaceVariants>

/** @deprecated inputVariants */
export const inputVariants = surfaceControlVariants

/** @deprecated checkboxControlFrameVariants */
export const checkboxControlFrameVariants = surfaceCheckboxFrameVariants

export type CheckboxControlFrameVariantProps = SurfaceCheckboxFrameVariantProps
