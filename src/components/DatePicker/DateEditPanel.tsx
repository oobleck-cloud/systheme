'use client'

import { useEffect, useRef, useState } from 'react'

import { Calendar, type CalendarProps } from '@/components/Calendar'
import { Input } from '@/components/Input'
import { Switch } from '@/components/Switch'
import { cn } from '@/utils/cn'

// 노션식 날짜 편집 패널 — 앵커/포털 없는 "패널 본문"(controlled). 여러 곳이 공유한다:
//   · DatePicker(트리거 + 포털 팝오버) — 단일 날짜 모드(enableRange/enableTime=false).
//   · @montize/collections 의 DateCellEditor(표 셀 ghost 트리거 + AnchorContextSurface) — 기간·시간 지원.
//
// 구성(노션 참고): [시작 날짜 입력 (+시간)] · [종료 날짜 입력 (+시간, 종료일 켜짐)] · [월 달력] ·
//   [종료일/시간 포함 토글] · [오늘 · 삭제]. 값은 { start, end, hasTime } 구조(DateEditValue).
//   달력은 "활성 필드(focused: start|end)"에 바인딩 — 필드를 클릭해 활성화하고 달력에서 날짜를 고른다.
//
// onChange 는 *라이브*(편집 즉시)로 흐른다 — 컨테이너가 닫기 정책을 정한다(DatePicker=선택 즉시 닫음,
// DateCellEditor=바깥 클릭 시 닫음, 그래서 기간/시간을 끝까지 편집 가능).

/** DateEditPanel 의 값 — 단일/기간/시간을 한 구조로. null=미설정. end=null 이면 단일 일자. */
export type DateEditValue = { start: Date; end: Date | null; hasTime: boolean } | null

/** 로컬 Date → "YYYY. MM. DD."(DatePicker 트리거·이 패널 날짜 입력의 공용 표기). */
export function formatDisplayDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}. ${m}. ${day}.`
}

/**
 * 날짜 입력 파싱 — "YYYY. M. D."·"YYYY-M-D"·"YYYY/M/D"(구분자·공백·후행점 관용) 또는 Date.parse 폴백.
 * 로컬 자정 Date. 잘못된 날짜(예: 2026-13-40)는 라운드트립 검증으로 거부. 빈 문자열/실패는 null.
 */
export function parseDisplayDate(raw: string): Date | null {
  const t = raw.trim()
  if (!t) return null
  const m = /^(\d{4})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\s*\.?$/.exec(t)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const date = new Date(y, mo - 1, d)
    return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d
      ? date
      : null
  }
  const parsed = Date.parse(t)
  return Number.isNaN(parsed) ? null : new Date(parsed)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function timeStr(d: Date | null): string {
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '00:00'
}

function startOfToday(): Date {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}

/** day 의 날짜 + (시간 모드일 때) ref 의 시각. 아니면 자정. */
function withTime(day: Date, ref: Date | null, timeOn: boolean): Date {
  if (timeOn && ref)
    return new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      ref.getHours(),
      ref.getMinutes(),
    )
  return new Date(day.getFullYear(), day.getMonth(), day.getDate())
}

type DateEditPanelProps = Pick<CalendarProps, 'showToday' | 'min' | 'max' | 'density'> & {
  /** 현재 값(controlled). null=미설정. */
  value?: DateEditValue
  /** 값이 바뀔 때(라이브). 컨테이너가 커밋/닫기를 처리. */
  onChange?: (value: DateEditValue) => void
  /** 종료일(기간) 토글 노출. 기본 true. false 면 단일 일자만(DatePicker). */
  enableRange?: boolean
  /** 시간 포함 토글 노출. 기본 true. false 면 날짜만(DatePicker). */
  enableTime?: boolean
  /** "삭제"(지움) — 값이 있을 때만 표시. 기본 true. */
  clearable?: boolean
  className?: string
}

/**
 * 날짜 편집 패널(노션식) — 입력 + 달력 + 종료일/시간 토글 + 오늘/삭제. 앵커/포털은 없다(호출자가 감싼다).
 */
function DateEditPanel({
  value = null,
  onChange,
  enableRange = true,
  enableTime = true,
  clearable = true,
  density = 'default',
  min,
  max,
  showToday,
  className,
}: DateEditPanelProps) {
  const start = value?.start ?? null
  const end = value?.end ?? null

  const [rangeOn, setRangeOn] = useState(() => enableRange && !!value?.end)
  const [timeOn, setTimeOn] = useState(() => enableTime && !!value?.hasTime)
  const [focused, setFocused] = useState<'start' | 'end'>('start')
  const [viewMonth, setViewMonth] = useState<Date>(() => value?.start ?? startOfToday())
  const [startDraft, setStartDraft] = useState(() => (start ? formatDisplayDate(start) : ''))
  const [endDraft, setEndDraft] = useState(() => (end ? formatDisplayDate(end) : ''))

  // 외부 value 변경(달력 픽·오늘 등으로 start/end 가 바뀜) 시 날짜 입력 표기를 동기화한다.
  const sig = `${start ? start.getTime() : ''}|${end ? end.getTime() : ''}`
  const lastSig = useRef(sig)
  useEffect(() => {
    if (lastSig.current === sig) return
    lastSig.current = sig
    setStartDraft(start ? formatDisplayDate(start) : '')
    setEndDraft(end ? formatDisplayDate(end) : '')
  }, [sig, start, end])

  // 값 조립 — start 없으면 null. r=false 면 종료 버린다. t=시간 포함.
  const commit = (s: Date | null, e: Date | null, r: boolean, t: boolean) => {
    if (!s) {
      onChange?.(null)
      return
    }
    onChange?.({ start: s, end: r ? e : null, hasTime: t })
  }

  const active = focused === 'end' ? end : start

  const pickDay = (day: Date) => {
    setViewMonth(day)
    if (rangeOn && focused === 'end') {
      commit(start, withTime(day, end, timeOn), true, timeOn)
    } else {
      commit(withTime(day, start, timeOn), end, rangeOn, timeOn)
      // 기간 모드에서 시작을 막 고르고 종료가 비었으면 다음 클릭이 종료로 가도록 활성 필드를 넘긴다.
      if (rangeOn && !end) setFocused('end')
    }
  }

  const commitDraft = (which: 'start' | 'end') => {
    const draft = which === 'start' ? startDraft : endDraft
    const ref = which === 'start' ? start : end
    const revert = () =>
      (which === 'start' ? setStartDraft : setEndDraft)(ref ? formatDisplayDate(ref) : '')
    if (draft.trim() === '') {
      if (which === 'start') commit(null, null, rangeOn, timeOn)
      else commit(start, null, rangeOn, timeOn)
      return
    }
    const parsed = parseDisplayDate(draft)
    if (!parsed) {
      revert()
      return
    }
    setViewMonth(parsed)
    if (which === 'start') commit(withTime(parsed, start, timeOn), end, rangeOn, timeOn)
    else commit(start, withTime(parsed, end, timeOn), rangeOn, timeOn)
  }

  const setFieldTime = (which: 'start' | 'end', hhmm: string) => {
    const [h, m] = hhmm.split(':')
    const hh = Number(h) || 0
    const mm = Number(m) || 0
    if (which === 'start') {
      if (!start) return
      commit(
        new Date(start.getFullYear(), start.getMonth(), start.getDate(), hh, mm),
        end,
        rangeOn,
        timeOn,
      )
    } else {
      if (!end) return
      commit(
        start,
        new Date(end.getFullYear(), end.getMonth(), end.getDate(), hh, mm),
        rangeOn,
        timeOn,
      )
    }
  }

  const toggleRange = (on: boolean) => {
    setRangeOn(on)
    setFocused(on && start ? 'end' : 'start')
    commit(start, on ? end : null, on, timeOn)
  }

  const toggleTime = (on: boolean) => {
    setTimeOn(on)
    commit(start, end, rangeOn, on)
  }

  const timeInputClass =
    'h-8 shrink-0 rounded-md border border-border bg-background px-2 text-sm text-fg focus-visible:border-primary focus-visible:outline-none'

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      {/* 시작(+종료) 날짜·시간 입력 */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5" onFocusCapture={() => setFocused('start')}>
          {rangeOn && <span className="w-8 shrink-0 text-xs text-fg-muted">시작</span>}
          <Input
            size="sm"
            value={startDraft}
            onValueChange={setStartDraft}
            onEnterKey={() => commitDraft('start')}
            onEscapeKey={() => setStartDraft(start ? formatDisplayDate(start) : '')}
            placeholder="YYYY. MM. DD."
            aria-label={rangeOn ? '시작 날짜' : '날짜'}
          />
          {timeOn && (
            <input
              type="time"
              value={timeStr(start)}
              onChange={(e) => setFieldTime('start', e.target.value)}
              aria-label="시작 시간"
              className={timeInputClass}
            />
          )}
        </div>
        {rangeOn && (
          <div className="flex items-center gap-1.5" onFocusCapture={() => setFocused('end')}>
            <span className="w-8 shrink-0 text-xs text-fg-muted">종료</span>
            <Input
              size="sm"
              value={endDraft}
              onValueChange={setEndDraft}
              onEnterKey={() => commitDraft('end')}
              onEscapeKey={() => setEndDraft(end ? formatDisplayDate(end) : '')}
              placeholder="YYYY. MM. DD."
              aria-label="종료 날짜"
            />
            {timeOn && (
              <input
                type="time"
                value={timeStr(end)}
                onChange={(e) => setFieldTime('end', e.target.value)}
                aria-label="종료 시간"
                className={timeInputClass}
              />
            )}
          </div>
        )}
      </div>

      <Calendar
        value={active}
        month={viewMonth}
        onMonthChange={setViewMonth}
        onChange={pickDay}
        showToday={showToday}
        min={min}
        max={max}
        density={density}
      />

      {/* 종료일/시간 토글 */}
      {(enableRange || enableTime) && (
        <div className="flex flex-col gap-2 border-t border-border pt-2">
          {enableRange && (
            <label className="flex items-center justify-between text-sm text-fg">
              <span>종료일</span>
              <Switch checked={rangeOn} onCheckedChange={toggleRange} aria-label="종료일 사용" />
            </label>
          )}
          {enableTime && (
            <label className="flex items-center justify-between text-sm text-fg">
              <span>시간 포함</span>
              <Switch checked={timeOn} onCheckedChange={toggleTime} aria-label="시간 포함" />
            </label>
          )}
        </div>
      )}

      {/* 오늘 / 삭제 */}
      <div className="flex items-center justify-between gap-1 border-t border-border pt-1.5">
        <button
          type="button"
          onClick={() => pickDay(startOfToday())}
          className="rounded-md px-2 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-surface hover:text-fg"
        >
          오늘
        </button>
        {clearable && start && (
          <button
            type="button"
            onClick={() => {
              setFocused('start')
              commit(null, null, rangeOn, timeOn)
            }}
            className="rounded-md px-2 py-1 text-xs text-fg-muted transition-colors hover:bg-surface hover:text-fg"
          >
            삭제
          </button>
        )}
      </div>
    </div>
  )
}

export { DateEditPanel }
export type { DateEditPanelProps }
