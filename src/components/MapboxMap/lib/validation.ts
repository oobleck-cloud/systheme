import type { LngLat, MapMarker } from '../types/mapbox.types'

export function validateLngLat(p: LngLat | undefined): boolean {
  if (!p) return false
  if (typeof p.lng !== 'number' || typeof p.lat !== 'number') return false
  if (Number.isNaN(p.lng) || Number.isNaN(p.lat)) return false
  return true
}

export function validateMarker(marker: MapMarker): boolean {
  return validateLngLat(marker.position)
}
