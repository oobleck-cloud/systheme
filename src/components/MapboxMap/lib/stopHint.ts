/**
 * 물었을 때만 답하는 한 줄.
 *
 * 지도에는 이미 역 배지·선 위 이름·빈 자리 원·구역 라벨이 올라가 있다. 여기에 시각을 상시로
 * 더하면 노선 하나에 글자가 두 배가 되고, 정작 읽어야 할 것이 먼저 밀려난다. 그래서 이 텍스트는
 * **커서가 가리키는 동안에만** 존재한다 — 레이어도 소스도 첫 호버에 만들고, 손을 떼면 비운다.
 *
 * 그리는 문자열은 소비자가 준다(`MapArrowStop.tooltip` · `MapArrow.tooltip`). 디자인시스템은
 * 시각도 여유도 모른다 — 뜻을 만들기 시작하면 화면마다 다른 포맷을 여기에 밀어 넣게 된다.
 *
 * 끄는 동안 커서를 따라오는 텍스트는 드래그 프리뷰(`stopDrag.ts`)가 자기 소스에 함께 그린다.
 * 여기서는 그 모양(`hintTextLayerSpec`)만 내주고, 호버가 끼어들지 않도록 잠깐 입을 다문다
 * (`suppressHoverHint`) — 같은 순간에 두 줄이 뜨면 어느 쪽이 지금 손에 든 값인지 흐려진다.
 */
import { ARROW_LINE_LAYER_ID, STOP_HANDLE_LAYER_IDS, type MapLayerSpec } from './arrows'
import { MARKER_SPRITE_LAYER_ID } from './markerLayers'

import type { LngLat, MapArrow, MapArrowStop, MapMarker, MapRouteLoop } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'
import type { SymbolLayerSpecification } from 'mapbox-gl'

const HINT_SOURCE_ID = 'stop-hint-source'
const HINT_LAYER_ID = 'stop-hint-label'

/**
 * 선 호버의 허용 오차 (px).
 *
 * 선은 굵어야 4.5px 이라 정확히 올라가야만 잡히면 사실상 못 잡는다. 표시처럼 투명한 히트
 * 도형을 덧그리는 방법은 선에 쓸 수 없다 — 두꺼운 띠가 그 아래의 마커·표시를 전부 가로챈다.
 * 대신 질의를 점이 아니라 작은 상자로 던져 손 떨림만큼을 메운다.
 */
const LINE_HIT_TOLERANCE = 6

const EMPTY_COLLECTION: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

/**
 * 힌트 텍스트 레이어의 모양.
 *
 * 호버로 뜨는 줄과 끌면서 따라오는 줄은 같은 물건이어야 한다 — 하나는 소스가 다르다는 이유로
 * 크기나 색이 어긋나면, 사용자는 서로 다른 두 표시를 배운다. 그래서 모양은 한 곳에서만 정한다.
 */
export function hintTextLayerSpec(
  spec: Pick<SymbolLayerSpecification, 'id' | 'source' | 'filter'>,
): SymbolLayerSpecification {
  return {
    ...spec,
    type: 'symbol',
    layout: {
      'text-field': ['get', 'text'],
      'text-size': 12,
      // 가리키는 점의 오른쪽에 붙인다 — 점 위에 겹치면 정작 가리킨 것을 가린다.
      'text-anchor': 'left',
      'text-offset': [0.9, 0],
      // `text-allow-overlap` 을 켜지 않는다. 자리가 없으면 mapbox 가 이 줄을 떨구게 두는 편이,
      // 지도 위 다른 글자를 덮고 올라앉는 것보다 낫다 — 한 줄 못 본 것은 다시 가리키면 된다.
      'text-padding': 4,
    },
    paint: {
      // 가리킨 것의 색을 그대로 입는다 — 어느 선/표시에 대한 답인지가 색으로 붙는다.
      'text-color': ['get', 'color'],
      // 지도 지명 위를 지나므로 흰 후광이 없으면 글자가 배경에 먹힌다.
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.6,
    },
  }
}

/** 호버 힌트가 쓰는 레이어. 첫 호버에 만들고 손을 떼면 걷는다 */
export const STOP_HINT_LAYERS: MapLayerSpec[] = [
  hintTextLayerSpec({ id: HINT_LAYER_ID, source: HINT_SOURCE_ID }),
]

// ── 순수 계산 ────────────────────────────────────────────────────────────────

/** 화면에 걸린 한 줄 */
export interface StopHint {
  text: string
  /** 이 좌표의 오른쪽에 붙는다 */
  at: LngLat
  color: string
}

/**
 * `queryRenderedFeatures` 결과 중 이 파일이 읽는 부분만 추린 것.
 *
 * `stopDrag` 의 `HitFeature` 와 같은 이유로 좁혀 둔다 — 지도 인스턴스 없이 판정을 시험할 수
 * 있어야 한다. 두 모듈이 서로를 참조하게 만들지 않으려고 각자 자기 몫만 적어 둔다.
 */
export interface HintFeature {
  properties?: Record<string, unknown> | null
  geometry?: { type: string; coordinates?: unknown } | null
}

const DEFAULT_COLOR = '#055cf5'

/** 그릴 값이 있는 문자열만 통과시킨다 — 빈 문자열은 "줄 것이 없다"는 뜻이다 */
function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function colorOf(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : DEFAULT_COLOR
}

function pointFrom(geometry: HintFeature['geometry']): LngLat | null {
  if (!geometry || geometry.type !== 'Point') return null
  const coordinates = geometry.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const [lng, lat] = coordinates as unknown[]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null
  return { lng, lat }
}

/**
 * 중간 표시 위의 한 줄. 없으면 null.
 *
 * 커서가 아니라 **표시의 자리**에 건다. 표시는 점이라 붙일 자리가 하나로 정해지고, 그 편이
 * 손이 조금 흔들려도 글자가 따라 떨지 않는다.
 */
export function resolveStopHint(features: readonly HintFeature[]): StopHint | null {
  for (const feature of features) {
    const text = textOf(feature.properties?.tooltip)
    if (!text) continue
    const at = pointFrom(feature.geometry)
    if (!at) continue
    return { text, at, color: colorOf(feature.properties?.color) }
  }
  return null
}

/**
 * 구간(선) 위의 한 줄. 없으면 null.
 *
 * 선에는 붙일 점이 없다 — 중점에 걸면 긴 구간에서는 화면 밖일 수 있고, 끝에 걸면 어느 쪽
 * 구간인지 헷갈린다. 커서 자리에 거는 것이 "지금 가리킨 이 선"을 가장 곧게 가리킨다.
 */
export function resolveLegHint(features: readonly HintFeature[], cursor: LngLat): StopHint | null {
  for (const feature of features) {
    const text = textOf(feature.properties?.tooltip)
    if (!text) continue
    return { text, at: cursor, color: colorOf(feature.properties?.color) }
  }
  return null
}

/**
 * 힌트 소스에 흘릴 도형.
 *
 * feature 는 언제나 0 개 또는 1 개다 — "한 번에 하나만" 을 규칙으로 지키는 대신 자료구조로
 * 만들어 두면, 나중에 어디선가 하나 더 그릴 방법이 없다.
 */
export function buildStopHint(hint: StopHint | null): GeoJSON.FeatureCollection {
  if (!hint) return EMPTY_COLLECTION
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { text: hint.text, color: hint.color },
        geometry: { type: 'Point', coordinates: [hint.at.lng, hint.at.lat] },
      },
    ],
  }
}

/**
 * 이 화면에 물어볼 것이 하나라도 있는가.
 *
 * 아무도 문자열을 주지 않았으면 호버 질의를 붙이지 않는다 — 아무 답도 못 내는 질의를 커서가
 * 움직일 때마다 돌릴 이유가 없고, 지도의 성질(중간 표시는 눌리지 않는다)도 그대로 남는다.
 */
export function hasHintTexts(
  arrows: readonly MapArrow[],
  loops: readonly MapRouteLoop[],
  markers: readonly MapMarker[] = [],
): boolean {
  const inStops = (stops?: readonly MapArrowStop[]) =>
    stops?.some((stop) => textOf(stop.tooltip) != null) ?? false
  return (
    arrows.some((arrow) => textOf(arrow.tooltip) != null || inStops(arrow.stops)) ||
    loops.some((loop) => inStops(loop.stops)) ||
    markers.some((marker) => textOf(marker.tooltip) != null)
  )
}

// ── 런타임 ───────────────────────────────────────────────────────────────────

interface HintRuntime {
  hint: StopHint | null
  /** 드래그가 자기 줄을 그리는 동안은 호버가 입을 다문다 */
  suppressed: boolean
}

const runtimes = new WeakMap<mapboxgl.Map, HintRuntime>()

function runtimeOf(map: mapboxgl.Map): HintRuntime {
  const existing = runtimes.get(map)
  if (existing) return existing
  const created: HintRuntime = { hint: null, suppressed: false }
  runtimes.set(map, created)
  return created
}

function ensureHintLayers(map: mapboxgl.Map): void {
  try {
    if (!map.getSource(HINT_SOURCE_ID)) {
      map.addSource(HINT_SOURCE_ID, { type: 'geojson', data: EMPTY_COLLECTION })
    }
    for (const layer of STOP_HINT_LAYERS) {
      // 맨 위에 올린다. 물어서 얻은 답이 다른 그림 밑에 깔리면 물은 보람이 없다.
      if (!map.getLayer(layer.id)) map.addLayer(layer)
    }
  } catch {
    // 스타일이 아직 준비되지 않은 순간 — 다음 이동에서 다시 시도한다.
  }
}

function setHintData(map: mapboxgl.Map, data: GeoJSON.FeatureCollection): void {
  const source = map.getSource(HINT_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  source?.setData(data)
}

/** 힌트 레이어·소스를 걷는다 */
export function removeStopHintLayers(map: mapboxgl.Map | null | undefined): void {
  if (!map) return
  try {
    if (map.getLayer(HINT_LAYER_ID)) map.removeLayer(HINT_LAYER_ID)
    if (map.getSource(HINT_SOURCE_ID)) map.removeSource(HINT_SOURCE_ID)
  } catch {
    // map 이 이미 제거된 경우 무시
  }
}

function sameHint(a: StopHint | null, b: StopHint | null): boolean {
  if (a == null || b == null) return a === b
  return a.text === b.text && a.color === b.color && a.at.lng === b.at.lng && a.at.lat === b.at.lat
}

/**
 * 걸린 줄을 바꾼다.
 *
 * 같은 줄이면 아무것도 하지 않는다 — 커서가 표시 위에서 흔들릴 때마다 setData 를 돌 이유가
 * 없다. 다만 소스가 사라졌으면(테마 교체 등으로 스타일이 다시 로드되면) 같은 줄이라도 다시
 * 세운다. 안 그러면 다른 것을 가리킬 때까지 답이 돌아오지 않는다.
 */
function showHint(map: mapboxgl.Map, hint: StopHint | null): void {
  const runtime = runtimeOf(map)
  const drawn = hint == null || map.getSource(HINT_SOURCE_ID) != null
  if (sameHint(runtime.hint, hint) && drawn) return
  runtime.hint = hint
  if (hint == null) {
    // 소스가 없으면 비울 것도 없다 — 첫 호버 전에는 레이어를 만들지 않는다.
    setHintData(map, EMPTY_COLLECTION)
    return
  }
  ensureHintLayers(map)
  setHintData(map, buildStopHint(hint))
}

/**
 * 호버 힌트를 잠시 재운다(드래그가 부른다).
 *
 * 끄는 동안에는 커서를 따라오는 줄이 이미 하나 있다. 그 위에 호버 답까지 뜨면 둘 중 어느
 * 것이 지금 손에 든 값인지 흐려진다.
 */
export function suppressHoverHint(map: mapboxgl.Map, suppressed: boolean): void {
  runtimeOf(map).suppressed = suppressed
  if (suppressed) showHint(map, null)
}

/** 존재하는 레이어에만 질의한다 — 없는 레이어 id 를 넘기면 mapbox 가 오류를 낸다 */
function queryHintFeatures(
  map: mapboxgl.Map,
  point: [number, number],
  layerIds: readonly string[],
  tolerance: number,
): HintFeature[] {
  const layers = layerIds.filter((id) => map.getLayer(id))
  if (layers.length === 0) return []
  const [x, y] = point
  const geometry: mapboxgl.PointLike | [mapboxgl.PointLike, mapboxgl.PointLike] =
    tolerance > 0
      ? [
          [x - tolerance, y - tolerance],
          [x + tolerance, y + tolerance],
        ]
      : point
  try {
    return map.queryRenderedFeatures(geometry, { layers }) as unknown as HintFeature[]
  } catch {
    // 스타일 교체 직후처럼 질의가 성립하지 않는 순간 — 아무것도 못 잡은 것으로 둔다.
    return []
  }
}

/**
 * 호버 힌트를 map 에 붙인다. 반환된 함수로 완전히 걷힌다.
 *
 * 커서가 가리키는 것 하나만 답한다. 좁은 것이 이긴다 — 표시·핀은 선 위에 놓여 있어 늘 둘 다
 * 잡히는데, 사용자가 겨눈 것은 점이지 그 밑을 지나는 선이 아니다. 표시와 핀이 겹치면 표시가
 * 먼저다(표시는 핀보다 작고, 끌어다 놓는 손잡이라 겨냥이 더 정확하다).
 */
export function attachStopHints(map: mapboxgl.Map): () => void {
  const onMove = (event: mapboxgl.MapMouseEvent) => {
    if (runtimeOf(map).suppressed) return
    const point: [number, number] = [event.point.x, event.point.y]
    const cursor: LngLat = { lng: event.lngLat.lng, lat: event.lngLat.lat }
    const stop = resolveStopHint(queryHintFeatures(map, point, STOP_HANDLE_LAYER_IDS, 0))
    // 핀도 점이므로 표시와 같은 방식으로 자기 좌표에 건다 — 커서에 걸면 스프라이트가 넓어
    // 같은 핀 안에서 손을 움직일 때마다 글자가 따라 떤다.
    const marker =
      stop ?? resolveStopHint(queryHintFeatures(map, point, [MARKER_SPRITE_LAYER_ID], 0))
    showHint(
      map,
      marker ??
        resolveLegHint(
          queryHintFeatures(map, point, [ARROW_LINE_LAYER_ID], LINE_HIT_TOLERANCE),
          cursor,
        ),
    )
  }

  /** 캔버스를 벗어나면 답도 사라진다 — 가리키기를 그만둔 것이므로 */
  const onLeave = () => showHint(map, null)

  map.on('mousemove', onMove)
  map.on('mouseout', onLeave)

  return () => {
    map.off('mousemove', onMove)
    map.off('mouseout', onLeave)
    showHint(map, null)
    removeStopHintLayers(map)
    runtimes.delete(map)
  }
}
