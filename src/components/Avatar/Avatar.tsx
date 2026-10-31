'use client'

import { useState } from 'react'

import { IconBox } from '@/components/IconBox'
import { TextBox } from '@/components/TextBox'
import { boxShapeVariants, getInitials, type BoxShapeVariants } from '@/utils/boxShape'
import { cn } from '@/utils/cn'

/* 기본 폴백 아이콘 */
const PersonIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-[55%] w-[55%]">
    <circle cx="8" cy="5" r="3" />
    <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" />
  </svg>
)

type AvatarProps = React.HTMLAttributes<HTMLSpanElement> &
  BoxShapeVariants & {
    src?: string
    name?: string
    fallback?: React.ReactNode
    alt?: string
  }

function Avatar({
  className,
  shape = 'circle',
  size = 'md',
  variant = 'default',
  src,
  name,
  fallback,
  alt,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const label = alt ?? name ?? 'Avatar'
  const sharedProps = { shape, size, variant, className, ...props }

  /* 1순위: 이미지 */
  if (src && !imageError) {
    return (
      <span className={cn(boxShapeVariants({ shape, size, variant }), className)} {...props}>
        <img
          src={src}
          alt={alt ?? name ?? ''}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </span>
    )
  }

  /* 2순위: 이름에서 이니셜 추출 */
  if (name) {
    return (
      <TextBox role="img" aria-label={name} {...sharedProps}>
        {getInitials(name)}
      </TextBox>
    )
  }

  /* 3순위: 커스텀 폴백 아이콘 */
  if (fallback) {
    return (
      <IconBox role="img" aria-label={label} {...sharedProps}>
        {fallback}
      </IconBox>
    )
  }

  /* 4순위: 기본 사람 아이콘 */
  return (
    <IconBox role="img" aria-label={label} {...sharedProps}>
      <PersonIcon />
    </IconBox>
  )
}

export { Avatar }
export type { AvatarProps }
