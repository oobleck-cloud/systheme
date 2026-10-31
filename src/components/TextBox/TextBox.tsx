import { boxShapeVariants, type BoxShapeVariants } from '@/utils/boxShape'
import { cn } from '@/utils/cn'

type TextBoxProps = React.HTMLAttributes<HTMLSpanElement> & BoxShapeVariants

function TextBox({ className, shape, size, variant, children, ...props }: TextBoxProps) {
  return (
    <span
      className={cn(
        boxShapeVariants({ shape, size, variant }),
        'leading-none tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export { TextBox }
export type { TextBoxProps }
