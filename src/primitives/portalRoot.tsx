'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * 떠 있는 층(팝오버·고르개·메뉴·툴팁·모달 …)을 붙일 곳.
 *
 * 기본은 `document.body` 그대로다. 앱 일부를 다른 테마(예: `.dark`)로 감싸면 body 로 나간 패널은 그 테마 밖이 되므로,
 * 그 부분을 `<PortalRootProvider container={el}>` 로 감싸 패널이 테마가 걸린 상자 안에 붙게 한다(패널은 fixed 라 자리는 같다).
 * `OverlayContainerProvider`(모달이 덮을 영역)와는 다르다: 모달은 그것이 있으면 그쪽을 먼저 쓴다.
 */
const PortalRootContext = createContext<HTMLElement | null>(null)

function PortalRootProvider({
  container,
  children,
}: {
  container: HTMLElement | null
  children: ReactNode
}) {
  return <PortalRootContext.Provider value={container}>{children}</PortalRootContext.Provider>
}

/** 포털을 붙일 곳. Provider 가 없거나 아직 상자가 없으면 document.body(서버 렌더에서는 null — 포털은 mounted 뒤에만 그린다) */
function usePortalRoot(): HTMLElement {
  const container = useContext(PortalRootContext)
  return (container ?? (typeof document === 'undefined' ? null : document.body)) as HTMLElement
}

export { PortalRootProvider, usePortalRoot }
