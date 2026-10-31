'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { Box } from './box'

import { cn } from '@/utils/cn'

/** 커서 앵커 패널과 포인터 사이 간격(px) */
export const PANEL_ANCHOR_GAP_PX = 6

/** 서피스(콤보박스·검색) 앵커 — focus ring 아래 여유 */
export const PANEL_SURFACE_ANCHOR_GAP_PX = 8

const panelVariants = cva('z-50', {
  variants: {
    appearance: {
      glass: '',
      solid: 'border border-border bg-background',
    },
    shape: {
      overlay: 'rounded-2xl',
      list: 'rounded-md',
      compact: 'max-w-xs rounded-md px-2 py-1.5 text-xs',
      dialog:
        'flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border-border-subtle outline-none',
      'edge-left':
        'fixed inset-y-0 left-0 h-full w-full max-w-md border-r border-border-subtle outline-none',
      'edge-right':
        'fixed inset-y-0 right-0 h-full w-full max-w-md border-l border-border-subtle outline-none',
      'edge-top':
        'fixed inset-x-0 top-0 max-h-[85vh] w-full border-b border-border-subtle outline-none',
      'edge-bottom':
        'fixed inset-x-0 bottom-0 max-h-[85vh] w-full border-t border-border-subtle outline-none',
    },
    position: {
      static: 'static',
      relative: 'relative',
      absolute: 'absolute',
      fixed: 'fixed',
    },
    offset: {
      anchored: 'mt-2',
      none: '',
    },
  },
  compoundVariants: [
    {
      appearance: 'glass',
      shape: 'overlay',
      class:
        'shadow-panel backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/70',
    },
    {
      appearance: 'glass',
      shape: 'list',
      class:
        'shadow-panel backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/70',
    },
    // compact = 팝오버·드롭다운. 떠 있는 면은 bg-float(다크에서 카드보다 한 단 밝다).
    { appearance: 'solid', shape: 'compact', class: 'bg-float shadow-float text-fg' },
    { appearance: 'solid', shape: 'dialog', class: 'shadow-dialog' },
    {
      appearance: 'solid',
      shape: 'edge-left',
      class: 'shadow-dialog flex flex-col overflow-hidden',
    },
    {
      appearance: 'solid',
      shape: 'edge-right',
      class: 'shadow-dialog flex flex-col overflow-hidden',
    },
    {
      appearance: 'solid',
      shape: 'edge-top',
      class: 'shadow-dialog flex flex-col overflow-hidden',
    },
    {
      appearance: 'solid',
      shape: 'edge-bottom',
      class: 'shadow-dialog flex flex-col overflow-hidden',
    },
    { appearance: 'solid', shape: 'overlay', class: 'shadow-panel' },
    { appearance: 'solid', shape: 'list', class: 'shadow-panel' },
  ],
  defaultVariants: {
    appearance: 'glass',
    shape: 'overlay',
    position: 'absolute',
    offset: 'anchored',
  },
})

function resolvePanelVariants(props: {
  variant?: 'overlay' | 'list' | null
  appearance?: 'glass' | 'solid' | null
  shape?: VariantProps<typeof panelVariants>['shape']
}) {
  if (props.appearance != null || (props.shape != null && props.shape !== 'overlay')) {
    return {
      appearance: props.appearance ?? 'glass',
      shape: props.shape ?? 'overlay',
    }
  }
  if (props.variant === 'list') {
    return { appearance: 'glass' as const, shape: 'list' as const }
  }
  return { appearance: 'glass' as const, shape: 'overlay' as const }
}

type PanelProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof panelVariants> & {
    /** @deprecated Use appearance + shape */
    variant?: 'overlay' | 'list'
    scrollHint?: boolean
  }

const Panel = forwardRef<HTMLDivElement, PanelProps>(
  (
    { className, variant, appearance, shape, position, offset, scrollHint, children, ...props },
    ref,
  ) => {
    const resolved = resolvePanelVariants({ variant, appearance, shape })
    const isGlass = resolved.appearance === 'glass'
    const hintTone = isGlass ? 'frosted' : 'solid'
    const hintClass =
      resolved.shape === 'list' || resolved.shape === 'compact'
        ? 'rounded-b-md'
        : resolved.shape === 'dialog'
          ? 'rounded-b-xl'
          : 'rounded-b-2xl'
    const defaultScrollHint =
      scrollHint !== undefined
        ? scrollHint
        : !(
            resolved.appearance === 'solid' &&
            (resolved.shape === 'compact' ||
              resolved.shape === 'dialog' ||
              (resolved.shape != null && resolved.shape.startsWith('edge')))
          )

    return (
      <Box
        ref={ref}
        scrollHint={defaultScrollHint}
        scrollHintTone={hintTone}
        scrollHintClassName={hintClass}
        data-slot="panel-root"
        data-panel-appearance={resolved.appearance}
        data-panel-shape={resolved.shape}
        className={cn(
          panelVariants({
            appearance: resolved.appearance,
            shape: resolved.shape,
            position,
            offset,
          }),
          className,
        )}
        {...props}
      >
        {children}
      </Box>
    )
  },
)

Panel.displayName = 'Panel'

/** @deprecated — use panelVariants appearance=solid shape=edge-* */
const drawerPanelVariants = cva('fixed z-[60]', {
  variants: {
    side: {
      left: '',
      right: '',
      top: '',
      bottom: '',
    },
  },
  compoundVariants: [
    {
      side: 'left',
      class: panelVariants({
        appearance: 'solid',
        shape: 'edge-left',
        position: 'fixed',
        offset: 'none',
      }),
    },
    {
      side: 'right',
      class: panelVariants({
        appearance: 'solid',
        shape: 'edge-right',
        position: 'fixed',
        offset: 'none',
      }),
    },
    {
      side: 'top',
      class: panelVariants({
        appearance: 'solid',
        shape: 'edge-top',
        position: 'fixed',
        offset: 'none',
      }),
    },
    {
      side: 'bottom',
      class: panelVariants({
        appearance: 'solid',
        shape: 'edge-bottom',
        position: 'fixed',
        offset: 'none',
      }),
    },
  ],
})

export { Panel, drawerPanelVariants, panelVariants, resolvePanelVariants }
export type { PanelProps }
