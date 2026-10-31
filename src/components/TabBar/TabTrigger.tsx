'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { useTabBarContext } from './tab-bar-context'

import { cn } from '@/utils/cn'

const tabTriggerVariants = cva(
  [
    'relative inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-colors',
    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      /**
       * `default` — 인라인/설정형 탭(밑줄 인디케이터).
       * `workspace` — 브라우저·에디터 스트립형: 상단만 둥글고, 선택 탭이 콘텐츠 영역(`background`)과 이어지는 크롬 느낌.
       */
      appearance: {
        default: [
          'rounded-md',
          'text-fg-muted hover:bg-secondary hover:text-fg',
          'data-[selected=true]:text-fg',
        ],
        workspace: [
          // 셸이 배경·테두리·패딩을 담당하므로 버튼 자체는 순수 레이블 역할만
          'min-h-0 w-full min-w-0 flex-1 items-center self-stretch justify-start',
          'rounded-none border-0 bg-transparent shadow-none',
          'text-left text-fg-muted data-[selected=true]:text-fg',
          'hover:bg-transparent data-[selected=true]:hover:bg-transparent',
          'focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0',
        ],
      },
      density: {
        compact: '',
        default: '',
        loose: '',
      },
    },
    compoundVariants: [
      { appearance: 'default', density: 'compact', class: 'min-h-8 px-2 text-xs' },
      { appearance: 'default', density: 'default', class: 'min-h-10 px-3 text-sm' },
      { appearance: 'default', density: 'loose', class: 'min-h-11 px-4 text-base' },
      // 패딩은 shell이 담당하므로 0; 텍스트 크기만 density 별로
      { appearance: 'workspace', density: 'compact', class: 'px-0 text-xs' },
      { appearance: 'workspace', density: 'default', class: 'px-0 text-sm' },
      { appearance: 'workspace', density: 'loose', class: 'px-0 text-base' },
    ],
    defaultVariants: {
      appearance: 'default',
      density: 'default',
    },
  },
)

type TabTriggerProps = Omit<React.HTMLAttributes<HTMLElement>, 'onSelect'> &
  VariantProps<typeof tabTriggerVariants> & {
    tabId: string
    label: React.ReactNode
    /** Controlled selection when used with TabBar */
    selectedTabId?: string
    isSelected?: boolean
    onSelect?: (tabId: string) => void
    disabled?: boolean
    /** `default` appearance only — workspace 라벨은 div로 렌더됩니다. */
    type?: React.ButtonHTMLAttributes<HTMLButtonElement>['type']
  }

const TabTrigger = forwardRef<HTMLElement, TabTriggerProps>(
  (
    {
      className,
      onClick,
      appearance,
      density,
      tabId,
      label,
      selectedTabId,
      isSelected: isSelectedProp,
      onSelect,
      type = 'button',
      role = 'tab',
      tabIndex: tabIndexProp,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const ctx = useTabBarContext()
    const resolvedSelectedTabId = selectedTabId ?? ctx?.selectedTabId
    const resolvedOnSelect = onSelect ?? ctx?.onSelect

    const derived = resolvedSelectedTabId != null ? resolvedSelectedTabId === tabId : undefined
    const isSelected = isSelectedProp ?? derived ?? false
    const tabIndex = tabIndexProp ?? (isSelected ? 0 : -1)
    const classNames = cn(tabTriggerVariants({ appearance, density }), className)

    const handleClick = (e: React.MouseEvent<HTMLElement>) => {
      if (disabled) return
      onClick?.(e)
      if (!e.defaultPrevented) resolvedOnSelect?.(tabId)
    }

    const labelNode = (
      <span className="relative z-[1] block min-w-0 truncate" data-part="label">
        {label}
      </span>
    )

    // dockview `.dv-tab` HTML5 drag는 `<button>` 자식 위에서 시작되지 않으므로
    // workspace 스트립 라벨은 비인터랙티브 div로 둡니다(클릭·선택은 onClick으로 처리).
    if (appearance === 'workspace') {
      return (
        <div
          ref={ref as React.Ref<HTMLDivElement>}
          {...props}
          role={role}
          id={`tab-${tabId}`}
          aria-selected={isSelected}
          aria-disabled={disabled || undefined}
          data-selected={isSelected ? 'true' : 'false'}
          tabIndex={disabled ? -1 : tabIndex}
          className={cn(classNames, disabled && 'pointer-events-none opacity-50')}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (disabled) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick(e as unknown as React.MouseEvent<HTMLElement>)
            }
          }}
        >
          {labelNode}
        </div>
      )
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        {...props}
        type={type}
        role={role}
        disabled={disabled}
        id={`tab-${tabId}`}
        aria-selected={isSelected}
        data-selected={isSelected ? 'true' : 'false'}
        tabIndex={tabIndex}
        className={classNames}
        onClick={handleClick}
      >
        {labelNode}
        <span
          aria-hidden
          data-part="selection-indicator"
          className={cn(
            'pointer-events-none absolute right-2 bottom-1 left-2 h-0.5 rounded-full bg-primary transition-opacity duration-effects-default ease-standard',
            isSelected ? 'opacity-100' : 'opacity-0',
          )}
        />
      </button>
    )
  },
)

TabTrigger.displayName = 'TabTrigger'

export { TabTrigger, tabTriggerVariants }
export type { TabTriggerProps }
