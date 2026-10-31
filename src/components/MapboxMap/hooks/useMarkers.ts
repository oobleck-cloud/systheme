'use client'

import { useEffect, useRef } from 'react'

import { addMarkerLayers, removeMarkerLayers, type MarkerLayerHandlers } from '../lib/markerLayers'
import { validateMarker } from '../lib/validation'

import type { MapClusterOptions, MapMarker } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

interface UseMarkersOptions extends MarkerLayerHandlers {
  map: mapboxgl.Map | null
  markers: MapMarker[]
  isLoaded: boolean
  cluster?: MapClusterOptions
}

/**
 * 스프라이트 기반 마커 레이어를 map에 동기화한다.
 * 유효하지 않은 좌표는 자동으로 경고 + 스킵.
 *
 * ## 콜백 안정성 패턴 (Stable Wrapper)
 *
 * `onMarkerClick` 등 콜백은 부모 컴포넌트가 렌더링될 때마다 새 함수 참조로 교체된다.
 * 이를 `useEffect` 의존성에 넣으면 마커 레이어가 매 렌더마다 재설정되므로,
 * 아래 두 단계로 콜백 안정성을 보장한다.
 *
 * 1. `latestHandlers` ref: 렌더 바디에서 항상 최신 콜백으로 덮어씀 (effect 없이).
 * 2. `stableHandlers` ref: 최초 1회 생성되는 wrapper 함수 객체.
 *    각 wrapper는 호출 시점에 `latestHandlers.current`를 읽어 최신 콜백을 실행.
 *
 * `addMarkerLayers`(→ `bindInteractions`)는 `stableHandlers.current`를 받아
 * 안전하게 구조분해·클로저 캡처해도 항상 최신 콜백이 실행된다.
 */
export function useMarkers({
  map,
  markers,
  isLoaded,
  onMarkerClick,
  onActiveMarkerChange,
  onPopupOpen,
  onPopupClose,
  onActiveMarkerMount,
  onActiveMarkerUnmount,
  cluster,
}: UseMarkersOptions) {
  // 렌더마다 최신 콜백을 동기적으로 덮어쓴다 (effect 없이).
  const latestHandlers = useRef<MarkerLayerHandlers>({})
  latestHandlers.current = {
    onMarkerClick,
    onActiveMarkerChange,
    onPopupOpen,
    onPopupClose,
    onActiveMarkerMount,
    onActiveMarkerUnmount,
  }

  // stable wrapper: 최초 1회 생성. 각 함수는 호출 시점에 latestHandlers.current를 읽는다.
  // bindInteractions에서 구조분해해도 스테일 클로저가 발생하지 않는다.
  //
  // onActiveMarkerMount는 "외부 렌더 슬롯이 주입되었는지"를 markerLayers 쪽에서
  // 판별하는 토글 역할을 하므로, latestHandlers에 실제 콜백이 없을 때는 wrapper도
  // 없는 것으로 취급해야 한다. 아래 `activeMountWrapper`는 소비자가 Mount 콜백을
  // 명시적으로 넘겼을 때에만 markerLayers에 전달된다.
  const hasMountHandler = onActiveMarkerMount != null
  const stableHandlers = useRef<MarkerLayerHandlers>({
    onMarkerClick: (...args) => latestHandlers.current.onMarkerClick?.(...args),
    onActiveMarkerChange: (...args) => latestHandlers.current.onActiveMarkerChange?.(...args),
    onPopupOpen: (...args) => latestHandlers.current.onPopupOpen?.(...args),
    onPopupClose: () => latestHandlers.current.onPopupClose?.(),
    onActiveMarkerMount: (...args) => latestHandlers.current.onActiveMarkerMount?.(...args),
    onActiveMarkerUnmount: () => latestHandlers.current.onActiveMarkerUnmount?.(),
  })

  // 이번 effect 사이클에서 사용할 handlers.
  // "외부 렌더 슬롯"이 있는지는 소비자가 onActiveMarkerMount를 넘겼는지로만 판단되므로,
  // 없을 땐 onActiveMarkerMount/Unmount 필드 자체를 생략해 markerLayers의
  // hasExternalActiveRender가 false가 되도록 한다.
  const effectiveHandlers: MarkerLayerHandlers = hasMountHandler
    ? stableHandlers.current
    : {
        onMarkerClick: stableHandlers.current.onMarkerClick,
        onActiveMarkerChange: stableHandlers.current.onActiveMarkerChange,
        onPopupOpen: stableHandlers.current.onPopupOpen,
        onPopupClose: stableHandlers.current.onPopupClose,
      }

  useEffect(() => {
    if (!map || !isLoaded) return

    const valid = markers.filter((m) => {
      if (!validateMarker(m)) {
        console.warn('[MapboxMap] 유효하지 않은 마커 좌표:', m)
        return false
      }
      return true
    })

    if (valid.length === 0) {
      removeMarkerLayers(map)
      return
    }

    let cancelled = false
    let cleanup: (() => void) | null = null

    addMarkerLayers(map, valid, effectiveHandlers, cluster).then((fn) => {
      if (cancelled) fn()
      else cleanup = fn
    })

    return () => {
      cancelled = true
      if (cleanup) {
        cleanup()
        cleanup = null
      }
    }
    // cluster는 소스 생성 옵션이라 원시값으로 풀어 비교한다 (객체 리터럴 재생성 무시).
  }, [
    map,
    isLoaded,
    markers,
    cluster?.radius,
    cluster?.maxZoom,
    cluster?.color,
    cluster?.zoomOnClick,
    cluster != null,
  ])

  // 레이어·그림을 다 걷는 것은 지도가 바뀌거나 내려갈 때뿐이다. 데이터가 바뀔 때는 위 효과가
  // 제자리에서 갱신한다 — 매번 지웠다 다시 얹으면 핀·동선이 깜빡이고 아이콘 아틀라스가 흔들려
  // 스타일 아이콘이 검은 네모로 그려졌다(2026-09-28 상담지도).
  useEffect(
    () => () => {
      if (map) removeMarkerLayers(map)
    },
    [map],
  )
}
