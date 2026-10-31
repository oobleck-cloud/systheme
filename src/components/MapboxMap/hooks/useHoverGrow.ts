'use client'

import { useEffect } from 'react'

import { attachHoverGrow } from '../lib/hoverGrow'

import type mapboxgl from 'mapbox-gl'

interface UseHoverGrowOptions {
  map: mapboxgl.Map | null
  isLoaded: boolean
  enabled: boolean
}

/**
 * 커서에 가까운 노드를 키우는 질의를 map 에 동기화한다.
 *
 * 켜지 않은 지도에는 붙이지 않는다 — 레이어 값을 하나도 바꾸지 않으므로 다른 화면의 지도는
 * 지금과 똑같이 그려진다. 붙일지 말지만 의존성에 둔다. 노드는 질의할 때마다 지도에서 읽는다.
 */
export function useHoverGrow({ map, isLoaded, enabled }: UseHoverGrowOptions): void {
  useEffect(() => {
    if (!map || !isLoaded || !enabled) return
    return attachHoverGrow(map)
  }, [map, isLoaded, enabled])
}
