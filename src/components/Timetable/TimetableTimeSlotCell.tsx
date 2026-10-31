'use client'

import { useCallback, useState } from 'react'

import { Tooltip } from '@/components/Tooltip'
import { cn } from '@/utils/cn'

import type { TimetableSlotTone } from './timetable-types'

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
    return false
  } catch {
    return false
  }
}

type TimetableTimeSlotCellProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> & {
  preview?: React.ReactNode
  copyValue?: string
  onCellClick?: () => void
  /** 선택 불가 구간 — 클릭·복사·포커스 비활성 */
  disabled?: boolean
  /** 고를 수 있는 칸의 결([TimetableSlotTone]). `disabled` 면 무시한다 */
  tone?: TimetableSlotTone
  /**
   * 현재 그리드에서 선택된 빈 슬롯.
   *
   * 이 격자에서 키보드 이동은 호버가 아니라 **클릭과 동격**이다(선택이 포커스를 따라간다).
   * 그래서 포커스 링을 따로 두지 않고 선택 링 하나만 그린다 — 두 링이 같은 칸에서
   * 겹쳐 보이면 "지금 여기 있다"와 "이걸 골랐다"를 구분할 수 없다.
   */
  selected?: boolean
  /**
   * Roving tabindex: 그리드가 단일 tab stop을 관리할 때 사용. `true`인 셀만 `tabIndex=0`,
   * 나머지는 `-1`. 기본값 `true`(단독/기존 사용 시 동작 유지).
   */
  isTabStop?: boolean
  /** 스크롤·테스트·앱 연동용 식별자 */
  resourceId?: string
  slotMinute?: number
}

function TimetableTimeSlotCell({
  preview,
  copyValue,
  onCellClick,
  disabled = false,
  tone = 'default',
  selected = false,
  isTabStop = true,
  resourceId,
  slotMinute,
  className,
  style,
  ...props
}: TimetableTimeSlotCellProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    if (disabled) return
    if (copyValue) {
      const ok = await copyText(copyValue)
      if (ok) {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      }
    }
    onCellClick?.()
  }, [copyValue, onCellClick, disabled])

  const interactive = !disabled && Boolean(copyValue ?? onCellClick)

  const cell = (
    <div
      data-slot="timetable-time-slot-cell"
      data-disabled={disabled ? '1' : undefined}
      data-tone={!disabled && tone !== 'default' ? tone : undefined}
      data-selected={selected ? '1' : undefined}
      data-resource-id={resourceId}
      data-slot-minute={slotMinute != null ? String(slotMinute) : undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? (isTabStop ? 0 : -1) : undefined}
      aria-disabled={disabled ? true : undefined}
      aria-pressed={interactive ? selected : undefined}
      onClick={interactive ? handleClick : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                void handleClick()
              }
            }
          : undefined
      }
      className={cn(
        'h-full min-h-0 w-full border-b border-border-subtle bg-background outline-none',
        disabled && 'cursor-not-allowed bg-overlay text-fg-subtle',
        !disabled && tone === 'attention' && 'bg-warning-subtle',
        !disabled && tone === 'tentative' && 'border border-dashed border-border',
        // 선택 = 안쪽 브랜드 링. 칸을 채우지 않는다 — 빈 슬롯은 선택돼도 여전히 빈 슬롯이고,
        // 채우면 "배정 블록"(못 고르는 칸)과 형태가 겹친다.
        !disabled && selected && 'ring-2 ring-primary ring-inset',
        // 호버 = dim 한 단. 링보다 가벼워 스쳐 가는 상태와 머무는 상태가 구분된다.
        interactive && 'cursor-pointer hover:bg-surface',
        !disabled && copied && 'bg-brand-50/50',
      )}
      aria-label={
        disabled
          ? '선택할 수 없는 시간'
          : interactive
            ? copied
              ? '복사됨'
              : selected
                ? `선택된 슬롯, ${copyValue ?? '빈 시간'}`
                : (copyValue ?? '빈 시간 슬롯')
            : undefined
      }
      {...props}
    >
      <span data-slot="copy-feedback" className="sr-only" aria-live="polite">
        {copied ? '클립보드에 복사됨' : ''}
      </span>
    </div>
  )

  const outerClass = cn('flex h-full min-h-0 w-full min-w-0 self-stretch', className)

  if (!preview || disabled) {
    return (
      // eslint-disable-next-line design-system/no-inline-style -- forwards grid-column/grid-row from TimetableGrid
      <div data-slot="timetable-time-slot-cell-root" className={outerClass} style={style}>
        {cell}
      </div>
    )
  }

  return (
    // eslint-disable-next-line design-system/no-inline-style -- forwards grid-column/grid-row from TimetableGrid
    <div data-slot="timetable-time-slot-cell-root" className={outerClass} style={style}>
      <Tooltip
        content={preview}
        side="top"
        delayDuration={280}
        className="relative flex h-full min-h-0 w-full min-w-0"
        triggerClassName="flex h-full min-h-0 w-full min-w-0"
        contentClassName="pointer-events-none max-w-[14rem] whitespace-normal text-left leading-snug shadow-float"
      >
        <div data-slot="cell-hover-preview-wrap" className="flex h-full min-h-0 w-full min-w-0">
          {cell}
        </div>
      </Tooltip>
    </div>
  )
}

export { TimetableTimeSlotCell }
export type { TimetableTimeSlotCellProps }
