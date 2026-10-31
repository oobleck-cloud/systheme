'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/utils/cn'

type SideSheetSide = 'left' | 'right'

type SideSheetHostContextValue = {
  /** 해당 side 의 포털 대상. 아직 마운트 전이면 null */
  slotFor: (side: SideSheetSide) => HTMLElement | null
}

const SideSheetHostContext = createContext<SideSheetHostContextValue | null>(null)

/**
 * `SideSheet` 이 자리를 얻는 레이아웃 앵커.
 *
 * 앱 셸의 최상위를 감싸면 본문과 시트가 **형제 플렉스 아이템**이 된다. 시트가 열리면
 * 본문 폭이 그만큼 줄고, 닫히면 되돌아온다 — 노션 사이드 피크와 같은 방식이다.
 * (덮는 방식은 `Drawer` — 이쪽은 자리를 뺏지 않고 위에 뜬다.)
 *
 * 시트는 이 호스트의 슬롯으로 포털된다. 화면 깊은 곳(위젯 안)에서 `<SideSheet>` 를 열어도
 * 폭 계산은 셸 한 곳에서만 일어나므로, 화면마다 레이아웃을 고칠 필요가 없다.
 *
 * `fixed` 로 떠 있는 크롬(AI Dock 등)은 플렉스 바깥이라 자동으로 비켜서지 못한다.
 * 호스트가 루트에 두 CSS 변수를 계속 갱신해 두니 그 값을 읽어 비켜서면 된다:
 * `--ds-side-sheet-inset-start` / `--ds-side-sheet-inset-end` (열려 있지 않으면 `0px`).
 *
 * ```tsx
 * <SideSheetHost className="h-dvh w-screen overflow-hidden">
 *   <div className="flex h-full w-full min-w-0 flex-col">…앱 셸…</div>
 * </SideSheetHost>
 * ```
 */
function SideSheetHost({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  const rootRef = useRef<HTMLDivElement>(null)
  const [leadingSlot, setLeadingSlot] = useState<HTMLDivElement | null>(null)
  const [trailingSlot, setTrailingSlot] = useState<HTMLDivElement | null>(null)

  // 슬롯 실폭 → CSS 변수. 애니메이션 중에도 매 프레임 갱신되므로 fixed 크롬이 같이 따라온다.
  useEffect(() => {
    const root = rootRef.current
    if (root == null) return

    const pairs: Array<[HTMLElement | null, string]> = [
      [leadingSlot, '--ds-side-sheet-inset-start'],
      [trailingSlot, '--ds-side-sheet-inset-end'],
    ]

    function publish() {
      for (const [el, name] of pairs) {
        root?.style.setProperty(name, `${el?.offsetWidth ?? 0}px`)
      }
    }

    publish()
    const observer = new ResizeObserver(publish)
    for (const [el] of pairs) if (el != null) observer.observe(el)

    return () => {
      observer.disconnect()
      for (const [, name] of pairs) root.style.removeProperty(name)
    }
  }, [leadingSlot, trailingSlot])

  const value = useMemo<SideSheetHostContextValue>(
    () => ({ slotFor: (side) => (side === 'left' ? leadingSlot : trailingSlot) }),
    [leadingSlot, trailingSlot],
  )

  return (
    <SideSheetHostContext.Provider value={value}>
      <div
        ref={rootRef}
        data-slot="side-sheet-host-root"
        // 덮는 폭의 시트가 **이 행**을 기준으로 놓인다 — 창 기준(fixed)이면 좁은 패널 안의
        // 호스트에서 창 전체를 덮어 버린다
        className={cn('relative flex min-h-0 min-w-0', className)}
        {...props}
      >
        <div ref={setLeadingSlot} data-slot="side-sheet-host-leading" className="flex shrink-0" />
        <div data-slot="side-sheet-host-content" className="flex min-h-0 min-w-0 flex-1">
          {children}
        </div>
        <div ref={setTrailingSlot} data-slot="side-sheet-host-trailing" className="flex shrink-0" />
      </div>
    </SideSheetHostContext.Provider>
  )
}

/**
 * 시트가 붙을 슬롯을 찾는다. 호스트 밖에서 부르면 던진다 — 조용히 위치가 어긋난 시트가
 * 렌더되는 것보다, 셸에 `SideSheetHost` 를 두지 않았다는 사실을 즉시 아는 편이 낫다.
 */
function useSideSheetHost(): SideSheetHostContextValue {
  const ctx = useContext(SideSheetHostContext)
  if (ctx == null) {
    throw new Error(
      'SideSheet must be used within <SideSheetHost>. 앱 셸 최상위를 SideSheetHost로 감싸세요. ' +
        '(화면 위에 덮는 서랍이 필요하면 Drawer를 쓰세요 — 호스트가 필요 없습니다.)',
    )
  }
  return ctx
}

export { SideSheetHost, useSideSheetHost }
export type { SideSheetSide }
