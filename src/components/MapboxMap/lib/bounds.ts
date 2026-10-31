import mapboxgl from 'mapbox-gl'

import type { LngLat, MapMarker, MapPadding } from '../types/mapbox.types'

const DEFAULT_PADDING = 50

function resolvePadding(padding?: MapPadding): number | mapboxgl.PaddingOptions {
  if (!padding) return DEFAULT_PADDING
  return {
    top: padding.top ?? DEFAULT_PADDING,
    right: padding.right ?? DEFAULT_PADDING,
    bottom: padding.bottom ?? DEFAULT_PADDING,
    left: padding.left ?? DEFAULT_PADDING,
  }
}

function extractCoordinates(geom: GeoJSON.Geometry): [number, number][] {
  const coords: [number, number][] = []
  const visit = (c: unknown): void => {
    if (Array.isArray(c)) {
      if (c.length >= 2 && typeof c[0] === 'number' && typeof c[1] === 'number') {
        coords.push([c[0], c[1]])
      } else {
        c.forEach(visit)
      }
    }
  }
  if (geom.type === 'Point') {
    coords.push(geom.coordinates as [number, number])
  } else if (geom.type === 'MultiPoint' || geom.type === 'LineString') {
    ;(geom.coordinates as [number, number][]).forEach(visit)
  } else if (geom.type === 'Polygon' || geom.type === 'MultiLineString') {
    ;(geom.coordinates as [number, number][][]).forEach(visit)
  } else if (geom.type === 'MultiPolygon') {
    ;(geom.coordinates as [number, number][][][]).forEach(visit)
  }
  return coords
}

export function calculateBoundsFromGeoJSON(
  collections: GeoJSON.FeatureCollection[],
): mapboxgl.LngLatBounds | null {
  const coords: [number, number][] = []
  for (const fc of collections) {
    if (fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) continue
    for (const f of fc.features) {
      if (f.type === 'Feature' && f.geometry) {
        coords.push(...extractCoordinates(f.geometry))
      }
    }
  }
  if (coords.length === 0) return null
  const bounds = new mapboxgl.LngLatBounds()
  coords.forEach(([lng, lat]) => bounds.extend([lng, lat]))
  return bounds.isEmpty() ? null : bounds
}

export function calculateBoundsFromMarkers(markers: MapMarker[]): mapboxgl.LngLatBounds | null {
  if (markers.length === 0) return null
  const bounds = new mapboxgl.LngLatBounds()
  markers.forEach((m) => bounds.extend([m.position.lng, m.position.lat]))
  return bounds.isEmpty() ? null : bounds
}

export interface AdjustBoundsOptions {
  markers: MapMarker[]
  regions?: GeoJSON.FeatureCollection[]
  center: LngLat
  zoom: number
  autoFit: boolean
  /** 지도 위에 떠 있는 패널만큼 비워둘 여백 (px). 기본값 50 */
  padding?: MapPadding
}

/**
 * 지도를 markers + regions 전체가 들어오게 조정한다.
 * - 둘 다 비어 있으면 center/zoom 기본값으로 이동
 * - 1개 마커만 있으면 해당 좌표로 flyTo
 */
export function adjustMapBounds(map: mapboxgl.Map, options: AdjustBoundsOptions): void {
  const { markers, regions, center, zoom, autoFit } = options
  const padding = resolvePadding(options.padding)

  const markerBounds = calculateBoundsFromMarkers(markers)
  const regionBounds = calculateBoundsFromGeoJSON(regions ?? [])

  const merged = new mapboxgl.LngLatBounds()
  let hasAny = false
  if (markerBounds && !markerBounds.isEmpty()) {
    merged.extend(markerBounds.getSouthWest())
    merged.extend(markerBounds.getNorthEast())
    hasAny = true
  }
  if (regionBounds && !regionBounds.isEmpty()) {
    merged.extend(regionBounds.getSouthWest())
    merged.extend(regionBounds.getNorthEast())
    hasAny = true
  }

  // 일자/선택 변경 시 카메라가 부드럽게 ease in/out으로 이동하도록 모든 분기에
  // 동일한 duration을 적용한다. 단일 포인트(fitBounds 결과가 한 점으로 수렴)는
  // fitBounds 대신 flyTo로 처리해서 maxZoom까지 자연스럽게 줌인.
  const EASE_DURATION = 600

  if (hasAny && !merged.isEmpty() && autoFit) {
    const sw = merged.getSouthWest()
    const ne = merged.getNorthEast()
    const isSinglePoint = sw.lng === ne.lng && sw.lat === ne.lat
    if (isSinglePoint) {
      map.flyTo({ center: [sw.lng, sw.lat], zoom: 16, duration: EASE_DURATION })
    } else {
      map.fitBounds(merged, {
        padding,
        maxZoom: 18,
        duration: EASE_DURATION,
      })
    }
    return
  }

  if (markers.length === 0) {
    map.flyTo({ center: [center.lng, center.lat], zoom, duration: EASE_DURATION })
    return
  }

  if (markers.length === 1) {
    const m = markers[0]
    map.flyTo({
      center: [m.position.lng, m.position.lat],
      zoom: 16,
      duration: EASE_DURATION,
    })
    return
  }

  if (autoFit && markerBounds && !markerBounds.isEmpty()) {
    map.fitBounds(markerBounds, { padding, maxZoom: 18, duration: EASE_DURATION })
    return
  }

  const first = markers[0]
  map.flyTo({
    center: [first.position.lng, first.position.lat],
    zoom,
    duration: EASE_DURATION,
  })
}
