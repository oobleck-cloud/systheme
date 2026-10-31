'use client'

import { useId, useState } from 'react'

import type { TimetableLabels } from './timetable-types'

import { Switch } from '@/components/Switch'
import { cn } from '@/utils/cn'

/* ── 아이콘 ─────────────────────────────────────────────────────────────── */
function ArrowUpIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 10V2M2 6l4-4 4 4" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 2v8M2 6l4 4 4-4" />
    </svg>
  )
}

/* ── 이른/늦은 시간대 스텝 버튼 ──────────────────────────────────────────
 * 아이콘만 둔다. 무엇이 움직이는지는 옆의 구간 라벨(`rangeLabel`)이 말한다 —
 * 라벨 없이 "이전/다음"만 있으면 날짜가 움직이는지 시간이 움직이는지 알 수 없다. */
function StepButton({
  direction,
  label,
  onClick,
  disabled,
}: {
  direction: 'up' | 'down'
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        'inline-grid size-6 place-items-center rounded-md border border-border-subtle bg-background',
        'text-fg-muted',
        'hover:border-border hover:bg-overlay hover:text-fg',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
        'transition-[background-color,border-color,color] disabled:cursor-not-allowed disabled:opacity-50',
      )}
    >
      {direction === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
    </button>
  )
}

/* ── 컴포넌트 ────────────────────────────────────────────────────────────── */
type TimetableViewToolbarProps = {
  viewportStart?: number
  defaultViewportStart?: number
  slotMinutes: number
  viewportStepSlots?: number
  includeDeactiveDates?: boolean
  defaultIncludeDeactiveDates?: boolean
  onViewportChange?: (nextViewportStart: number) => void
  onIncludeDeactiveChange?: (next: boolean) => void
  /** 지금 보이는 시간 구간 (예: "10:00 – 19:00"). 스텝 버튼이 무엇을 움직이는지 밝힌다 */
  rangeLabel?: string
  labels?: TimetableLabels
  disabled?: boolean
  className?: string
}

function TimetableViewToolbar({
  viewportStart: viewportStartProp,
  defaultViewportStart = 0,
  slotMinutes,
  viewportStepSlots = 2,
  includeDeactiveDates: includeDeactiveDatesProp,
  defaultIncludeDeactiveDates = false,
  onViewportChange,
  onIncludeDeactiveChange,
  rangeLabel,
  labels,
  disabled,
  className,
}: TimetableViewToolbarProps) {
  const [internalViewportStart, setInternalViewportStart] = useState(defaultViewportStart)
  const [internalIncludeDeactive, setInternalIncludeDeactive] = useState(
    defaultIncludeDeactiveDates,
  )

  const isViewportControlled = viewportStartProp !== undefined
  const isIncludeControlled = includeDeactiveDatesProp !== undefined
  const viewportStart = isViewportControlled ? viewportStartProp! : internalViewportStart
  const includeDeactiveDates = isIncludeControlled
    ? includeDeactiveDatesProp!
    : internalIncludeDeactive

  const handleViewportChange = (next: number) => {
    if (!isViewportControlled) setInternalViewportStart(next)
    onViewportChange?.(next)
  }

  const handleIncludeDeactiveChange = (next: boolean) => {
    if (!isIncludeControlled) setInternalIncludeDeactive(next)
    onIncludeDeactiveChange?.(next)
  }
  const step = slotMinutes * viewportStepSlots
  const prevLabel = labels?.timePrev ?? '이른 시간대 보기'
  const nextLabel = labels?.timeNext ?? '늦은 시간대 보기'
  const toggleLabel = labels?.includeDeactive ?? '활성 일정만 보기'
  const toggleId = useId()

  return (
    <div data-slot="timetable-view-toolbar" className={cn('flex items-center gap-2.5', className)}>
      {rangeLabel ? (
        <span data-slot="range-label" className="text-xs text-fg-subtle tabular-nums">
          {rangeLabel}
        </span>
      ) : null}

      <div className="flex items-center gap-1">
        <StepButton
          direction="up"
          label={prevLabel}
          onClick={() => handleViewportChange(Math.max(0, viewportStart - step))}
          disabled={disabled}
        />
        <StepButton
          direction="down"
          label={nextLabel}
          onClick={() => handleViewportChange(viewportStart + step)}
          disabled={disabled}
        />
      </div>

      <span aria-hidden className="h-4 w-px bg-border" />

      <div data-slot="include-deactive-row" className="flex items-center gap-2.5">
        <Switch
          id={toggleId}
          checked={!includeDeactiveDates}
          onCheckedChange={(v) => handleIncludeDeactiveChange(!v)}
          disabled={disabled}
        />
        <label
          htmlFor={toggleId}
          className="cursor-pointer text-xs text-fg-subtle select-none hover:text-fg"
        >
          {toggleLabel}
        </label>
      </div>
    </div>
  )
}

export { TimetableViewToolbar }
export type { TimetableViewToolbarProps }
