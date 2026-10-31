'use client'

import { motion } from 'motion/react'
import { forwardRef } from 'react'

import { spring } from '@/foundations/motionTokens'
import { cn } from '@/utils/cn'

type OverlayScrimProps = React.ComponentPropsWithoutRef<typeof motion.button> & {
  /** Accessible label for dismiss button scrim */
  dismissLabel?: string
}

/** `backdrop-blur-sm` 과 동일한 4px */
const SCRIM_BLUR_PX = 4

/**
 * Modal/Drawer/Lightbox dimmer — orchestration layer, not box language.
 * Box language for dialog chrome is Panel(solid) + Surface(section).
 *
 * blur "팝인" 방지를 위해 두 레이어로 분리해 스스로 enter/exit 한다:
 *  - **blur 레이어**: opacity를 건드리지 않고 `backdrop-filter` 의 blur 값을 0→4px 로 직접 램프.
 *    (조상 opacity<1 이면 backdrop-filter 가 렌더되지 않다가 1이 되는 순간 튀어 들어오는 문제 회피)
 *  - **dim 레이어**(클릭 대상): 단색이라 opacity 페이드가 안전. blur 와 동일한 `spring.standard`
 *    로 같은 기울기를 그려, dim 과 blur 가 처음부터 함께 들어온다.
 */
const OverlayScrim = forwardRef<HTMLButtonElement, OverlayScrimProps>(
  ({ className, dismissLabel = '닫기', type = 'button', ...props }, ref) => (
    <>
      <motion.div
        aria-hidden
        data-slot="overlay-scrim-blur"
        className="pointer-events-none absolute inset-0"
        initial={{ backdropFilter: 'blur(0px)' }}
        animate={{ backdropFilter: `blur(${SCRIM_BLUR_PX}px)`, transition: spring.standard }}
        exit={{ backdropFilter: 'blur(0px)', transition: spring.standard }}
      />
      <motion.button
        ref={ref}
        type={type}
        data-slot="overlay-scrim-root"
        aria-label={dismissLabel}
        className={cn('absolute inset-0 bg-scrim', className)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: spring.standard }}
        exit={{ opacity: 0, transition: spring.standard }}
        {...props}
      />
    </>
  ),
)

OverlayScrim.displayName = 'OverlayScrim'

export { OverlayScrim }
export type { OverlayScrimProps }
