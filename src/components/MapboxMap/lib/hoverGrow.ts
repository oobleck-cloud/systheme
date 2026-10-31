/**
 * 커서에 가까운 노드 하나를 살짝 키운다(`MapboxMap hoverGrow`).
 *
 * 노드는 두 가지다 — 큰 노드(마커 스프라이트)와 작은 노드(선·루프 위 중간 표시). 커서가 그림
 * 바로 위가 아니어도 테두리에서 `HOVER_GROW_REACH` 안이면 반응한다. 작은 노드는 지름 11px 이라
 * 정확히 올라가야만 반응하면 손이 먼저 지친다.
 *
 * 키우는 것은 **둘을 통틀어 가장 가까운 하나**다. 종류마다 하나씩 키우면 마커 옆 빈 자리를
 * 겨눴을 때 마커까지 같이 부풀어, 무엇을 가리키는지 오히려 흐려진다.
 *
 * 크기는 애니메이션 없이 바로 바꾼다. `icon-size` 는 레이아웃 속성이라 transition 도
 * feature-state 도 받지 못하고, 바꿀 때마다 그 소스를 워커에서 다시 배치한다. 몇 프레임에 나눠
 * 키우면 마커 수백 개를 프레임마다 다시 배치하게 되고, 결과도 워커 왕복만큼 늦게 도착해 매끄럽게
 * 이어지지 않는다.
 */
import { STOP_HANDLE_LAYER_IDS, STOP_RADIUS, stopGrowStyles, type LayerGrowStyle } from './arrows'
import { MARKER_SPRITE_LAYER_ID, markerGrowLayout } from './markerLayers'

import type mapboxgl from 'mapbox-gl'

/** 노드 테두리에서 이만큼(px) 떨어진 곳까지 가까운 것으로 본다 */
export const HOVER_GROW_REACH = 12

// ── 순수 계산 ────────────────────────────────────────────────────────────────

/** 화면 위 노드 하나 — 거리를 잴 원 */
export interface NodeCandidate {
  kind: 'marker' | 'stop'
  id: string
  /** 원의 중심(화면 px) */
  x: number
  y: number
  radius: number
}

/** 지금 커진 노드. 마커와 중간 표시의 id 가 겹쳐도 엉뚱한 쪽이 커지지 않게 종류를 함께 든다 */
export interface GrownNode {
  kind: NodeCandidate['kind']
  id: string
}

/**
 * 커서에서 가장 가까운 노드. `reach` 밖이면 null.
 *
 * 거리는 중심이 아니라 **테두리**까지 잰다 — 중심까지 재면 지름 44px 시계판은 그림 위에
 * 있어도 옆의 작은 표시에 밀린다. 같은 거리면 앞의 것(질의 결과에서 위에 그려진 것)이 이긴다.
 */
export function pickNearestNode(
  candidates: readonly NodeCandidate[],
  cursor: { x: number; y: number },
  reach: number = HOVER_GROW_REACH,
): NodeCandidate | null {
  let best: NodeCandidate | null = null
  let bestGap = Infinity
  for (const candidate of candidates) {
    const gap = Math.hypot(candidate.x - cursor.x, candidate.y - cursor.y) - candidate.radius
    if (gap > reach || gap >= bestGap) continue
    best = candidate
    bestGap = gap
  }
  return best
}

/** `queryRenderedFeatures` 결과 중 여기서 읽는 부분 — 지도 없이 시험하려고 좁혀 둔다 */
export interface GrowFeature {
  properties?: Record<string, unknown> | null
  geometry?: { type: string; coordinates?: unknown } | null
}

function numberProp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function lngLatOf(geometry: GrowFeature['geometry']): [number, number] | null {
  if (!geometry || geometry.type !== 'Point' || !Array.isArray(geometry.coordinates)) return null
  const [lng, lat] = geometry.coordinates as unknown[]
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null
  return [lng, lat]
}

/**
 * 질의 결과를 화면 위 원으로 편다.
 *
 * 마커는 좌표에서 `pixelOffset` 만큼 비키고 꼬리 핀이면 머리까지 올라간 자리가 중심이다
 * (`markerLayers` 가 실어 둔 `offsetX`·`offsetY`·`footprintLift`). 클러스터 원은 노드가 아니다.
 */
export function toNodeCandidates(
  features: readonly GrowFeature[],
  kind: NodeCandidate['kind'],
  project: (lngLat: [number, number]) => { x: number; y: number },
): NodeCandidate[] {
  const candidates: NodeCandidate[] = []
  for (const feature of features) {
    const properties = feature.properties
    if (!properties || properties.point_count != null) continue
    const id = properties.id
    if (typeof id !== 'string' || id.length === 0) continue
    const lngLat = lngLatOf(feature.geometry)
    if (!lngLat) continue
    const point = project(lngLat)
    if (kind === 'stop') {
      candidates.push({ kind, id, x: point.x, y: point.y, radius: STOP_RADIUS })
      continue
    }
    candidates.push({
      kind,
      id,
      x: point.x + numberProp(properties.offsetX, 0),
      y: point.y + numberProp(properties.offsetY, 0) - numberProp(properties.footprintLift, 0),
      radius: numberProp(properties.footprintRadius, 0),
    })
  }
  return candidates
}

function sameNode(a: GrownNode | null, b: GrownNode | null): boolean {
  if (a == null || b == null) return a === b
  return a.kind === b.kind && a.id === b.id
}

// ── 런타임 ───────────────────────────────────────────────────────────────────

/** 존재하는 레이어에만 질의한다 — 없는 레이어 id 를 넘기면 mapbox 가 오류를 낸다 */
function queryBox(
  map: mapboxgl.Map,
  point: { x: number; y: number },
  layerIds: readonly string[],
  half: number,
): GrowFeature[] {
  const layers = layerIds.filter((id) => map.getLayer(id))
  if (layers.length === 0) return []
  try {
    return map.queryRenderedFeatures(
      [
        [point.x - half, point.y - half],
        [point.x + half, point.y + half],
      ],
      { layers },
    ) as unknown as GrowFeature[]
  } catch {
    // 스타일 교체 직후처럼 질의가 성립하지 않는 순간 — 아무것도 못 잡은 것으로 둔다.
    return []
  }
}

type LayoutName = Parameters<mapboxgl.Map['setLayoutProperty']>[1]
type PaintName = Parameters<mapboxgl.Map['setPaintProperty']>[1]

function applyStyles(map: mapboxgl.Map, styles: readonly LayerGrowStyle[]): void {
  for (const { layerId, layout, paint } of styles) {
    try {
      if (!map.getLayer(layerId)) continue
      for (const [name, value] of Object.entries(layout ?? {})) {
        map.setLayoutProperty(layerId, name as LayoutName, value as never)
      }
      for (const [name, value] of Object.entries(paint ?? {})) {
        map.setPaintProperty(layerId, name as PaintName, value as never)
      }
    } catch {
      // 레이어가 걷히는 중이면 무시 — 다시 세워질 때 원래 값으로 만들어진다.
    }
  }
}

/** 커진 노드를 바꾼다. 바뀐 종류의 레이어만 건드린다 — 건드린 소스는 다시 배치되기 때문이다 */
function grow(map: mapboxgl.Map, from: GrownNode | null, to: GrownNode | null): void {
  const markerId = (node: GrownNode | null) => (node?.kind === 'marker' ? node.id : null)
  const stopId = (node: GrownNode | null) => (node?.kind === 'stop' ? node.id : null)
  if (markerId(from) !== markerId(to)) {
    applyStyles(map, [{ layerId: MARKER_SPRITE_LAYER_ID, layout: markerGrowLayout(markerId(to)) }])
  }
  if (stopId(from) !== stopId(to)) applyStyles(map, stopGrowStyles(stopId(to)))
}

/**
 * 근접 확대를 map 에 붙인다. 반환된 함수로 걷으면 키운 노드도 원래 크기로 돌아간다.
 *
 * 질의는 `mousemove` 를 프레임마다 한 번으로 묶어 돌린다. 버튼을 누른 채 움직이는 동안(지도
 * 끌기·중간 표시 끌기)은 키우지 않는다 — 끄는 표시가 커졌다 줄었다 하면 손에 든 것이 흔들려
 * 보이고, 지도를 끄는 동안 지나가는 노드마다 부풀 이유도 없다.
 */
export function attachHoverGrow(map: mapboxgl.Map): () => void {
  let grown: GrownNode | null = null
  let rafId = 0
  let cursor: { x: number; y: number } | null = null
  let pressed = false

  const setGrown = (next: GrownNode | null) => {
    if (sameNode(grown, next)) return
    grow(map, grown, next)
    grown = next
  }

  const evaluate = () => {
    rafId = 0
    if (!cursor || pressed) return setGrown(null)
    // 상자는 테두리 + 여유만큼이면 된다. 그림·히트 원이 보이는 원보다 작지 않으므로, 테두리가
    // 여유 안에 들어온 노드는 이 상자에 반드시 걸린다. 정확한 거리는 아래에서 다시 잰다.
    const half = HOVER_GROW_REACH + 1
    const project = (lngLat: [number, number]) => map.project(lngLat)
    const candidates = [
      ...toNodeCandidates(queryBox(map, cursor, STOP_HANDLE_LAYER_IDS, half), 'stop', project),
      ...toNodeCandidates(queryBox(map, cursor, [MARKER_SPRITE_LAYER_ID], half), 'marker', project),
    ]
    const nearest = pickNearestNode(candidates, cursor)
    setGrown(nearest ? { kind: nearest.kind, id: nearest.id } : null)
  }

  const schedule = () => {
    if (!rafId) rafId = requestAnimationFrame(evaluate)
  }

  const onMove = (event: mapboxgl.MapMouseEvent) => {
    cursor = { x: event.point.x, y: event.point.y }
    pressed = (event.originalEvent?.buttons ?? 0) !== 0
    schedule()
  }

  /** 캔버스를 벗어나면 가리키기를 그만둔 것이다 */
  const onLeave = () => {
    cursor = null
    schedule()
  }

  /** 확대·이동이 끝나면 커서는 그대로인데 노드가 움직였다 — 같은 자리에서 다시 잰다 */
  const onMoveEnd = () => {
    if (cursor) schedule()
  }

  map.on('mousemove', onMove)
  map.on('mouseout', onLeave)
  map.on('moveend', onMoveEnd)

  return () => {
    map.off('mousemove', onMove)
    map.off('mouseout', onLeave)
    map.off('moveend', onMoveEnd)
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    setGrown(null)
  }
}
