import { cn } from '@/utils/cn'
import { layoutGapScale, type LayoutGapKey } from '@/utils/layoutGapScale'

const colsMap = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
} as const

const rowsMap = {
  1: 'grid-rows-1',
  2: 'grid-rows-2',
  3: 'grid-rows-3',
  4: 'grid-rows-4',
  5: 'grid-rows-5',
  6: 'grid-rows-6',
} as const

const gapMap = layoutGapScale

const gapXMap = {
  0: 'gap-x-0',
  1: 'gap-x-1',
  2: 'gap-x-2',
  3: 'gap-x-3',
  4: 'gap-x-4',
  5: 'gap-x-5',
  6: 'gap-x-6',
  8: 'gap-x-8',
  10: 'gap-x-10',
  12: 'gap-x-12',
  16: 'gap-x-16',
} as const

const gapYMap = {
  0: 'gap-y-0',
  1: 'gap-y-1',
  2: 'gap-y-2',
  3: 'gap-y-3',
  4: 'gap-y-4',
  5: 'gap-y-5',
  6: 'gap-y-6',
  8: 'gap-y-8',
  10: 'gap-y-10',
  12: 'gap-y-12',
  16: 'gap-y-16',
} as const

type GridProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType
  cols?: keyof typeof colsMap
  rows?: keyof typeof rowsMap
  gap?: LayoutGapKey
  gapX?: keyof typeof gapXMap
  gapY?: keyof typeof gapYMap
  inline?: boolean
}

function Grid({
  as: Tag = 'div',
  cols,
  rows,
  gap,
  gapX,
  gapY,
  inline = false,
  className,
  children,
  ...props
}: GridProps) {
  return (
    <Tag
      className={cn(
        inline ? 'inline-grid' : 'grid',
        cols && colsMap[cols],
        rows && rowsMap[rows],
        gap && gapMap[gap],
        gapX && gapXMap[gapX],
        gapY && gapYMap[gapY],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}

export { Grid }
export type { GridProps }
