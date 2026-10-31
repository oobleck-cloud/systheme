'use client'

import { forwardRef } from 'react'

import { cn } from '@/utils/cn'
import { pressScale } from '@/utils/interactionUtils'

const fabColorClass = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover focus-visible:ring-primary',
  tonal:
    'bg-primary-container text-on-primary-container hover:bg-primary-container-hover focus-visible:ring-primary',
} as const

export type FabProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** 라벨이 있으면 extended FAB, 없으면 아이콘 전용 */
  label?: React.ReactNode
  icon?: React.ReactNode
  color?: keyof typeof fabColorClass
}

/**
 * Floating Action Button — 화면 레벨의 hero 액션(M3: corner large 16 = rounded-xl).
 * primary FAB 은 화면당 1개(강조 규율 E1). 배치는 셸 몫: 홈 = 하단 내비 위,
 * 플로우 화면 = CTA 존 위 우측(콘텐츠 흐름 안에서 h-0 앵커로 맥락 배치).
 */
const Fab = forwardRef<HTMLButtonElement, FabProps>(
  ({ label, icon, color = 'primary', className, type = 'button', ...props }, ref) => {
    const extended = label != null
    return (
      <button
        ref={ref}
        type={type}
        data-slot="fab"
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold shadow-dialog',
          'transition-colors duration-effects-default ease-standard',
          pressScale,
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
          'disabled:pointer-events-none disabled:bg-disabled-container disabled:text-on-disabled',
          extended ? 'text-md h-14 px-5' : 'size-14',
          fabColorClass[color],
          className,
        )}
        {...props}
      >
        {icon != null && (
          <span data-slot="fab-icon" aria-hidden className="grid place-items-center">
            {icon}
          </span>
        )}
        {label}
      </button>
    )
  },
)

Fab.displayName = 'Fab'

export { Fab }
