'use client'

import { useEffect, useMemo, useRef } from 'react'

import { hitsLabel, LABEL_LAYER_ID } from '../lib/labelLayers'
import { pickMostSpecificRegionFeature } from '../lib/region-hit'

import type {
  MapFeatureClickEvent,
  MapRegionState,
  MapRegionStyle,
  MapRegionStyler,
} from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

const SOURCE_ID = 'region-geometry'
const FILL_LAYER_ID = 'region-fill'
const LINE_LAYER_ID = 'region-outline'

/** 스타일이 지정되지 않았을 때의 기본값 (디자인 시스템 blue-500 계열) */
const DEFAULT_STYLE: MapRegionStyle = {
  fillColor: 'rgba(5, 92, 245, 0.25)',
  fillOpacity: 0.35,
  lineColor: 'rgba(5, 92, 245, 0.6)',
  lineWidth: 1,
}

function mergeCollections(collections: GeoJSON.FeatureCollection[]): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = []
  for (const fc of collections) {
    if (fc.type === 'FeatureCollection' && Array.isArray(fc.features)) {
      features.push(...fc.features)
    }
  }
  return { type: 'FeatureCollection', features }
}

interface UseRegionsOptions<P = Record<string, unknown>> {
  map: mapboxgl.Map | null
  isLoaded: boolean
  regions?: GeoJSON.FeatureCollection<GeoJSON.Geometry, P>[]
  /** feature별 스타일 결정. 미지정 시 디자인 시스템 기본값 */
  getRegionStyle?: MapRegionStyler<P>
  /** 선택 판정. 하나라도 true면 나머지는 dimmed 상태로 스타일됨 */
  isRegionSelected?: (feature: GeoJSON.Feature<GeoJSON.Geometry, P>) => boolean
  /** 지역 클릭 콜백. 빈 곳 클릭 시 null */
  onRegionClick?: (event: MapFeatureClickEvent<P> | null) => void
}

/**
 * 지역(region) 레이어를 map에 동기화한다.
 *
 * 스타일/선택 로직은 모두 소비자 주입(`getRegionStyle` / `isRegionSelected`)으로
 * 처리되어 본 훅에는 도메인(서비스 구역 등) 개념이 없다.
 */
export function useRegions<P = Record<string, unknown>>({
  map,
  isLoaded,
  regions = [],
  getRegionStyle,
  isRegionSelected,
  onRegionClick,
}: UseRegionsOptions<P>) {
  const addedRef = useRef(false)
  const onRegionClickRef = useRef(onRegionClick)
  useEffect(() => {
    onRegionClickRef.current = onRegionClick
  }, [onRegionClick])

  const merged = useMemo(() => mergeCollections(regions as GeoJSON.FeatureCollection[]), [regions])

  /**
   * feature.properties에 스타일 토큰을 미리 주입해서 paint 시
   * `['get', 'regionFillColor']`만 쓰면 되도록 한다. (Mapbox expression 최소화)
   */
  const decorated = useMemo<GeoJSON.FeatureCollection>(() => {
    const hasAnySelected =
      isRegionSelected !== undefined &&
      merged.features.some((f) => isRegionSelected(f as GeoJSON.Feature<GeoJSON.Geometry, P>))

    const features = merged.features.map((f) => {
      const typed = f as GeoJSON.Feature<GeoJSON.Geometry, P>
      const selected = isRegionSelected !== undefined ? Boolean(isRegionSelected(typed)) : false
      const dimmed = hasAnySelected && !selected
      const state: MapRegionState = { selected, dimmed }
      const style = getRegionStyle ? getRegionStyle(typed, state) : DEFAULT_STYLE
      const props = (f.properties ?? {}) as Record<string, unknown>
      return {
        ...f,
        properties: {
          ...props,
          __regionFillColor: style.fillColor,
          __regionFillOpacity: style.fillOpacity ?? 0.35,
          __regionLineColor: style.lineColor,
          __regionLineWidth: style.lineWidth ?? 1,
        },
      }
    })

    return { type: 'FeatureCollection', features }
  }, [merged, getRegionStyle, isRegionSelected])

  // layer sync
  useEffect(() => {
    if (!map || !isLoaded) return

    const hasData = decorated.features.length > 0

    if (!hasData) {
      if (addedRef.current) {
        try {
          if (map.getLayer(LINE_LAYER_ID)) map.removeLayer(LINE_LAYER_ID)
          if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID)
          if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
        } catch {
          // map destroyed
        }
        addedRef.current = false
      }
      return
    }

    try {
      const source = map.getSource(SOURCE_ID)
      if (source) {
        ;(source as mapboxgl.GeoJSONSource).setData(decorated)
      } else {
        map.addSource(SOURCE_ID, { type: 'geojson', data: decorated })
        // 라벨이 있으면 그 밑으로 — 면이 칩을 덮지 않게
        const beforeId = map.getLayer(LABEL_LAYER_ID)
          ? LABEL_LAYER_ID
          : map.getLayer('markers-sprite')
            ? 'markers-sprite'
            : map.getLayer('arrows-line')
              ? 'arrows-line'
              : undefined
        map.addLayer(
          {
            id: FILL_LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            paint: {
              'fill-color': ['get', '__regionFillColor'] as unknown as string,
              'fill-opacity': ['get', '__regionFillOpacity'] as unknown as number,
            },
          },
          beforeId,
        )
        map.addLayer(
          {
            id: LINE_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            paint: {
              'line-color': ['get', '__regionLineColor'] as unknown as string,
              'line-width': ['get', '__regionLineWidth'] as unknown as number,
            },
          },
          beforeId,
        )
        addedRef.current = true
      }
    } catch {
      // map destroyed during theme switch
    }
  }, [map, isLoaded, decorated])

  // click handler
  useEffect(() => {
    if (!map || !isLoaded) return
    if (!onRegionClick) return

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      // 마커가 우선: 마커 hit 시 구역 처리 스킵
      if (map.getLayer('markers-sprite')) {
        const markerHits = map.queryRenderedFeatures(e.point, {
          layers: ['markers-sprite'],
        })
        if (markerHits.length > 0) return
      }
      // 라벨을 누른 것은 라벨 클릭이다 — 구역 클릭으로 한 번 더 해석하지 않는다
      if (hitsLabel(map, e.point)) return

      if (!map.getLayer(FILL_LAYER_ID)) {
        onRegionClickRef.current?.(null)
        return
      }

      const hits = map.queryRenderedFeatures(e.point, { layers: [FILL_LAYER_ID] })
      if (hits.length === 0) {
        onRegionClickRef.current?.(null)
        return
      }

      const f = pickMostSpecificRegionFeature(hits as unknown as GeoJSON.Feature[])
      if (!f) {
        onRegionClickRef.current?.(null)
        return
      }
      onRegionClickRef.current?.({
        feature: f as GeoJSON.Feature<GeoJSON.Geometry, P>,
        lngLat: { lng: e.lngLat.lng, lat: e.lngLat.lat },
      })
    }

    const handleMouseEnter = () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = 'pointer'
    }
    const handleMouseLeave = () => {
      if (map.getCanvas()) map.getCanvas().style.cursor = ''
    }

    map.on('click', handleClick)
    if (map.getLayer(FILL_LAYER_ID)) {
      map.on('mouseenter', FILL_LAYER_ID, handleMouseEnter)
      map.on('mouseleave', FILL_LAYER_ID, handleMouseLeave)
    }

    return () => {
      map.off('click', handleClick)
      try {
        map.off('mouseenter', FILL_LAYER_ID, handleMouseEnter)
        map.off('mouseleave', FILL_LAYER_ID, handleMouseLeave)
      } catch {
        // layer removed
      }
    }
  }, [map, isLoaded])

  useEffect(() => {
    const mapRef = map
    return () => {
      if (mapRef && addedRef.current) {
        try {
          if (mapRef.getLayer(LINE_LAYER_ID)) mapRef.removeLayer(LINE_LAYER_ID)
          if (mapRef.getLayer(FILL_LAYER_ID)) mapRef.removeLayer(FILL_LAYER_ID)
          if (mapRef.getSource(SOURCE_ID)) mapRef.removeSource(SOURCE_ID)
        } catch {
          // map already destroyed
        }
        addedRef.current = false
      }
    }
  }, [map])
}
