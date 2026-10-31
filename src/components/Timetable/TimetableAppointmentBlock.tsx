'use client'

import { useCallback, useState } from 'react'

import { Tooltip } from '@/components/Tooltip'
import { cn } from '@/utils/cn'

type TimetableAppointmentBlockProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'onClick'
> & {
  label: string
  /** 호버 시 overlay-surface 프리뷰 본문 */
  preview?: React.ReactNode
  selected?: boolean
  onActivate?: () => void
  onCopy?: (label: string) => void
  copyOnClick?: boolean
  /** 클릭 시 클립보드에 복사할 값. 미지정 시 `label` 을 복사 */
  copyValue?: string
  /** 커스텀 배경색(CSS color) — 지정 시 기본 bg-brand-400 대신 사용 (구역별 색상 등) */
  bgColor?: string
  /** 커스텀 글자색(CSS color) — 파스텔 배경 위 대비용. 미지정 시 흰색 */
  fgColor?: string
}

async function copyLabelToClipboard(label: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(label)
      return true
    }
    const ta = document.createElement('textarea')
    ta.value = label
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

function TimetableAppointmentBlock({
  label,
  preview,
  selected = false,
  onActivate,
  onCopy,
  copyOnClick = true,
  copyValue,
  className,
  style,
  type = 'button',
  bgColor,
  fgColor,
  ...props
}: TimetableAppointmentBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleClick = useCallback(async () => {
    if (copyOnClick) {
      const text = copyValue ?? label
      const ok = await copyLabelToClipboard(text)
      if (ok) {
        setCopied(true)
        onCopy?.(text)
        window.setTimeout(() => setCopied(false), 1500)
      }
    }
    onActivate?.()
  }, [copyOnClick, copyValue, label, onCopy, onActivate])

  const button = (
    <button
      type={type}
      data-slot="timetable-appointment-block"
      onClick={handleClick}
      className={cn(
        'relative box-border flex h-full min-h-0 w-full min-w-0 items-center justify-center',
        'rounded-none border-0 px-1 text-center text-[0.8125rem] leading-tight font-medium tracking-tight',
        !bgColor && 'bg-brand-400',
        !fgColor && 'text-white',
        'shadow-[inset_0_1px_0_oklch(100%_0_0_/0.1)] transition-[opacity,filter] hover:brightness-[0.98]',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
        selected && 'ring-1 ring-current ring-inset',
        copied && 'brightness-95',
      )}
      // eslint-disable-next-line design-system/no-inline-style -- 동적 구역별 색상 (파스텔 배경/글씨)
      style={{ ...(bgColor && { backgroundColor: bgColor }), ...(fgColor && { color: fgColor }) }}
      aria-pressed={selected}
      aria-label={copied ? `${label}, 복사됨` : label}
      {...props}
    >
      <span data-slot="title" className="w-full truncate text-center">
        {label}
      </span>
      <span data-slot="copy-feedback" className="sr-only" aria-live="polite">
        {copied ? '클립보드에 복사됨' : ''}
      </span>
      <span
        data-slot="selection-ring"
        className="pointer-events-none absolute inset-0"
        aria-hidden
        data-selected={selected ? '1' : '0'}
      />
    </button>
  )

  const outerClass = cn('flex h-full min-h-0 w-full min-w-0 self-stretch', className)

  if (!preview) {
    return (
      // eslint-disable-next-line design-system/no-inline-style -- forwards grid-column/grid-row/zIndex from TimetableGrid
      <div data-slot="timetable-appointment-block-root" className={outerClass} style={style}>
        {button}
      </div>
    )
  }

  return (
    // eslint-disable-next-line design-system/no-inline-style -- forwards grid-column/grid-row/zIndex from TimetableGrid
    <div data-slot="timetable-appointment-block-root" className={outerClass} style={style}>
      <Tooltip
        content={preview}
        side="top"
        delayDuration={200}
        className="relative flex h-full min-h-0 w-full min-w-0"
        triggerClassName="flex h-full min-h-0 w-full min-w-0"
        contentClassName="pointer-events-none max-w-[18rem] whitespace-normal rounded-lg text-left leading-snug shadow-float"
      >
        <div data-slot="hover-preview-wrap" className="flex h-full min-h-0 w-full min-w-0">
          {button}
        </div>
      </Tooltip>
    </div>
  )
}

export { TimetableAppointmentBlock }
export type { TimetableAppointmentBlockProps }
