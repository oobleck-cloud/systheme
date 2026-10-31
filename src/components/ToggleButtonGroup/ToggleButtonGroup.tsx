'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { ButtonGroup, type ButtonGroupBoxSize } from '@/components/Button/ButtonGroup'
import { IconButton } from '@/components/IconButton/IconButton'
import { cn } from '@/utils/cn'
import { shapeMorphDefault, shapeMorphSelected } from '@/utils/interactionUtils'

const toggleButtonGroupVariants = cva('', {
  variants: {
    block: {
      true: 'w-full',
      false: 'w-fit shrink-0',
    },
  },
  defaultVariants: {
    block: false,
  },
})

type ToggleButtonGroupOption = {
  value: string
  label: React.ReactNode
  ariaLabel: string
  disabled?: boolean
}

type ToggleButtonGroupProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> &
  VariantProps<typeof toggleButtonGroupVariants> & {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    options: ReadonlyArray<ToggleButtonGroupOption>
    size?: 'sm' | 'md'
    /** `icon`: IconButton, `label`: 텍스트 Button */
    appearance?: 'icon' | 'label'
    disabled?: boolean
    'aria-label'?: string
    /**
     * shape morph 모드 — 선택 시 pill(rounded-full), 비선택 시 rounded-md로 전환.
     * connected 외곽선 공유를 피하기 위해 비연결 gap 레이아웃을 사용합니다.
     * connected 모드에서는 이 prop을 사용하지 않습니다.
     */
    shapeMorph?: boolean
  }

const ToggleButtonGroup = forwardRef<HTMLDivElement, ToggleButtonGroupProps>(
  (
    {
      value: valueProp,
      defaultValue = '',
      onValueChange,
      options,
      size = 'sm',
      appearance = 'label',
      block,
      disabled = false,
      className,
      shapeMorph = false,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const isControlled = valueProp !== undefined
    const value = isControlled ? valueProp : internalValue

    const handleValueChange = (next: string) => {
      if (!isControlled) setInternalValue(next)
      onValueChange?.(next)
    }
    const boxSize: ButtonGroupBoxSize = size === 'sm' ? 'sm' : 'md'
    const controlSize = size === 'sm' ? 'sm' : 'md'

    // WAI-ARIA radiogroup: Arrow keys navigate between options (automatic activation)
    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      const enabledOptions = options.filter((o) => !disabled && !o.disabled)
      const currentIdx = enabledOptions.findIndex((o) => o.value === value)

      let nextIdx = -1
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          nextIdx = (currentIdx + 1) % enabledOptions.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          nextIdx = (currentIdx - 1 + enabledOptions.length) % enabledOptions.length
          break
        default:
          return
      }

      const next = enabledOptions[nextIdx]
      if (!next) return
      handleValueChange(next.value)
      // Focus the corresponding button
      const container = e.currentTarget
      const btns = container.querySelectorAll<HTMLElement>('[data-slot="toggle-button-group-item"]')
      const targetBtn = btns[options.findIndex((o) => o.value === next.value)]
      targetBtn?.focus()
    }

    return (
      <ButtonGroup
        ref={ref}
        connected={!shapeMorph}
        endShape="md"
        boxSize={boxSize}
        gap={shapeMorph ? 1 : 0}
        role="radiogroup"
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        data-slot="toggle-button-group-root"
        className={cn(toggleButtonGroupVariants({ block }), className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {options.map((option) => {
          const selected = value === option.value
          const itemDisabled = disabled || option.disabled
          const shapeMorphClass = shapeMorph
            ? selected
              ? shapeMorphSelected
              : shapeMorphDefault
            : undefined
          const shared = {
            type: 'button' as const,
            role: 'radio' as const,
            'aria-checked': selected,
            'aria-label': option.ariaLabel,
            disabled: itemDisabled,
            onClick: () => {
              if (itemDisabled || selected) return
              handleValueChange(option.value)
            },
          }

          const hasSelection = options.some((o) => !disabled && !o.disabled && o.value === value)
          const firstEnabledIdx = options.findIndex((o) => !o.disabled && !disabled)
          const isTabStop =
            selected || (!hasSelection && options.indexOf(option) === firstEnabledIdx)

          if (appearance === 'icon') {
            return (
              <IconButton
                key={option.value}
                data-slot="toggle-button-group-item"
                variant={selected ? 'secondary' : 'ghost'}
                size={controlSize}
                shape="square"
                tabIndex={isTabStop ? 0 : -1}
                className={shapeMorphClass}
                {...shared}
              >
                {option.label}
              </IconButton>
            )
          }

          return (
            <Button
              key={option.value}
              data-slot="toggle-button-group-item"
              variant={selected ? 'secondary' : 'ghost'}
              size={controlSize}
              density="compact"
              tabIndex={isTabStop ? 0 : -1}
              className={shapeMorphClass}
              {...shared}
            >
              {option.label}
            </Button>
          )
        })}
      </ButtonGroup>
    )
  },
)

ToggleButtonGroup.displayName = 'ToggleButtonGroup'

export { ToggleButtonGroup, toggleButtonGroupVariants }
export type { ToggleButtonGroupOption, ToggleButtonGroupProps }
