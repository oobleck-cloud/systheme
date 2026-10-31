import { cn } from '@/utils/cn'

const maxWidthMap = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
} as const

type ContainerProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
  maxWidth?: keyof typeof maxWidthMap
  center?: boolean
  padding?: boolean
}

function Container({
  as: Tag = 'div',
  maxWidth = 'xl',
  center = true,
  padding = true,
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        'w-full',
        maxWidthMap[maxWidth],
        center && 'mx-auto',
        padding && 'px-4 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export { Container }
export type { ContainerProps }
