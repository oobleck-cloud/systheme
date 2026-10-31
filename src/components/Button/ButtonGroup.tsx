'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import {
  Children,
  cloneElement,
  forwardRef,
  Fragment,
  isValidElement,
  type ReactElement,
} from 'react'

import {
  ConnectedBox,
  ConnectedBoxDivider,
  ConnectedBoxSegment,
  type ConnectedBoxProps,
} from '@/primitives/connectedBox'
import { cn } from '@/utils/cn'
import { layoutGapScale } from '@/utils/layoutGapScale'

const buttonGroupVariants = cva('inline-flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
    },
    gap: layoutGapScale,
  },
  defaultVariants: {
    orientation: 'horizontal',
    gap: 0,
  },
})

export type ButtonGroupEndShape = 'none' | 'md' | 'full'

export type ButtonGroupBoxSize = NonNullable<ConnectedBoxProps['size']>

function joinedItemRadius(
  orientation: 'horizontal' | 'vertical',
  endShape: ButtonGroupEndShape,
  index: number,
  count: number,
): string {
  if (endShape === 'none') return 'rounded-none'
  if (count <= 1) {
    if (endShape === 'full') return 'rounded-full'
    return 'rounded-md'
  }
  if (endShape === 'md') {
    if (orientation === 'horizontal') {
      if (index === 0) return 'rounded-s-md rounded-e-none'
      if (index === count - 1) return 'rounded-e-md rounded-s-none'
      return 'rounded-none'
    }
    if (index === 0) return 'rounded-t-md rounded-b-none'
    if (index === count - 1) return 'rounded-b-md rounded-t-none'
    return 'rounded-none'
  }
  if (orientation === 'horizontal') {
    if (index === 0) return 'rounded-s-full rounded-e-none'
    if (index === count - 1) return 'rounded-e-full rounded-s-none'
    return 'rounded-none'
  }
  if (index === 0) return 'rounded-t-full rounded-b-none'
  if (index === count - 1) return 'rounded-b-full rounded-t-none'
  return 'rounded-none'
}

type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof buttonGroupVariants> & {
    /**
     * 그룹 바깥쪽 모서리 처리.
     * `md`: 세그먼트형(기본), `full`: 양끝 pill, `none`: 모두 직각
     */
    endShape?: ButtonGroupEndShape
    /** ConnectedBox 외곽선·포커스 링으로 세그먼트 연결 (gap 은 0 으로 고정) */
    connected?: boolean
    /** `connected` 일 때 세그먼트 사이 구분선 표시 (기본 true) */
    dividers?: boolean
    /** `connected` 일 때 ConnectedBox min-height */
    boxSize?: ButtonGroupBoxSize
  }

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      orientation: orientationProp,
      gap: gapProp,
      endShape = 'md',
      connected = false,
      dividers = true,
      boxSize = 'md',
      children,
      ...props
    },
    ref,
  ) => {
    const orientation = orientationProp ?? 'horizontal'
    const gap = connected ? 0 : (gapProp ?? 0)
    const items = Children.toArray(children).filter(isValidElement) as ReactElement<{
      className?: string
    }>[]
    const count = items.length
    // 연결부 직각 처리는 실제로 붙어 있을 때만 — gap 이 있으면 각 아이템의 자체 라운드를 존중한다
    const joined = connected || gap === 0

    const clonedItems = items.map((child, index) =>
      cloneElement(child, {
        className: cn(
          child.props.className,
          joined && joinedItemRadius(orientation, endShape, index, count),
          connected &&
            'h-auto min-h-0 self-stretch shadow-none focus-visible:ring-0 focus-visible:ring-offset-0',
        ),
      }),
    )

    if (connected) {
      return (
        <ConnectedBox
          ref={ref}
          size={boxSize}
          orientation={orientation}
          data-slot="button-group"
          data-connected="true"
          data-end-shape={endShape}
          data-dividers={String(dividers)}
          role="group"
          className={className}
          {...props}
        >
          {clonedItems.map((child, index) => (
            <Fragment key={index}>
              {index > 0 && dividers ? <ConnectedBoxDivider orientation={orientation} /> : null}
              <ConnectedBoxSegment
                data-slot="button-group-item"
                className="self-stretch [&>*]:min-h-0 [&>*]:self-stretch"
              >
                {child}
              </ConnectedBoxSegment>
            </Fragment>
          ))}
        </ConnectedBox>
      )
    }

    return (
      <div
        ref={ref}
        data-slot="button-group"
        data-orientation={orientation}
        data-end-shape={endShape}
        data-gap={String(gap)}
        role="group"
        className={cn(buttonGroupVariants({ orientation, gap }), className)}
        {...props}
      >
        {clonedItems}
      </div>
    )
  },
)

ButtonGroup.displayName = 'ButtonGroup'

export { ButtonGroup, buttonGroupVariants }
export type { ButtonGroupProps }
