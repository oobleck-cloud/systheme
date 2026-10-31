'use client'

import { createContext, useContext } from 'react'

/**
 * 오버레이(Modal 등)의 portal 대상 컨테이너.
 *
 * - `null`(기본): `document.body`로 portal → 뷰포트 전체를 덮는다.
 * - element 지정: 그 element 안으로 portal하고 스크림을 그 영역으로 제한한다.
 *   (예: 탭 패널 페이지만 덮고 사이드바·탭바는 덮지 않음)
 *
 * 컨테이너는 오버레이의 `absolute inset-0` 기준이 되도록 **`position: relative`** 여야 한다.
 */
const OverlayContainerContext = createContext<HTMLElement | null>(null)

export function OverlayContainerProvider({
  container,
  children,
}: {
  container: HTMLElement | null
  children: React.ReactNode
}) {
  return (
    <OverlayContainerContext.Provider value={container}>
      {children}
    </OverlayContainerContext.Provider>
  )
}

/** 현재 스코프의 오버레이 portal 컨테이너. provider가 없으면 `null`(= document.body). */
export function useOverlayContainer(): HTMLElement | null {
  return useContext(OverlayContainerContext)
}
