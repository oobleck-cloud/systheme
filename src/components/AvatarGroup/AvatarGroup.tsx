import { forwardRef } from 'react'

import { Avatar, type AvatarProps } from '@/components/Avatar'
import { TextBox } from '@/components/TextBox'
import { cn } from '@/utils/cn'

export type AvatarGroupItem = {
  name?: string
  src?: string
  alt?: string
  fallback?: React.ReactNode
}

type AvatarGroupProps = React.HTMLAttributes<HTMLDivElement> &
  Pick<AvatarProps, 'size' | 'shape'> & {
    avatars: AvatarGroupItem[]
    maxCount?: number
    spacing?: 'tight' | 'default'
  }

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      className,
      avatars,
      maxCount = 4,
      size = 'sm',
      shape = 'circle',
      spacing = 'tight',
      ...props
    },
    ref,
  ) => {
    const visible = avatars.slice(0, maxCount)
    const overflow = avatars.length - maxCount

    return (
      <div
        ref={ref}
        data-slot="avatar-group-root"
        className={cn('inline-flex items-center', className)}
        {...props}
      >
        {visible.map((avatar, i) => (
          <span
            key={i}
            data-slot="avatar-group-item"
            className={cn(
              'relative rounded-full ring-2 ring-background',
              spacing === 'tight' && i > 0 && '-ml-2',
            )}
            title={avatar.name}
          >
            <Avatar
              size={size}
              shape={shape}
              src={avatar.src}
              name={avatar.name}
              alt={avatar.alt}
              fallback={avatar.fallback}
            />
          </span>
        ))}

        {overflow > 0 && (
          <span
            data-slot="avatar-group-overflow"
            className={cn(
              'relative rounded-full ring-2 ring-background',
              spacing === 'tight' && '-ml-2',
            )}
            aria-label={`외 ${overflow}명`}
          >
            <TextBox size={size} shape={shape} variant="default" aria-hidden>
              +{overflow}
            </TextBox>
          </span>
        )}
      </div>
    )
  },
)

AvatarGroup.displayName = 'AvatarGroup'

export { AvatarGroup }
export type { AvatarGroupProps }
