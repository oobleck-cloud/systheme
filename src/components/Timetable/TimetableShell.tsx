'use client'

import { useCallback, useEffect, useRef } from 'react'

import { cn } from '@/utils/cn'

const BURST_MS = 200
/** Ctrl/Cmd 더블프레스 인식 간격 (레거시 useNavigateVisitCounselByKeyboard 와 동일) */
const MODIFIER_DOUBLE_PRESS_MS = 400

function shouldIgnoreArrowNavigation(from: HTMLElement | null, allowInDialog: boolean): boolean {
  if (!from) return true
  // 기본적으로 dialog 안에서는 화살표 하이재킹을 피한다. 단, 시간표가 dialog 의 주 콘텐츠로
  // 키보드 조작을 담당하는 경우(모달 예약 등)엔 allowInDialog 로 이 가드를 해제한다.
  if (!allowInDialog && from.closest('[role="dialog"]')) return true
  if (from.closest('input, textarea, select, [contenteditable="true"]')) return true
  return false
}

/**
 * 포커스가 슬롯 칸 안에 있으면 화살표는 셸이 아니라 격자의 것이다.
 *
 * 셸의 화살표는 "무엇을 볼까"(날짜·시간 구간)를 움직이고, 격자의 화살표는 "무엇을 고를까"
 * (칸)를 움직인다. 칸에 들어와 있는 사람이 방향키를 누르는 건 칸을 옮기겠다는 뜻이므로
 * 여기서 캡처를 양보한다 — 안 그러면 칸 사이 키보드 이동이 아예 닿지 않는다.
 */
function isInsideSlotCell(from: HTMLElement | null): boolean {
  return from?.closest('[data-slot="timetable-time-slot-cell"]') != null
}

type TimetableShellProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** anatomy `controller-region` */
  controllerRegion: React.ReactNode
  /** anatomy `grid-region` */
  gridRegion: React.ReactNode
  /** anatomy `legend-region` — 격자 아래 칸 색의 뜻을 밝히는 띠 (없으면 렌더하지 않음) */
  legendRegion?: React.ReactNode
  /** 동일 방향 화살표 연타 시 — 방향을 포함해 상위에서 스위치 토글·이동·진동 등 처리 */
  onDeactiveRevealForced?: (direction: -1 | 1) => void
  /** ← / → 한 번에 한 칸씩 (날짜 스텝 등). 캡처 단계에서 처리해 자식 포커스에서도 동작 */
  onHorizontalArrow?: (direction: -1 | 1) => void
  /** ↑ / ↓ — 보이는 시간 윈도우 스크롤(-1=위/이전, 1=아래/다음). 캡처 단계 처리 */
  onVerticalArrow?: (direction: -1 | 1) => void
  /** Ctrl 또는 Cmd 더블프레스 — 필터(활성 일정만 보기 등) 토글 */
  onModifierDoublePress?: () => void
  /** 마운트 시 셸에 포커스 → 열자마자 화살표로 날짜/시간 이동 가능 (모달용) */
  autoFocus?: boolean
  /** dialog(role="dialog") 안에서도 화살표 네비게이션을 허용 (시간표가 모달 주 콘텐츠일 때) */
  captureArrowsInDialog?: boolean
  /**
   * 키보드 소유권 양보 — `true`이면 셸이 모든 키 캡처를 중단한다.
   * 날짜 캘린더 등 상위 오버레이가 키보드를 점유할 때 켜서, 시간표와 오버레이가
   * 같은 화살표 입력에 동시에 반응하는 포커스 중첩을 방지한다.
   */
  keyboardSuspended?: boolean
}

function TimetableShell({
  controllerRegion,
  gridRegion,
  legendRegion,
  onDeactiveRevealForced,
  onHorizontalArrow,
  onVerticalArrow,
  onModifierDoublePress,
  autoFocus = false,
  captureArrowsInDialog = false,
  keyboardSuspended = false,
  className,
  ...props
}: TimetableShellProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const burstRef = useRef<{ key: string; at: number; streak: number }>({
    key: '',
    at: 0,
    streak: 0,
  })
  const modifierRef = useRef<{ key: string; at: number }>({ key: '', at: 0 })

  // 마운트 시 셸 포커스. 부모 모달이 open 시 자체 rAF 로 패널에 포커스를 주므로
  // (자식 effect 가 먼저 스케줄됨) 중첩 rAF 로 한 프레임 뒤에 실행해 확실히 셸로 이동.
  useEffect(() => {
    if (!autoFocus) return
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => shellRef.current?.focus())
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [autoFocus])

  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // 키보드 소유권을 상위 오버레이(날짜 캘린더 등)에 넘긴 상태 — 아무 키도 처리하지 않는다.
      if (keyboardSuspended) return
      const from = e.target as HTMLElement | null
      // 포커스된 컴포넌트만 처리: 셸 DOM 밖(포탈된 날짜 캘린더 등)에서 온 키는 무시.
      // (React 포탈은 이벤트가 컴포넌트 트리를 타고 셸까지 오지만 DOM 상으론 셸 밖에 있음)
      if (from && !e.currentTarget.contains(from)) return
      if (shouldIgnoreArrowNavigation(from, captureArrowsInDialog)) return

      // Ctrl/Cmd 더블프레스 → 필터 토글 (레거시: 방문희망일시만 보기)
      if (e.key === 'Control' || e.key === 'Meta') {
        if (e.repeat) return
        const now = Date.now()
        const m = modifierRef.current
        if (m.key === e.key && now - m.at < MODIFIER_DOUBLE_PRESS_MS) {
          modifierRef.current = { key: '', at: 0 }
          onModifierDoublePress?.()
        } else {
          modifierRef.current = { key: e.key, at: now }
        }
        return
      }

      // 칸 안에서의 화살표는 격자(칸 이동)의 몫 — 셸은 손대지 않는다.
      if (
        (e.key === 'ArrowUp' ||
          e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight') &&
        isInsideSlotCell(from)
      ) {
        return
      }

      // ↑/↓ → 보이는 시간 윈도우 스크롤 (포커스가 셸에 있을 때).
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        onVerticalArrow?.(e.key === 'ArrowUp' ? -1 : 1)
        e.preventDefault()
        e.stopPropagation()
        return
      }

      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      const now = Date.now()
      const b = burstRef.current
      const sameDir = b.key === e.key
      const fresh = now - b.at < BURST_MS
      if (sameDir && fresh) {
        b.streak += 1
      } else {
        b.key = e.key
        b.streak = 1
      }
      b.at = now

      const dir = e.key === 'ArrowLeft' ? (-1 as const) : (1 as const)

      if (b.streak >= 2) {
        onDeactiveRevealForced?.(dir) // 토글 + 이동을 한 번에 처리
        b.streak = 0
        b.key = ''
      } else {
        onHorizontalArrow?.(dir)
      }
      e.preventDefault()
      e.stopPropagation()
    },
    [
      onDeactiveRevealForced,
      onHorizontalArrow,
      onVerticalArrow,
      onModifierDoublePress,
      captureArrowsInDialog,
      keyboardSuspended,
    ],
  )

  return (
    <div
      ref={shellRef}
      role="application"
      aria-label="시간표"
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- role="application" intentionally captures all keyboard input; tabIndex=0 is required so keyboard users can focus the grid before sending arrow / Enter / Esc events.
      tabIndex={0}
      data-slot="timetable-shell"
      onKeyDownCapture={handleKeyDownCapture}
      className={cn(
        // 컨트롤과 격자는 한 덩어리다 — 날짜·보는 구간·필터는 "이 격자를" 겨누는 조작이라
        // 따로 떨어진 패널로 두면 무엇의 이전인지, 무엇을 거르는지가 끊긴다.
        'overflow-hidden rounded-lg border border-border-subtle bg-background',
        'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    >
      <div data-slot="controller-region">{controllerRegion}</div>
      <div data-slot="grid-region" className="min-w-0">
        {gridRegion}
      </div>
      {legendRegion ? <div data-slot="legend-region">{legendRegion}</div> : null}
    </div>
  )
}

export { TimetableShell }
export type { TimetableShellProps }
