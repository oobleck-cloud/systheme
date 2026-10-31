'use client'

import { useEffect, useRef } from 'react'

import { attachStopDrag, type StopDragHandlers } from '../lib/stopDrag'

import type mapboxgl from 'mapbox-gl'

interface UseStopDragOptions extends StopDragHandlers {
  map: mapboxgl.Map | null
  isLoaded: boolean
}

/**
 * 중간 표시 드래그를 map 에 동기화한다.
 *
 * 콜백은 `useMarkers` 와 같은 stable wrapper 패턴으로 감싼다 — 부모가 렌더될 때마다 새
 * 함수 참조가 오는데, 그것을 의존성에 두면 드래그 도중에 리스너가 통째로 갈리면서 잡고
 * 있던 세션이 취소된다.
 */
export function useStopDrag({
  map,
  isLoaded,
  onStopDragStart,
  onStopDrop,
  onStopDragCancel,
}: UseStopDragOptions): void {
  const latest = useRef<StopDragHandlers>({})
  latest.current = { onStopDragStart, onStopDrop, onStopDragCancel }

  const stable = useRef<StopDragHandlers>({
    onStopDragStart: (stopId) => latest.current.onStopDragStart?.(stopId),
    onStopDrop: (event) => latest.current.onStopDrop?.(event),
    onStopDragCancel: () => latest.current.onStopDragCancel?.(),
  })

  // 콜백을 하나도 주지 않았으면 붙이지 않는다 — 아무도 듣지 않는 hover 질의를 매 이동마다
  // 돌릴 이유가 없고, 중간 표시가 잡히는 물건이 아니라는 기존 성질도 그대로 남는다.
  const enabled = onStopDragStart != null || onStopDrop != null || onStopDragCancel != null

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return
    return attachStopDrag(map, stable.current)
  }, [map, isLoaded, enabled])
}
