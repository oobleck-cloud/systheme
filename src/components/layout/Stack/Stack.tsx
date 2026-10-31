import { cn } from '@/utils/cn'
import { layoutGapScale, type LayoutGapKey } from '@/utils/layoutGapScale'

const directionMap = {
  horizontal: 'flex-row',
  vertical: 'flex-col',
} as const

const gapMap = layoutGapScale

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
} as const

type StackProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
  direction?: keyof typeof directionMap
  gap?: LayoutGapKey
  align?: keyof typeof alignMap
  justify?: keyof typeof justifyMap
  wrap?: boolean
  inline?: boolean
}

function Stack({
  as: Tag = 'div',
  direction = 'vertical',
  gap = 4,
  align,
  justify,
  wrap = false,
  inline = false,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <Tag
      className={cn(
        inline ? 'inline-flex' : 'flex',
        directionMap[direction],
        gapMap[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export { Stack }
export type { StackProps }
