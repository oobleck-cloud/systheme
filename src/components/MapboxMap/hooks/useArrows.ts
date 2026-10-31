'use client'

import { useEffect, useRef } from 'react'

import { addArrowLayers, removeArrowLayers } from '../lib/arrows'

import type { MapArrow, MapMarker, MapRouteLoop } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

interface UseArrowsOptions {
  map: mapboxgl.Map | null
  arrows: MapArrow[]
  markers: MapMarker[]
  /** 겹친 좌표를 둘러앉히는 원 */
  loops?: MapRouteLoop[]
  isLoaded: boolean
}

/**
 * 마커 간 화살표 레이어를 map에 동기화한다.
 * `follow: 'road'`인 화살표는 Mapbox Directions API를 호출하므로
 * stale 결과가 들어오지 않게 runId로 취소한다.
 */
export function useArrows({ map, arrows, markers, loops = [], isLoaded }: UseArrowsOptions): void {
  const runIdRef = useRef(0)

  useEffect(() => {
    if (!map || !isLoaded) return

    const runId = ++runIdRef.current
    if (arrows.length === 0 && loops.length === 0) {
      removeArrowLayers(map)
      return
    }

    // 지우지 않고 제자리에서 갱신한다. 예전에는 데이터가 바뀔 때마다(줌·선택·실시간 갱신)
    // 먼저 다 걷고 경로를 비동기로 다시 계산해 얹어, 그 사이 동선이 사라졌다 나타났다
    // (2026-09-28 상담지도 "동선이 깜빡인다"). 늦게 끝난 계산은 runId 로 버린다.
    addArrowLayers(map, arrows, markers, () => runIdRef.current !== runId, loops).catch((err) => {
      if (runIdRef.current === runId) {
        console.error('[MapboxMap] 화살표 레이어 추가 오류:', err)
      }
    })
  }, [map, isLoaded, arrows, markers, loops])

  useEffect(
    () => () => {
      runIdRef.current += 1
      if (map) removeArrowLayers(map)
    },
    [map],
  )
}
