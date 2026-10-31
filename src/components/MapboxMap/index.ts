// ─── Primary API ─────────────────────────────────────────────────────────────
export { MapboxMap } from './MapboxMap'
export type { MapboxMapProps } from './MapboxMap'

/**
 * Mapbox GL JS 인스턴스를 공유하기 위한 Provider.
 * `MapboxMap`보다 낮은 레벨에서 직접 지도 설정을 제어할 때 사용합니다.
 */
export { MapProvider, useMapConfig, resolveStyleUrl } from './MapProvider'
export type { MapProviderProps, MapConfig } from './MapProvider'

// ─── Advanced / 확장 API ─────────────────────────────────────────────────────

/**
 * @advanced 마커 그룹 선택 상태를 하위 컴포넌트에 공유하는 Provider.
 * 일반 지도 사용에는 `MapboxMap`의 `markers` prop으로 충분합니다.
 */
export { MapboxSelectionProvider, useMapboxSelection } from './MapboxSelectionProvider'
export type { MapboxSelectionProviderProps } from './MapboxSelectionProvider'

/**
 * @advanced 커스텀 마커 아이콘 스프라이트를 Mapbox 이미지 레지스트리에 등록하는 컴포넌트.
 */
export { MarkerSprite } from './MarkerSprite'
export type { MarkerSpriteProps } from './MarkerSprite'

/**
 * @advanced 지도 위에 바운스 애니메이션을 주는 플로팅 요소.
 */
export { FloatingBounce } from './FloatingBounce'
export type { FloatingBounceProps } from './FloatingBounce'

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  LngLat,
  MapTheme,
  MapCamera,
  MapClusterOptions,
  MapMarker,
  MapOverlay,
  MapOverlayAnchor,
  MapArrow,
  MapArrowStop,
  MapRouteLoop,
  MapRouteLoopStop,
  MapPadding,
  MapRegionStyle,
  MapRegionState,
  MapRegionStyler,
  MapStopDropEvent,
  MapFeatureClickEvent,
  MapView,
  MarkerVariant,
} from './types/mapbox.types'
