'use client'

import type { ReactNode } from 'react'

import { cn } from '@/utils/cn'

export interface FloatingBounceProps {
  children: ReactNode
  /** false면 애니메이션 없이 children만 렌더. 기본 true */
  enabled?: boolean
  className?: string
}

/** 선택된 마커 오버레이에 적용하는 bounce 강조 래퍼 */
export function FloatingBounce({ children, enabled = true, className }: FloatingBounceProps) {
  if (!enabled) return <>{children}</>
  return <div className={cn('animate-bounce', className)}>{children}</div>
}
