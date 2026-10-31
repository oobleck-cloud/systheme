'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useState } from 'react'

import type { MapOverlay } from '../types/mapbox.types'

/** 오버레이 내용을 그려 넣을 자리 — `MapboxMap` 이 여기로 포털을 연다. */
export interface MapOverlaySlot {
  id: string
  element: HTMLElement
}

interface UseOverlaysOptions {
  map: mapboxgl.Map | null
  overlays: MapOverlay[]
  isLoaded: boolean
}

/**
 * `MapOverlay[]` 를 mapbox 마커(DOM)로 붙이고, 내용을 그릴 빈 자리를 돌려준다.
 *
 * 마커 인스턴스는 좌표·앵커가 바뀔 때만 다시 만든다. 내용은 포털이 다시 그리므로
 * 서명에서 제외한다 — 집계 건수가 1 올랐다고 마커를 떼고 붙이면 줌 도중에 깜빡인다.
 */
export function useOverlays({ map, overlays, isLoaded }: UseOverlaysOptions): MapOverlaySlot[] {
  const [slots, setSlots] = useState<MapOverlaySlot[]>([])

  const signature = overlays
    .map((o) => `${o.id}@${o.position.lng},${o.position.lat}:${o.anchor ?? 'center'}`)
    .join('|')

  useEffect(() => {
    if (!map || !isLoaded || overlays.length === 0) {
      setSlots([])
      return
    }

    // 같은 커밋에서 지도가 재생성되면 이 effect 는 이미 제거된 인스턴스를 들고
    // 실행될 수 있다 — 제거된 지도에는 마커를 붙일 수 없다(appendChild 크래시).
    if (!map.getCanvasContainer()) {
      setSlots([])
      return
    }

    const created = overlays.map((overlay) => {
      const element = document.createElement('div')
      element.dataset.slot = 'mapbox-map-overlay-item'
      const marker = new mapboxgl.Marker({ element, anchor: overlay.anchor ?? 'center' })
        .setLngLat([overlay.position.lng, overlay.position.lat])
        .addTo(map)
      return { id: overlay.id, element, marker }
    })

    setSlots(created.map(({ id, element }) => ({ id, element })))

    return () => {
      created.forEach(({ marker }) => marker.remove())
      setSlots([])
    }
    // 내용(content)은 의도적으로 제외한다 — 위 주석 참고.
  }, [map, isLoaded, signature])

  return slots
}
