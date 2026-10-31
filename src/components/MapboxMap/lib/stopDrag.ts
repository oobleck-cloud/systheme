/**
 * 선 위 중간 표시를 끌어다 마커에 떨구는 상호작용.
 *
 * Mapbox 에는 피처 드래그가 없다. 직접 조립한다 — 핸들 위에서 `mousedown` 으로 집고,
 * 그동안 지도 자체의 이동을 꺼 두고, `mouseup` 자리에 무엇이 그려져 있는지 물어본다.
 *
 * 여기서 정하는 것은 "어느 표시를 어느 마커 위에 놓았다"까지다. 그게 배정인지 교환인지
 * 금지된 조합인지는 도메인 판단이라 소비자에게 넘긴다 — 디자인시스템이 뜻을 정하기 시작하면
 * 화면마다 다른 규칙을 여기에 밀어 넣게 된다.
 */
import { setHiddenLeg, STOP_HANDLE_LAYER_IDS, type MapLayerSpec } from './arrows'
import { MARKER_SPRITE_LAYER_ID } from './markerLayers'
import { hintTextLayerSpec, suppressHoverHint } from './stopHint'

import type { LngLat, MapStopDropEvent } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

const PREVIEW_SOURCE_ID = 'stop-drag-source'
const PREVIEW_LINE_LAYER_ID = 'stop-drag-line'
const PREVIEW_TIP_LAYER_ID = 'stop-drag-tip'
const PREVIEW_LABEL_LAYER_ID = 'stop-drag-label'
const DEFAULT_COLOR = '#055cf5'

// ── 순수 계산 ────────────────────────────────────────────────────────────────

/**
 * `queryRenderedFeatures` 결과 중 우리가 읽는 부분만 추린 것.
 *
 * 지도 인스턴스 없이 판정을 시험할 수 있도록 좁혀 둔다 — 여기가 틀리면 엉뚱한 마커에
 * 배정되는데, 그건 실제 지도를 띄우기 전에 잡아야 하는 종류의 오류다.
 */
export interface HitFeature {
  properties?: Record<string, unknown> | null
  geometry?: { type: string; coordinates?: unknown } | null
}

/** 표시가 놓인 구간의 두 끝 */
export interface StopLeg {
  from: LngLat
  to: LngLat
}

/** 집어 든 중간 표시 */
export interface StopHandle {
  stopId: string
  /** 집는 순간 그 표시가 있던 자리 */
  origin: LngLat
  /** 고무줄 색. 표시가 쓰던 색을 그대로 이어받는다 */
  color: string
  /**
   * 이 표시가 놓인 구간의 두 끝. 구간이 없으면 null.
   *
   * 이것이 있어야 프리뷰가 "구간을 커서 쪽으로 눌러 접은 V" 가 된다. 루프 위 표시처럼
   * 접을 양 끝이 없는 자리는 null 이고, 그때는 집은 자리에서 커서까지 단선으로 끈다.
   */
  leg: StopLeg | null
  /**
   * 끄는 동안 감출 구간 id. 감출 것이 없으면 null.
   *
   * V 를 그리는 동안 원래 선을 그대로 두면 곧은 선과 V 가 겹쳐, 자리를 옮기는 중이 아니라
   * 선이 하나 더 생긴 것으로 읽힌다.
   */
  legId: string | null
  /**
   * 끄는 동안 커서를 따라올 한 줄(`MapArrowStop.tooltip`). 소비자가 주지 않았으면 null.
   *
   * 이 값이 "지금 이 시각에 놓으려 한다"는 판단의 근거인데, 그것을 보려고 손을 멈추고 호버할
   * 수는 없다. 그래서 집는 순간 표시에서 떼어 와 프리뷰가 함께 들고 다닌다.
   */
  text: string | null
}

function pointFrom(geometry: HitFeature['geometry']): LngLat | null {
  if (!geometry || geometry.type !== 'Point') return null
  const coordinates = geometry.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const [lng, lat] = coordinates as unknown[]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null
  return { lng, lat }
}

/** 표시가 싣고 온 구간 끝 한쪽. 경위도가 스칼라 두 개로 실려 온다 */
function legEnd(properties: HitFeature['properties'], prefix: 'legFrom' | 'legTo'): LngLat | null {
  const lng = properties?.[`${prefix}Lng`]
  const lat = properties?.[`${prefix}Lat`]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null
  return { lng, lat }
}

/**
 * 표시가 싣고 온 구간의 두 끝. 한쪽이라도 성하지 않으면 구간이 없는 것으로 본다.
 *
 * 루프 위 표시가 그렇다 — 반쪽짜리 V 를 그리느니 단선으로 물러서는 편이 낫다.
 */
function legOf(properties: HitFeature['properties']): StopLeg | null {
  const from = legEnd(properties, 'legFrom')
  const to = legEnd(properties, 'legTo')
  return from && to ? { from, to } : null
}

/** 식별자로 쓸 수 있는 문자열만 통과시킨다 — 빈 문자열은 아무것도 가리키지 않는다 */
function idProp(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * 히트 레이어 질의 결과에서 집을 표시를 고른다. 없으면 null.
 *
 * 여러 개가 겹쳐 잡히면 가장 위에 그려진 것(질의 결과의 첫 번째)을 집는다.
 */
export function resolveStopHandle(features: readonly HitFeature[]): StopHandle | null {
  for (const feature of features) {
    const stopId = idProp(feature.properties?.id)
    if (!stopId) continue
    const origin = pointFrom(feature.geometry)
    if (!origin) continue
    const color = feature.properties?.color
    return {
      stopId,
      origin,
      color: typeof color === 'string' ? color : DEFAULT_COLOR,
      leg: legOf(feature.properties),
      legId: idProp(feature.properties?.legId),
      // 빈 문자열은 그릴 것이 없다는 뜻이라 id 와 같은 기준으로 거른다.
      text: idProp(feature.properties?.tooltip),
    }
  }
  return null
}

/**
 * 놓은 자리의 마커 id. 마커가 없으면 null.
 *
 * 클러스터 원은 여러 마커의 합이라 "어디에 놓았다"를 말할 수 없으므로 건너뛴다.
 */
export function resolveDropMarkerId(features: readonly HitFeature[]): string | null {
  for (const feature of features) {
    const properties = feature.properties
    if (!properties) continue
    if (properties.point_count != null) continue
    const id = properties.id
    if (typeof id === 'string' && id.length > 0) return id
  }
  return null
}

/**
 * 프리뷰(고무줄) 도형.
 *
 * 구간을 아는 표시는 **두 끝에서 커서로 접힌 V**(`[legFrom, cursor, legTo]`)를 그린다. 빈 자리를
 * 끄는 것은 새 선을 하나 더 긋는 일이 아니라 원래 구간을 커서 쪽으로 눌러 내리는 일이라서다 —
 * 원래 선은 그동안 감추므로(`setHiddenLeg`), 화면에서는 선 하나가 접히는 것으로 보인다.
 * 아직 움직이지 않은 첫 프레임에서는 커서가 표시 자리에 있어 V 가 원래 선과 그대로 겹친다.
 *
 * 구간을 모르는 표시(루프 위)는 집은 자리에서 커서까지 단선으로 물러선다.
 *
 * 화살표·루프 소스를 건드리지 않고 이 결과만 전용 소스에 흘린다 — 기존 소스를 갱신하면
 * `mousemove` 마다 화면 전체의 도형을 다시 만들게 된다.
 */
export function buildDragPreview(handle: StopHandle, cursor: LngLat): GeoJSON.FeatureCollection {
  const { color, leg, origin, text } = handle
  const coordinates: GeoJSON.Position[] = leg
    ? [
        [leg.from.lng, leg.from.lat],
        [cursor.lng, cursor.lat],
        [leg.to.lng, leg.to.lat],
      ]
    : [
        [origin.lng, origin.lat],
        [cursor.lng, cursor.lat],
      ]

  const features: GeoJSON.Feature[] = [
    {
      type: 'Feature',
      properties: { kind: 'rubber', color },
      geometry: { type: 'LineString', coordinates },
    },
    {
      type: 'Feature',
      properties: { kind: 'tip', color },
      geometry: { type: 'Point', coordinates: [cursor.lng, cursor.lat] },
    },
  ]

  // 끌고 있는 칸의 값을 커서 옆에 붙여 함께 옮긴다 — 손을 멈추고 물어볼 수 없는 값이라
  // 프리뷰가 들고 다닌다. 줄 것이 없으면(소비자가 문자열을 주지 않았으면) 아무것도 늘리지 않는다.
  if (text) {
    features.push({
      type: 'Feature',
      properties: { kind: 'label', color, text },
      geometry: { type: 'Point', coordinates: [cursor.lng, cursor.lat] },
    })
  }

  return { type: 'FeatureCollection', features }
}

/**
 * 프리뷰 레이어.
 *
 * 드래그가 시작될 때 만들고 끝나면 지운다. 늘 떠 있을 필요가 없는 데다, 스타일이 다시
 * 로드돼 사라져도 다음 `mousemove` 에서 되살아나므로 수명을 짧게 두는 편이 안전하다.
 */
export const STOP_DRAG_PREVIEW_LAYERS: MapLayerSpec[] = [
  {
    id: PREVIEW_LINE_LAYER_ID,
    type: 'line',
    source: PREVIEW_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'rubber'],
    // V 의 꼭짓점이 커서 위에서 뾰족하게 튀지 않도록 이음매를 둥글린다.
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2.5,
      // 점선이라 확정된 선(실선)과 한눈에 구분된다 — 아직 놓지 않았다는 뜻.
      'line-dasharray': [1.5, 1.5],
      'line-opacity': 0.9,
    },
  },
  {
    id: PREVIEW_TIP_LAYER_ID,
    type: 'circle',
    source: PREVIEW_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'tip'],
    paint: {
      'circle-radius': 5.5,
      'circle-color': '#ffffff',
      'circle-stroke-color': ['get', 'color'],
      'circle-stroke-width': 2.5,
    },
  },
  // 커서를 따라오는 한 줄. 호버 힌트와 같은 모양을 쓴다 — 같은 값을 두 가지 글자로 보여 주면
  // 사용자는 서로 다른 두 표시를 배운다.
  hintTextLayerSpec({
    id: PREVIEW_LABEL_LAYER_ID,
    source: PREVIEW_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'label'],
  }),
]

// ── 런타임 ───────────────────────────────────────────────────────────────────

/**
 * 드래그 콜백.
 *
 * 드래그가 시작되면 반드시 둘 중 하나로 끝난다 — 마커 위에 놓은 `onStopDrop`, 또는
 * `onStopDragCancel`. 소비자는 두 곳에서 강조를 거두면 되고, 두 번 불릴 일은 없다.
 * (마커 밖에 놓으면 `markerId: null` 인 `onStopDrop` 뒤에 `onStopDragCancel` 이 따라온다 —
 * "무슨 일이 있었나"와 "배정은 성립하지 않았다"를 둘 다 알려야 하기 때문이다.)
 */
export interface StopDragHandlers {
  onStopDragStart?: (stopId: string) => void
  onStopDrop?: (event: MapStopDropEvent) => void
  onStopDragCancel?: () => void
}

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

/** 존재하는 레이어에만 질의한다 — 없는 레이어 id 를 넘기면 mapbox 가 오류를 낸다 */
function queryLayers(
  map: mapboxgl.Map,
  point: [number, number],
  layerIds: readonly string[],
): HitFeature[] {
  const layers = layerIds.filter((id) => map.getLayer(id))
  if (layers.length === 0) return []
  try {
    return map.queryRenderedFeatures(point, { layers }) as unknown as HitFeature[]
  } catch {
    // 스타일 교체 직후처럼 질의가 성립하지 않는 순간 — 아무것도 못 잡은 것으로 둔다.
    return []
  }
}

/**
 * 커서.
 *
 * 되돌릴 때는 우리가 걸어 둔 값일 때만 지운다 — 마커 hover 가 `pointer` 를 걸어 둔 것을
 * 빼앗으면 마커 위에서 커서가 깜빡인다.
 */
function setCursor(map: mapboxgl.Map, value: 'grab' | 'grabbing' | null): void {
  const canvas = map.getCanvas()
  if (!canvas) return
  if (value == null) {
    if (canvas.style.cursor === 'grab' || canvas.style.cursor === 'grabbing') {
      canvas.style.cursor = ''
    }
    return
  }
  canvas.style.cursor = value
}

function ensurePreviewLayers(map: mapboxgl.Map): void {
  try {
    if (!map.getSource(PREVIEW_SOURCE_ID)) {
      map.addSource(PREVIEW_SOURCE_ID, { type: 'geojson', data: EMPTY_COLLECTION })
    }
    for (const layer of STOP_DRAG_PREVIEW_LAYERS) {
      if (!map.getLayer(layer.id)) map.addLayer(layer)
    }
  } catch {
    // 스타일이 아직 준비되지 않은 순간 — 다음 이동에서 다시 시도한다.
  }
}

function setPreviewData(map: mapboxgl.Map, data: GeoJSON.FeatureCollection): void {
  const source = map.getSource(PREVIEW_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  source?.setData(data)
}

/** 프리뷰 레이어·소스를 걷는다. `removeArrowLayers` 와 같은 역할 */
export function removeStopDragLayers(map: mapboxgl.Map | null | undefined): void {
  if (!map) return
  try {
    for (const layerId of [PREVIEW_LABEL_LAYER_ID, PREVIEW_TIP_LAYER_ID, PREVIEW_LINE_LAYER_ID]) {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
    }
    if (map.getSource(PREVIEW_SOURCE_ID)) map.removeSource(PREVIEW_SOURCE_ID)
  } catch {
    // map 이 이미 제거된 경우 무시
  }
}

interface DragSession {
  handle: StopHandle
  /** 드래그 전에 켜져 있던 카메라 조작 — 끝나면 있던 대로 되돌린다 */
  restore: { dragPan: boolean; scrollZoom: boolean }
}

type PointerEventLike = mapboxgl.MapMouseEvent | mapboxgl.MapTouchEvent

function eventPoint(event: PointerEventLike): [number, number] {
  return [event.point.x, event.point.y]
}

function eventLngLat(event: PointerEventLike): LngLat {
  return { lng: event.lngLat.lng, lat: event.lngLat.lat }
}

/**
 * 드래그 상호작용을 map 에 붙인다. 반환된 함수로 완전히 걷힌다.
 *
 * 걷을 때 진행 중인 드래그가 있으면 취소로 끝낸다 — `dragPan` 을 꺼 둔 채로 두면 지도가
 * 영영 움직이지 않고, 소비자의 강조도 켜진 채로 남는다.
 */
export function attachStopDrag(map: mapboxgl.Map, handlers: StopDragHandlers): () => void {
  let session: DragSession | null = null

  const onHover = (event: mapboxgl.MapMouseEvent) => {
    if (session) return
    const handle = resolveStopHandle(queryLayers(map, eventPoint(event), STOP_HANDLE_LAYER_IDS))
    setCursor(map, handle ? 'grab' : null)
  }

  const onDragMove = (event: PointerEventLike) => {
    if (!session) return
    // 스타일이 다시 로드되면 프리뷰 소스가 통째로 사라진다 — 조용히 다시 만든다.
    ensurePreviewLayers(map)
    setPreviewData(map, buildDragPreview(session.handle, eventLngLat(event)))
  }

  const onDragEnd = (event: PointerEventLike) => {
    if (!session) return
    drop(eventPoint(event), eventLngLat(event))
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') cancel()
  }

  /**
   * 캔버스 밖에서 손을 뗀 경우.
   *
   * 지도의 `mouseup` 은 캔버스 위에서만 온다. 그것이 먼저 처리되면 세션이 이미 비어 있으므로
   * 여기서는 아무 일도 일어나지 않는다 — 남아 있다면 지도 밖에서 놓은 것이다.
   */
  const onWindowMouseUp = () => {
    if (session) cancel()
  }

  const bindDragListeners = () => {
    map.on('mousemove', onDragMove)
    map.on('touchmove', onDragMove)
    map.on('mouseup', onDragEnd)
    map.on('touchend', onDragEnd)
    map.on('touchcancel', cancel)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('mouseup', onWindowMouseUp)
  }

  const unbindDragListeners = () => {
    map.off('mousemove', onDragMove)
    map.off('touchmove', onDragMove)
    map.off('mouseup', onDragEnd)
    map.off('touchend', onDragEnd)
    map.off('touchcancel', cancel)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('mouseup', onWindowMouseUp)
  }

  const start = (handle: StopHandle) => {
    const restore = { dragPan: map.dragPan.isEnabled(), scrollZoom: map.scrollZoom.isEnabled() }
    // 지도가 함께 움직이면 손끝과 도형이 어긋난다. 확대까지 막는 이유는 표시의 자리가 픽셀
    // 계산이라, 배율이 바뀌면 붙잡고 있던 고무줄의 시작점이 다른 곳으로 옮겨가기 때문이다.
    map.dragPan.disable()
    map.scrollZoom.disable()
    session = { handle, restore }
    // 원래 구간을 걷어내고 같은 자리에 V 프리뷰를 세운다. 첫 프레임의 V 는 아직 원래 선과
    // 겹쳐 있으므로, 눈에는 실선이 점선으로 바뀌었을 뿐 도형이 뛰지 않는다.
    if (handle.legId != null) setHiddenLeg(map, handle.legId)
    // 끄는 동안 커서를 따라오는 줄이 이미 하나 있다 — 호버 답까지 겹쳐 뜨지 않게 재워 둔다.
    suppressHoverHint(map, true)
    ensurePreviewLayers(map)
    setPreviewData(map, buildDragPreview(handle, handle.origin))
    setCursor(map, 'grabbing')
    bindDragListeners()
    handlers.onStopDragStart?.(handle.stopId)
  }

  /** 세션을 끝내고 지도를 원래대로 되돌린다. 콜백은 부르지 않는다 */
  function teardown(): void {
    if (!session) return
    const { restore, handle } = session
    session = null
    unbindDragListeners()
    // 감춰 둔 구간은 반드시 되돌린다 — 드롭이든 취소든 여기를 지나므로, 빠뜨리면 선이
    // 사라진 채로 남는다.
    if (handle.legId != null) setHiddenLeg(map, null)
    if (restore.dragPan) map.dragPan.enable()
    if (restore.scrollZoom) map.scrollZoom.enable()
    setPreviewData(map, EMPTY_COLLECTION)
    setCursor(map, null)
    // 재워 둔 호버를 깨운다. 드롭이든 취소든 여기를 지나므로 빠뜨리면 호버가 영영 침묵한다.
    suppressHoverHint(map, false)
  }

  function cancel(): void {
    if (!session) return
    teardown()
    handlers.onStopDragCancel?.()
  }

  function drop(point: [number, number], lngLat: LngLat): void {
    const current = session
    if (!current) return
    const markerId = resolveDropMarkerId(queryLayers(map, point, [MARKER_SPRITE_LAYER_ID]))
    teardown()
    handlers.onStopDrop?.({ stopId: current.handle.stopId, markerId, lngLat })
    // 마커 밖에 놓은 것은 배정이 성립하지 않은 것 — 강조를 거두라는 신호를 따로 준다.
    if (markerId == null) handlers.onStopDragCancel?.()
  }

  const onMouseDown = (event: mapboxgl.MapMouseEvent) => {
    if (session) return
    if (event.originalEvent.button !== 0) return
    const handle = resolveStopHandle(queryLayers(map, eventPoint(event), STOP_HANDLE_LAYER_IDS))
    if (!handle) return
    // `dragPan.disable()` 만으로는 이미 시작된 이 mousedown 의 기본 동작(지도 끌기·텍스트 선택)이
    // 남을 수 있어 함께 막는다.
    event.preventDefault()
    start(handle)
  }

  const onTouchStart = (event: mapboxgl.MapTouchEvent) => {
    if (session) return
    // 두 손가락은 지도 제스처(확대·회전)다. 핸들 드래그는 한 손가락일 때만 성립한다.
    if (event.points.length !== 1) return
    const handle = resolveStopHandle(queryLayers(map, eventPoint(event), STOP_HANDLE_LAYER_IDS))
    if (!handle) return
    event.preventDefault()
    start(handle)
  }

  map.on('mousemove', onHover)
  map.on('mousedown', onMouseDown)
  map.on('touchstart', onTouchStart)

  return () => {
    map.off('mousemove', onHover)
    map.off('mousedown', onMouseDown)
    map.off('touchstart', onTouchStart)
    cancel()
    removeStopDragLayers(map)
  }
}
