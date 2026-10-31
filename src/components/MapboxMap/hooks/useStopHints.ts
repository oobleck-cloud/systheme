'use client'

import { useEffect, useMemo } from 'react'

import { attachStopHints, hasHintTexts } from '../lib/stopHint'

import type { MapArrow, MapMarker, MapRouteLoop } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

interface UseStopHintsOptions {
  map: mapboxgl.Map | null
  arrows: MapArrow[]
  loops?: MapRouteLoop[]
  /** 핀도 자기 `tooltip` 을 들 수 있다 — 하나라도 있으면 질의를 붙인다 */
  markers?: MapMarker[]
  isLoaded: boolean
}

/**
 * 호버 힌트를 map 에 동기화한다.
 *
 * 문자열을 하나도 주지 않았으면 붙이지 않는다 — 답할 것이 없는 질의를 커서가 움직일 때마다
 * 돌릴 이유가 없다. 붙일지 말지만 의존성에 두는 것은 데이터가 바뀌어도 리스너를 갈 이유가
 * 없기 때문이다. 힌트는 소스에 실린 값을 그때그때 읽어 그린다.
 */
export function useStopHints({
  map,
  arrows,
  loops = [],
  markers = [],
  isLoaded,
}: UseStopHintsOptions): void {
  const enabled = useMemo(() => hasHintTexts(arrows, loops, markers), [arrows, loops, markers])

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return
    return attachStopHints(map)
  }, [map, isLoaded, enabled])
}
