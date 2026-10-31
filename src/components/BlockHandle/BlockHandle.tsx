'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type Ref } from 'react'

import { cn } from '@/utils/cn'

// 노션식 블록 거터 어포던스 — 블록 왼쪽에 뜨는 추가(+)/드래그 그립(⠿).
// 에디터 표면(거터)·정책/상품 블록 셸이 공유한다. 위치·노출(opacity)은 호출부가 래퍼로 제어하고,
// 이 컴포넌트는 어포던스 자체(글리프·치수·토큰·커서)만 단일 소스로 책임진다.
const blockHandleVariants = cva(
  'flex items-center justify-center rounded text-fg-muted transition-colors hover:bg-overlay hover:text-fg',
  {
    variants: {
      kind: {
        add: '',
        grip: 'cursor-grab touch-none active:cursor-grabbing',
      },
      size: { sm: '', md: '' },
    },
    compoundVariants: [
      { kind: 'add', size: 'sm', class: 'size-5' },
      { kind: 'add', size: 'md', class: 'size-6' },
      { kind: 'grip', size: 'sm', class: 'h-5 w-3.5' },
      { kind: 'grip', size: 'md', class: 'h-6 w-4' },
    ],
    defaultVariants: { kind: 'add', size: 'sm' },
  },
)

type BlockHandleProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof blockHandleVariants> & {
    kind: 'add' | 'grip'
    /** 스크린리더 라벨 — 어포던스는 글리프만 있어 필수. */
    'aria-label': string
  }

// add → 실제 버튼(클릭=블록 추가). grip → span role=button(포인터 드래그·메뉴 트리거를 호출부가 부여).
const BlockHandle = forwardRef<HTMLElement, BlockHandleProps>(
  ({ kind, size, className, children, ...props }, ref) => {
    const cls = cn(blockHandleVariants({ kind, size }), className)
    if (kind === 'add') {
      return (
        <button
          ref={ref as Ref<HTMLButtonElement>}
          type="button"
          data-slot="block-handle-root"
          className={cls}
          {...props}
        >
          {children ?? '+'}
        </button>
      )
    }
    return (
      <span
        ref={ref as Ref<HTMLSpanElement>}
        role="button"
        data-slot="block-handle-root"
        className={cls}
        {...props}
      >
        {children ?? '⠿'}
      </span>
    )
  },
)

BlockHandle.displayName = 'BlockHandle'

export { BlockHandle, blockHandleVariants }
export type { BlockHandleProps }
