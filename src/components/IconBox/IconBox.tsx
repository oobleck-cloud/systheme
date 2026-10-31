import { boxShapeVariants, type BoxShapeVariants } from '@/utils/boxShape'
import { cn } from '@/utils/cn'

type IconBoxProps = React.HTMLAttributes<HTMLSpanElement> & BoxShapeVariants

function IconBox({ className, shape, size, variant, children, ...props }: IconBoxProps) {
  return (
    <span className={cn(boxShapeVariants({ shape, size, variant }), className)} {...props}>
      {children}
    </span>
  )
}

export { IconBox }
export type { IconBoxProps }
