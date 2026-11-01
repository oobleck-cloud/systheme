'use client'

import { useEffect, useRef } from 'react'

import { bindLabelInteractions, removeLabelLayer, syncLabelLayer } from '../lib/labelLayers'

import type { MapLabel } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

interface UseLabelsOptions {
  map: mapboxgl.Map | null
  labels: MapLabel[]
  isLoaded: boolean
  onLabelClick?: (label: MapLabel) => void
}

/**
 * 캔버스 라벨 레이어를 map 에 동기화한다. 늦게 끝난 굽기는 runId 로 버린다.
 * 콜백은 ref 로 최신화한다 — 콜백이 바뀔 때마다 이벤트를 떼고 붙이지 않으려고.
 */
export function useLabels({ map, labels, isLoaded, onLabelClick }: UseLabelsOptions): void {
  const runIdRef = useRef(0)
  const latest = useRef({ labels, onLabelClick })
  latest.current = { labels, onLabelClick }

  useEffect(() => {
    if (!map || !isLoaded) return
    const runId = ++runIdRef.current
    syncLabelLayer(map, labels, () => runIdRef.current !== runId).catch((err) => {
      if (runIdRef.current === runId) console.error('[MapboxMap] 라벨 레이어 오류:', err)
    })
  }, [map, isLoaded, labels])

  useEffect(() => {
    if (!map || !isLoaded) return
    return bindLabelInteractions(map, (id) => {
      const label = latest.current.labels.find((item) => item.id === id)
      if (label) latest.current.onLabelClick?.(label)
    })
  }, [map, isLoaded])

  useEffect(
    () => () => {
      runIdRef.current += 1
      if (map) removeLabelLayer(map)
    },
    [map],
  )
}
