import type { GeoJSON } from 'geojson'

/** 법정동 코드 행정 단계 (숫자가 클수록 하위·상세) */
export function regionCodeSpecificity(regionCode: string): number {
  if (regionCode.length < 10) return 0
  if (regionCode.slice(2) === '00000000') return 1
  if (regionCode.slice(5) === '00000') return 2
  const suffix = regionCode.slice(5)
  let trailingZeros = 0
  for (let i = suffix.length - 1; i >= 0 && suffix[i] === '0'; i--) {
    trailingZeros++
  }
  return 3 + (5 - trailingZeros)
}

function mergeBbox(
  a: [number, number, number, number] | null,
  b: [number, number, number, number],
): [number, number, number, number] {
  if (!a) return b
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])]
}

function ringBbox(ring: number[][]): [number, number, number, number] | null {
  if (ring.length === 0) return null
  let minLng = Infinity
  let minLat = Infinity
  let maxLng = -Infinity
  let maxLat = -Infinity
  for (const coord of ring) {
    const lng = coord[0]
    const lat = coord[1]
    if (lng == null || lat == null) continue
    minLng = Math.min(minLng, lng)
    minLat = Math.min(minLat, lat)
    maxLng = Math.max(maxLng, lng)
    maxLat = Math.max(maxLat, lat)
  }
  if (minLng === Infinity) return null
  return [minLng, minLat, maxLng, maxLat]
}

function geometryBbox(geometry: GeoJSON.Geometry): [number, number, number, number] | null {
  let bbox: [number, number, number, number] | null = null

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      const next = ringBbox(ring)
      if (next) bbox = mergeBbox(bbox, next)
    }
    return bbox
  }

  if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        const next = ringBbox(ring)
        if (next) bbox = mergeBbox(bbox, next)
      }
    }
    return bbox
  }

  return null
}

/** bbox 면적(대략) — 겹침 클릭 시 가장 하위 구역 우선 */
export function featureBBoxArea(feature: GeoJSON.Feature): number {
  if (!feature.geometry) return Number.POSITIVE_INFINITY
  const bbox = geometryBbox(feature.geometry)
  if (!bbox) return Number.POSITIVE_INFINITY
  const w = Math.max(0, bbox[2] - bbox[0])
  const h = Math.max(0, bbox[3] - bbox[1])
  return w * h
}

export function regionCodeFromProperties(properties: Record<string, unknown> | null): string {
  if (!properties) return ''
  return typeof properties.regionCode === 'string' ? properties.regionCode.trim() : ''
}

/**
 * 겹친 구역 클릭 시 읍·면·동·리(하위 코드) + 가장 작은 폴리곤을 선택한다.
 */
export function pickMostSpecificRegionFeature<T extends GeoJSON.Feature>(hits: T[]): T | undefined {
  if (hits.length === 0) return undefined
  if (hits.length === 1) return hits[0]

  return hits.reduce((best, current) => {
    const bestCode = regionCodeFromProperties((best.properties ?? {}) as Record<string, unknown>)
    const curCode = regionCodeFromProperties((current.properties ?? {}) as Record<string, unknown>)
    const bestSpec = regionCodeSpecificity(bestCode)
    const curSpec = regionCodeSpecificity(curCode)
    if (curSpec !== bestSpec) {
      return curSpec > bestSpec ? current : best
    }
    const bestArea = featureBBoxArea(best)
    const curArea = featureBBoxArea(current)
    return curArea < bestArea ? current : best
  })
}
