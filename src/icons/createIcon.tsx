import type { LucideIcon } from 'lucide-react'
import type { ReactElement } from 'react'

import { cn } from '@/utils/cn'

export type IconSize = 'xs' | 'sm' | 'md' | 'lg'

const iconSizeClass: Record<IconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

/** Lucide 아이콘에 공통 크기·shrink 클래스 적용 */
export function iconClassName(size: IconSize = 'md', className?: string): string {
  return cn(iconSizeClass[size], 'shrink-0', className)
}

export function createIconElement(
  Icon: LucideIcon,
  size: IconSize = 'md',
  className?: string,
): ReactElement {
  return <Icon className={iconClassName(size, className)} aria-hidden />
}
