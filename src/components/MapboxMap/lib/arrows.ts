import mapboxgl from 'mapbox-gl'

import { circlePath, pixelPath, pointOnCircle, pointsAlong, type PixelPoint } from './arrowGeometry'
import { clockAngle } from './clockDial'
import { HOVER_GROW_SCALE, MARKER_SPRITE_LAYER_ID } from './markerLayers'
import { drawStopClockImage, stopClockImageId } from './stopClockIcon'

import type { MapArrow, MapArrowStop, MapMarker, MapRouteLoop } from '../types/mapbox.types'

const SOURCE_ID = 'arrows-source'
const LINE_LAYER_ID = 'arrows-line'
const LABEL_LAYER_ID = 'arrows-label'
const STOP_SOURCE_ID = 'arrow-stops-source'
const STOP_LAYER_ID = 'arrow-stops'
const STOP_HIT_LAYER_ID = 'arrow-stops-hit'
/** 시계 쐐기를 단 빈 자리 표시 — 원 대신 스프라이트로 그린다 */
const STOP_CLOCK_LAYER_ID = 'arrow-stops-clock'
const LOOP_STOP_CLOCK_LAYER_ID = 'route-loops-stop-clock'
const LOOP_SOURCE_ID = 'route-loops-source'
const LOOP_LINE_LAYER_ID = 'route-loops-line'
const LOOP_CENTER_LAYER_ID = 'route-loops-center'
const LOOP_STOP_HIT_LAYER_ID = 'route-loops-stop-hit'
const DEFAULT_COLOR = '#055cf5'
/** 루프 기본 반지름 (px) */
const LOOP_RADIUS = 36
/** 진짜 좌표를 가리키는 중심 점의 반지름 (px) */
const LOOP_CENTER_RADIUS = 2.8
/**
 * 이 줌 미만이면 루프를 감춘다.
 *
 * 반지름이 화면 px 고정이라, 축소할수록 원이 덮는 실제 넓이가 커진다. 전국 배율에서는
 * 노선 전체가 원 안에 들어가 "한 자리를 공유한다" 가 "전부 한 자리다" 로 뒤집힌다.
 */
const LOOP_MIN_ZOOM = 11

/**
 * 선 위 이름 반복 간격 (px).
 *
 * Mapbox `symbol-spacing` 은 데이터 구동을 지원하지 않아 화살표별로 다르게 줄 수 없다.
 * 간격에 못 미치는 짧은 구간은 라벨이 찍히지 않으므로, 짧은 leg 가 저절로 비워지는 값으로 둔다.
 */
const LABEL_SPACING = 220
/** 중간 표시 원의 반지름 (px) */
export const STOP_RADIUS = 5.5
/** 중간 표시 원의 테두리 두께 (px) */
const STOP_STROKE = 2.5
/**
 * 중간 표시를 손으로 집기 위한 히트 원의 반지름 (px).
 *
 * 보이는 원은 5.5px 이라 커서로 정확히 맞히기 어렵다. `queryRenderedFeatures` 는 칠해진
 * 색이 아니라 도형만 보므로, 같은 소스 위에 안 보이는 큰 원을 하나 더 깔아 히트 영역으로
 * 쓴다 — 그림은 그대로 두고 잡기만 쉬워진다.
 */
const STOP_HIT_RADIUS = 15

/**
 * `map.addLayer` 가 받는 레이어 정의.
 *
 * 레이어를 상수로 빼 두면 지도를 띄우지 않고도 style-spec 검증기에 그대로 먹일 수 있다 —
 * `symbol-spacing` 이 표현식을 못 받는 식의 사고는 런타임 전에 잡아야 한다.
 */
export type MapLayerSpec = Parameters<mapboxgl.Map['addLayer']>[0]

/** `map.setFilter` 가 받는 필터 정의 */
type MapFilterSpec = Parameters<mapboxgl.Map['setFilter']>[1]

/**
 * 이름 레이어가 늘 걸고 있는 조건.
 *
 * 구간을 감출 때 필터를 덮어쓰므로, 원래 조건을 한 곳에 두고 합쳐 쓴다 — 두 벌로 적어 두면
 * 감췄다 되돌린 뒤에 이름 없는 선까지 이름 레이어에 들어온다.
 */
const LABEL_FILTER: NonNullable<MapFilterSpec> = ['!=', ['get', 'label'], '']

/**
 * 빈 자리 표시는 시계가 있으면 스프라이트(쐐기), 없으면 원으로 그린다 — 같은 소스를 두 레이어가
 * 나눠 갖는다. 둘 다 그리면 원이 쐐기 위에 한 겹 더 얹힌다.
 */
const PLAIN_STOP_FILTER: NonNullable<MapFilterSpec> = ['==', ['get', 'clockImage'], '']
const CLOCK_STOP_FILTER: NonNullable<MapFilterSpec> = ['!=', ['get', 'clockImage'], '']

/**
 * 한 구간(화살표 하나)이 그려지는 레이어들.
 *
 * 드래그가 시작되면 이 셋에서 그 구간만 걷어낸다. 선만 감추고 이름·중간 표시를 남기면
 * 선이 사라진 자리에 글자와 점만 떠 있어, 감췄다기보다 선이 깨진 것처럼 읽힌다.
 */
const LEG_LAYERS: { id: string; base: MapFilterSpec }[] = [
  { id: LINE_LAYER_ID, base: undefined },
  { id: LABEL_LAYER_ID, base: LABEL_FILTER },
  { id: STOP_LAYER_ID, base: PLAIN_STOP_FILTER },
  { id: STOP_CLOCK_LAYER_ID, base: CLOCK_STOP_FILTER },
]

/**
 * 중간 표시를 드래그로 집게 하는 히트 전용 레이어.
 *
 * 구간 위 표시(`arrow-stops-source`)와 루프 위 표시(`route-loops-source`)는 소스가 다를 뿐
 * 소비자에게는 같은 것이므로, 잡는 방법도 같아야 한다. 두 레이어를 한 묶음으로 노출해
 * 드래그 쪽이 하나의 핸들 집합으로 질의한다.
 */
export const STOP_HANDLE_LAYERS: MapLayerSpec[] = [
  {
    id: STOP_HIT_LAYER_ID,
    type: 'circle',
    source: STOP_SOURCE_ID,
    paint: {
      'circle-radius': STOP_HIT_RADIUS,
      // 보이지 않아야 하지만 질의에는 잡혀야 한다 — 투명도는 히트 판정에 영향을 주지 않는다.
      'circle-opacity': 0,
      'circle-color': '#000000',
    },
  },
  {
    id: LOOP_STOP_HIT_LAYER_ID,
    type: 'circle',
    source: LOOP_SOURCE_ID,
    filter: ['==', ['get', 'kind'], 'stop'],
    paint: {
      'circle-radius': STOP_HIT_RADIUS,
      'circle-opacity': 0,
      'circle-color': '#000000',
    },
  },
]

/** 드래그 히트 판정에 쓸 레이어 id. 화살표가 없으면 존재하지 않으므로 쓰는 쪽에서 확인한다 */
export const STOP_HANDLE_LAYER_IDS: string[] = [STOP_HIT_LAYER_ID, LOOP_STOP_HIT_LAYER_ID]

/**
 * 구간(선) 자체의 레이어 id.
 *
 * 선 위 호버를 질의하려면 밖에서도 이 id 를 알아야 한다. 표시처럼 따로 히트 레이어를 깔지는
 * 않는다 — 선을 두껍게 덧그리면 그 자리 아래의 것을 전부 가로채므로, 잡기 어려운 만큼은
 * 질의 쪽에서 허용 오차로 메운다.
 */
export { LINE_LAYER_ID as ARROW_LINE_LAYER_ID }

/** 레이어 하나에 바꿔 끼울 레이아웃·페인트 값 */
export interface LayerGrowStyle {
  layerId: string
  layout?: Record<string, unknown>
  paint?: Record<string, unknown>
}

/** 원 레이어(빈 자리·루프 위 빈 자리)의 반지름·테두리. `hovered` 가 참인 표시만 키운다 */
function grownCircle(hovered: unknown[] | null): { radius: unknown; stroke: unknown } {
  if (!hovered) return { radius: STOP_RADIUS, stroke: STOP_STROKE }
  return {
    radius: ['case', hovered, STOP_RADIUS * HOVER_GROW_SCALE, STOP_RADIUS],
    stroke: ['case', hovered, STOP_STROKE * HOVER_GROW_SCALE, STOP_STROKE],
  }
}

/** 루프 레이어는 중심 점과 빈 자리를 한 레이어에서 그린다 — 중심 점은 키우지 않는다 */
function loopCenterPaint(stopId: string | null): Record<string, unknown> {
  const isCenter = ['==', ['get', 'kind'], 'center']
  const { radius, stroke } = grownCircle(stopId == null ? null : ['==', ['get', 'id'], stopId])
  return {
    'circle-radius': ['case', isCenter, LOOP_CENTER_RADIUS, radius],
    'circle-stroke-width': ['case', isCenter, 0, stroke],
  }
}

/**
 * 중간 표시 하나를 키우는 값(`hoverGrow`). `null` 이면 원래 값이다 — 레이어를 만들 때도 쓴다.
 *
 * 원은 반지름·테두리를, 시계 쐐기는 `icon-size` 를 바꾼다. 쐐기의 `icon-size` 는 레이아웃이라
 * feature-state 를 못 받으므로, 마커와 같이 가리킨 id 를 표현식에 박아 바꿔 끼운다.
 */
export function stopGrowStyles(stopId: string | null): LayerGrowStyle[] {
  const hovered = stopId == null ? null : ['==', ['get', 'id'], stopId]
  const { radius, stroke } = grownCircle(hovered)
  const clockSize = hovered ? ['case', hovered, HOVER_GROW_SCALE, 1] : 1
  return [
    { layerId: STOP_LAYER_ID, paint: { 'circle-radius': radius, 'circle-stroke-width': stroke } },
    { layerId: LOOP_CENTER_LAYER_ID, paint: loopCenterPaint(stopId) },
    { layerId: STOP_CLOCK_LAYER_ID, layout: { 'icon-size': clockSize } },
    { layerId: LOOP_STOP_CLOCK_LAYER_ID, layout: { 'icon-size': clockSize } },
  ]
}

/**
 * 구간 하나를 그림에서 뺀다(`null` 이면 되돌린다).
 *
 * 중간 표시를 끄는 동안 프리뷰가 그 구간을 커서 쪽으로 접은 V 를 대신 그린다. 원래 선을
 * 그대로 두면 곧은 선과 V 가 겹쳐 보여, 자리를 옮기는 중이 아니라 선이 하나 더 생긴 것으로
 * 읽힌다. 소스를 다시 만들지 않고 필터만 갈아 끼우는 이유는, 드래그 한 번에 화면 전체의
 * 도형을 다시 계산할 이유가 없기 때문이다.
 */
export function setHiddenLeg(map: mapboxgl.Map, legId: string | null): void {
  try {
    for (const { id, base } of LEG_LAYERS) {
      if (!map.getLayer(id)) continue
      if (legId == null) {
        map.setFilter(id, base)
        continue
      }
      const exclude: MapFilterSpec = ['!=', ['get', 'legId'], legId]
      map.setFilter(id, base ? ['all', base, exclude] : exclude)
    }
  } catch {
    // 스타일이 아직 준비되지 않았거나 이미 걷힌 경우 — 감출 그림 자체가 없다.
  }
}

function findMarker(markers: MapMarker[], id: string): MapMarker | undefined {
  return markers.find((m) => m.id === id)
}

/** Mapbox Directions API로 실제 도로 경로 조회 (`follow: 'road'`일 때) */
async function fetchRoadRoute(
  from: MapMarker,
  to: MapMarker,
  isCancelled?: () => boolean,
): Promise<GeoJSON.LineString | null> {
  if (isCancelled?.()) return null
  const token = mapboxgl.accessToken
  if (!token) {
    console.warn('[MapboxMap] follow="road"를 사용하려면 accessToken이 필요합니다.')
    return null
  }
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from.position.lng},${from.position.lat};${to.position.lng},${to.position.lat}?geometries=geojson&access_token=${token}`
    const res = await fetch(url)
    if (!res.ok) {
      console.warn('[MapboxMap] Directions API 요청 실패:', res.statusText)
      return null
    }
    const json = await res.json()
    if (json.routes && json.routes.length > 0) {
      return json.routes[0].geometry as GeoJSON.LineString
    }
    return null
  } catch (err) {
    console.error('[MapboxMap] Directions API 오류:', err)
    return null
  }
}

/**
 * 좌표 해석까지 끝난 화살표 한 개.
 *
 * 도로 경로는 네트워크 결과라 카메라가 움직일 때마다 다시 부를 수 없다. 한 번 받아 두고
 * 재렌더에서 재사용한다.
 */
export interface ArrowPlan {
  arrow: MapArrow
  from: MapMarker
  to: MapMarker
  road: GeoJSON.LineString | null
}

/**
 * 경로 계산에 필요한 카메라 능력만 추린 것.
 *
 * `mapboxgl.Map` 이 구조적으로 만족한다. 지도 인스턴스 없이도 좌표 변환을 넣어 검증할 수
 * 있도록 좁혀 둔다 — 이 계산이 틀리면 선이 역에서 어긋나는데, 그건 실제 지도를 띄우기
 * 전에 잡아야 하는 종류의 오류다.
 */
export interface ArrowCamera {
  project(lngLat: [number, number]): { x: number; y: number }
  unproject(point: [number, number]): { lng: number; lat: number }
  getZoom(): number
}

/**
 * 이 화살표가 화면 좌표 계산을 필요로 하는가 — 즉 줌이 바뀌면 다시 그려야 하는가.
 *
 * 중간 표시(stops)만 있는 직선은 여기 해당하지 않는다. 두 점짜리 직선 위의 등분점은 어느
 * 줌에서 계산해도 같은 경위도로 떨어지기 때문이다.
 */
function needsPixelGeometry(plan: ArrowPlan): boolean {
  if (plan.road) return false
  return plan.from.pixelOffset != null || plan.to.pixelOffset != null
}

function projectMarker(map: ArrowCamera, marker: MapMarker): PixelPoint {
  const point = map.project([marker.position.lng, marker.position.lat])
  const offset = marker.pixelOffset ?? [0, 0]
  return { x: point.x + offset[0], y: point.y + offset[1] }
}

function toPosition(map: ArrowCamera, point: PixelPoint): GeoJSON.Position {
  const lngLat = map.unproject([point.x, point.y])
  return [lngLat.lng, lngLat.lat]
}

/** 화살표 하나의 선 좌표와 중간 표시 좌표를 현재 카메라 기준으로 만든다 */
function buildPlanGeometry(
  map: ArrowCamera,
  plan: ArrowPlan,
): { line: GeoJSON.Position[]; stops: GeoJSON.Position[] } {
  if (plan.road) {
    const line = plan.road.coordinates
    return { line, stops: [] }
  }

  const path = pixelPath(projectMarker(map, plan.from), projectMarker(map, plan.to))
  const stopCount = plan.arrow.stops?.length ?? 0
  return {
    line: path.map((point) => toPosition(map, point)),
    stops: pointsAlong(path, stopCount).map((point) => toPosition(map, point)),
  }
}

/**
 * 구간을 가리키는 이름.
 *
 * 소비자가 `id` 를 주면 그것을 쓰고, 없으면 두 끝 마커와 차례로 짓는다 — 같은 두 마커를 잇는
 * 화살표가 둘 이상이어도 서로 다른 이름이 나와야 감출 때 엉뚱한 구간까지 걷히지 않는다.
 */
function legIdOf(arrow: MapArrow, index: number): string {
  return arrow.id ?? `${arrow.from}→${arrow.to}#${index}`
}

/**
 * 구간의 양 끝을 표시 feature 에 실을 평평한 숫자로 편다.
 *
 * 중간 표시는 자기가 놓인 구간의 끝을 알아야 한다 — 끌려 나올 때 프리뷰가 그려야 하는 것은
 * "집은 자리에서 커서까지" 가 아니라 "구간의 두 끝에서 커서로 접힌 V" 이기 때문이다.
 * 중첩 객체·배열 대신 스칼라로만 싣는 것은, 소스를 거쳐 `queryRenderedFeatures` 로 되돌아올
 * 때 모양이 보존된다고 보장되는 값이 스칼라뿐이기 때문이다.
 */
function legEndpointProps(line: GeoJSON.Position[]): Record<string, number> {
  const [fromLng, fromLat] = line[0] ?? []
  const [toLng, toLat] = line[line.length - 1] ?? []
  if (
    typeof fromLng !== 'number' ||
    typeof fromLat !== 'number' ||
    typeof toLng !== 'number' ||
    typeof toLat !== 'number'
  ) {
    return {}
  }
  return { legFromLng: fromLng, legFromLat: fromLat, legToLng: toLng, legToLat: toLat }
}

export function buildArrowCollections(
  map: ArrowCamera,
  plans: ArrowPlan[],
): { lines: GeoJSON.FeatureCollection; stops: GeoJSON.FeatureCollection } {
  const lineFeatures: GeoJSON.Feature[] = []
  const stopFeatures: GeoJSON.Feature[] = []

  plans.forEach((plan, planIndex) => {
    const { arrow } = plan
    const color = arrow.color || DEFAULT_COLOR
    const legId = legIdOf(arrow, planIndex)
    const { line, stops } = buildPlanGeometry(map, plan)
    const endpoints = legEndpointProps(line)

    lineFeatures.push({
      type: 'Feature',
      properties: {
        legId,
        from: arrow.from,
        to: arrow.to,
        color,
        width: arrow.width || 2,
        dashed: arrow.dashed ?? false,
        label: arrow.label ?? '',
        // 물었을 때만 답할 한 줄. 늘 그리는 `label` 과 달리 여기서는 싣기만 한다.
        tooltip: arrow.tooltip ?? '',
      },
      geometry: { type: 'LineString', coordinates: line },
    })

    stops.forEach((coordinates, index) => {
      const stop = arrow.stops?.[index]
      if (!stop) return
      stopFeatures.push({
        type: 'Feature',
        // legId 는 끄는 동안 어느 구간을 감출지, 끝점은 V 를 어디서 접을지를 정한다.
        // tooltip 은 호버·드래그가 그대로 그릴 문자열이다 — 여기서 뜻을 만들지 않는다.
        properties: {
          id: stop.id,
          color: stop.color ?? color,
          legId,
          tooltip: stop.tooltip ?? '',
          ...stopClockProps(stop, stop.color ?? color),
          ...endpoints,
        },
        geometry: { type: 'Point', coordinates },
      })
    })
  })

  return {
    lines: { type: 'FeatureCollection', features: lineFeatures },
    stops: { type: 'FeatureCollection', features: stopFeatures },
  }
}

/**
 * 루프 하나를 원 둘레·중심 점·중간 표시 feature 로 편다.
 *
 * 셋 모두 한 소스에 담고 `kind` 로 갈라 레이어를 세운다 — 같은 카메라 계산에서 나오므로
 * 소스를 쪼개면 줌마다 세 번 갱신하게 된다.
 */
function loopFeatures(map: ArrowCamera, loop: MapRouteLoop): GeoJSON.Feature[] {
  const color = loop.color || DEFAULT_COLOR
  const center = map.project([loop.center.lng, loop.center.lat])
  const radius = loop.radius ?? LOOP_RADIUS
  const features: GeoJSON.Feature[] = [
    {
      type: 'Feature',
      properties: { kind: 'ring', id: loop.id, color, width: loop.width ?? 4.5 },
      geometry: {
        type: 'LineString',
        coordinates: circlePath(center, radius).map((point) => toPosition(map, point)),
      },
    },
  ]

  if (loop.showCenter !== false) {
    features.push({
      type: 'Feature',
      properties: { kind: 'center', id: loop.id, color },
      geometry: { type: 'Point', coordinates: toPosition(map, center) },
    })
  }

  // 원 위 표시에는 구간의 끝(`legFrom`·`legTo`)을 싣지 않는다 — 그래서 이 표시를 끌면
  // 프리뷰가 V 가 아니라 단선으로 나온다. 원은 두 지점을 잇는 구간이 아니라 "한 좌표를
  // 나눠 쓴다"는 표시라, 접을 양 끝이 없다. 억지로 이웃한 두 방문을 끝점으로 삼아 원을 V 로
  // 접으면 있지도 않은 이동을 그리게 되고, 반지름이 화면 px 인 원의 성질도 함께 깨진다.
  for (const stop of loop.stops ?? []) {
    features.push({
      type: 'Feature',
      properties: {
        kind: 'stop',
        id: stop.id,
        color: stop.color ?? color,
        tooltip: stop.tooltip ?? '',
        ...stopClockProps(stop, stop.color ?? color),
      },
      geometry: {
        type: 'Point',
        coordinates: toPosition(map, pointOnCircle(center, radius, stop.angle)),
      },
    })
  }

  return features
}

/**
 * 빈 자리 표시의 시계 속성 — 어느 그림을 몇 도 돌려 얹을지.
 *
 * 그림은 12시에서 시작하는 쐐기 하나라서 칸의 시작 각도만큼 돌리면 된다. 시계가 없으면 그림
 * 이름을 비워 두고, 원 레이어가 그 표시를 맡는다.
 */
export function stopClockProps(
  stop: Pick<MapArrowStop, 'clock'>,
  color: string,
): { clockImage: string; clockAngle: number } {
  if (!stop.clock) return { clockImage: '', clockAngle: 0 }
  return {
    clockImage: stopClockImageId(color, stop.clock.minutes),
    clockAngle: clockAngle(stop.clock.startHour),
  }
}

/** 쐐기 그림을 지도에 올린다 — (색 × 길이)마다 한 장. 이미 있으면 건너뛴다 */
function ensureStopClockImages(map: mapboxgl.Map, plans: ArrowPlan[], loops: MapRouteLoop[]): void {
  const wanted = new Map<string, { color: string; minutes: number }>()
  const collect = (stop: MapArrowStop, fallback: string) => {
    if (!stop.clock) return
    const color = stop.color ?? fallback
    wanted.set(stopClockImageId(color, stop.clock.minutes), { color, minutes: stop.clock.minutes })
  }
  for (const plan of plans) {
    for (const stop of plan.arrow.stops ?? []) collect(stop, plan.arrow.color || DEFAULT_COLOR)
  }
  for (const loop of loops) {
    for (const stop of loop.stops ?? []) collect(stop, loop.color || DEFAULT_COLOR)
  }
  for (const [id, { color, minutes }] of wanted) {
    if (map.hasImage(id)) continue
    const image = drawStopClockImage(color, minutes)
    if (image) map.addImage(id, image, { pixelRatio: 2 })
  }
}

export function buildLoopCollection(
  map: ArrowCamera,
  loops: MapRouteLoop[],
): GeoJSON.FeatureCollection {
  const zoom = map.getZoom()
  const visible = loops.filter((loop) => zoom >= (loop.minZoom ?? LOOP_MIN_ZOOM))
  return {
    type: 'FeatureCollection',
    features: visible.flatMap((loop) => loopFeatures(map, loop)),
  }
}

/**
 * map 별 렌더 상태.
 *
 * 카메라 이동 리스너는 픽셀 계산이 필요한 화살표가 있을 때만 붙인다 — 평범한 직선만 있는
 * 화면에 move 마다 setData 를 도는 비용을 지우지 않기 위해서다.
 */
interface ArrowRuntime {
  plans: ArrowPlan[]
  loops: MapRouteLoop[]
  detachMove: (() => void) | null
}

const runtimes = new WeakMap<mapboxgl.Map, ArrowRuntime>()

function setSourceData(
  map: mapboxgl.Map,
  id: string,
  data: GeoJSON.FeatureCollection,
  create: boolean,
): void {
  const source = map.getSource(id) as mapboxgl.GeoJSONSource | undefined
  if (source) {
    source.setData(data)
  } else if (create) {
    map.addSource(id, { type: 'geojson', data })
  }
}

/**
 * 현재 카메라로 소스를 다시 채운다.
 *
 * `create` 는 최초 1회만 참이다. 테마 교체 등으로 스타일이 다시 로드되면 소스가 통째로
 * 사라지는데, 그때 카메라 이동 리스너가 소스를 되살리면 아직 준비되지 않은 스타일에
 * 레이어 없는 소스만 남는다 — 갱신은 있는 소스만 건드린다.
 */
function render(map: mapboxgl.Map, create = false): void {
  const runtime = runtimes.get(map)
  if (!runtime) return
  const { lines, stops } = buildArrowCollections(map, runtime.plans)
  setSourceData(map, SOURCE_ID, lines, create)
  setSourceData(map, STOP_SOURCE_ID, stops, create)
  setSourceData(map, LOOP_SOURCE_ID, buildLoopCollection(map, runtime.loops), create)
}

/** 카메라가 움직이는 동안 프레임마다 한 번만 다시 그린다 */
function attachMoveRerender(map: mapboxgl.Map): () => void {
  let rafId = 0
  const onMove = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      render(map)
    })
  }
  map.on('move', onMove)
  return () => {
    if (rafId) cancelAnimationFrame(rafId)
    map.off('move', onMove)
  }
}

/**
 * 시계 쐐기 스프라이트 레이어. 그림은 12시에서 시작하므로 칸의 각도만큼 돌린다.
 * 화면 기준으로 돌린다 — 지도를 돌려도 시계의 12시는 화면 위다.
 */
export function stopClockLayer(
  id: string,
  source: string,
  filter: NonNullable<MapFilterSpec>,
): MapLayerSpec {
  return {
    id,
    type: 'symbol',
    source,
    filter,
    layout: {
      'icon-image': ['get', 'clockImage'],
      'icon-rotate': ['get', 'clockAngle'],
      'icon-rotation-alignment': 'viewport',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
    },
  }
}

function ensureLayers(map: mapboxgl.Map): void {
  if (!map.getLayer(LINE_LAYER_ID)) {
    map.addLayer({
      id: LINE_LAYER_ID,
      type: 'line',
      source: SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': 0.8,
        'line-dasharray': ['case', ['get', 'dashed'], ['literal', [2, 2]], ['literal', [1, 0]]],
      },
    })
  }

  if (!map.getLayer(STOP_LAYER_ID)) {
    map.addLayer({
      id: STOP_LAYER_ID,
      type: 'circle',
      source: STOP_SOURCE_ID,
      filter: PLAIN_STOP_FILTER,
      paint: {
        'circle-radius': STOP_RADIUS,
        'circle-color': '#ffffff',
        'circle-stroke-color': ['get', 'color'],
        'circle-stroke-width': STOP_STROKE,
      },
    })
  }

  if (!map.getLayer(STOP_CLOCK_LAYER_ID))
    map.addLayer(stopClockLayer(STOP_CLOCK_LAYER_ID, STOP_SOURCE_ID, CLOCK_STOP_FILTER))

  if (!map.getLayer(LABEL_LAYER_ID)) {
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      filter: LABEL_FILTER,
      layout: {
        'text-field': ['get', 'label'],
        'text-size': 12,
        'symbol-placement': 'line',
        'symbol-spacing': LABEL_SPACING,
        'text-rotation-alignment': 'map',
        'text-keep-upright': true,
        'text-padding': 6,
      },
      paint: {
        'text-color': ['get', 'color'],
        // 지도 지명 위를 지나므로 흰 후광이 없으면 글자가 배경에 먹힌다.
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.6,
      },
    })
  }

  if (!map.getLayer(LOOP_LINE_LAYER_ID)) {
    map.addLayer({
      id: LOOP_LINE_LAYER_ID,
      type: 'line',
      source: LOOP_SOURCE_ID,
      filter: ['==', ['get', 'kind'], 'ring'],
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': ['get', 'width'],
        'line-opacity': 0.8,
      },
    })
  }

  if (!map.getLayer(LOOP_CENTER_LAYER_ID)) {
    map.addLayer({
      id: LOOP_CENTER_LAYER_ID,
      type: 'circle',
      source: LOOP_SOURCE_ID,
      // 중심 점과 원 위 빈 자리 표시를 한 레이어에서 크기·채움만 갈라 그린다.
      // 시계를 단 빈 자리는 쐐기 레이어가 맡는다.
      filter: [
        'any',
        ['==', ['get', 'kind'], 'center'],
        ['all', ['==', ['get', 'kind'], 'stop'], PLAIN_STOP_FILTER],
      ],
      paint: {
        'circle-color': ['case', ['==', ['get', 'kind'], 'center'], ['get', 'color'], '#ffffff'],
        'circle-stroke-color': ['get', 'color'],
        ...loopCenterPaint(null),
      },
    })
  }

  if (!map.getLayer(LOOP_STOP_CLOCK_LAYER_ID)) {
    map.addLayer(
      stopClockLayer(LOOP_STOP_CLOCK_LAYER_ID, LOOP_SOURCE_ID, [
        'all',
        ['==', ['get', 'kind'], 'stop'],
        CLOCK_STOP_FILTER,
      ]),
    )
  }

  for (const layer of STOP_HANDLE_LAYERS) {
    if (!map.getLayer(layer.id)) map.addLayer(layer)
  }

  // 마커 레이어보다 아래로 (마커가 선·중간표시 위에 올라오도록)
  if (map.getLayer(MARKER_SPRITE_LAYER_ID)) {
    for (const layerId of [
      LINE_LAYER_ID,
      LOOP_LINE_LAYER_ID,
      STOP_LAYER_ID,
      STOP_CLOCK_LAYER_ID,
      LOOP_CENTER_LAYER_ID,
      LOOP_STOP_CLOCK_LAYER_ID,
      LABEL_LAYER_ID,
      // 히트 원도 마커 아래로 내린다. 안 보이는 레이어라 그림에는 영향이 없지만, 마커와
      // 겹친 자리에서는 마커 쪽이 먼저 잡히는 편이 자연스럽다.
      ...STOP_HANDLE_LAYER_IDS,
    ]) {
      if (map.getLayer(layerId)) map.moveLayer(layerId, MARKER_SPRITE_LAYER_ID)
    }
  }
}

/**
 * arrows 레이어를 map에 추가/갱신한다.
 * isCancelled: stale 결과로 map을 건드리지 않기 위한 취소 플래그.
 */
async function resolvePlans(
  arrows: MapArrow[],
  markers: MapMarker[],
  isCancelled?: () => boolean,
): Promise<ArrowPlan[]> {
  const plans: ArrowPlan[] = []
  for (const arrow of arrows) {
    if (isCancelled?.()) break
    const from = findMarker(markers, arrow.from)
    const to = findMarker(markers, arrow.to)
    if (!from || !to) {
      console.warn(`[MapboxMap] Arrow 마커를 찾을 수 없습니다: ${arrow.from} -> ${arrow.to}`)
      continue
    }
    const road = arrow.follow === 'road' ? await fetchRoadRoute(from, to, isCancelled) : null
    plans.push({ arrow, from, to, road })
  }
  return plans
}

export async function addArrowLayers(
  map: mapboxgl.Map,
  arrows: MapArrow[],
  markers: MapMarker[],
  isCancelled?: () => boolean,
  loops: MapRouteLoop[] = [],
): Promise<void> {
  if (!map || (arrows.length === 0 && loops.length === 0)) return

  const plans = await resolvePlans(arrows, markers, isCancelled)
  if (isCancelled?.()) return

  const previous = runtimes.get(map)
  previous?.detachMove?.()
  runtimes.set(map, { plans, loops, detachMove: null })

  ensureStopClockImages(map, plans, loops)
  render(map, true)
  ensureLayers(map)

  // 루프는 반지름이 화면 px 라 줌마다 다시 그려야 한다.
  if (loops.length > 0 || plans.some(needsPixelGeometry)) {
    const runtime = runtimes.get(map)
    if (runtime) runtime.detachMove = attachMoveRerender(map)
  }
}

export function removeArrowLayers(map: mapboxgl.Map | null | undefined): void {
  if (!map) return
  const runtime = runtimes.get(map)
  runtime?.detachMove?.()
  runtimes.delete(map)
  try {
    for (const layerId of [
      LABEL_LAYER_ID,
      LOOP_STOP_HIT_LAYER_ID,
      STOP_HIT_LAYER_ID,
      LOOP_STOP_CLOCK_LAYER_ID,
      LOOP_CENTER_LAYER_ID,
      STOP_CLOCK_LAYER_ID,
      STOP_LAYER_ID,
      LOOP_LINE_LAYER_ID,
      LINE_LAYER_ID,
    ]) {
      if (map.getLayer(layerId)) map.removeLayer(layerId)
    }
    for (const sourceId of [LOOP_SOURCE_ID, STOP_SOURCE_ID, SOURCE_ID]) {
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  } catch {
    // map이 이미 제거된 경우 무시
  }
}
