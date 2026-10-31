/**
 * 근접 확대 — 무엇을 키우는가(순수 계산)와, 바뀔 때 어느 레이어를 건드리는가(가짜 지도).
 */
import { validate } from 'mapbox-gl/dist/style-spec/index.cjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { STOP_HANDLE_LAYER_IDS, stopGrowStyles } from './arrows'
import {
  attachHoverGrow,
  HOVER_GROW_REACH,
  pickNearestNode,
  toNodeCandidates,
  type GrowFeature,
  type NodeCandidate,
} from './hoverGrow'
import { HOVER_GROW_SCALE, MARKER_SPRITE_LAYER_ID, markerGrowLayout } from './markerLayers'

import type mapboxgl from 'mapbox-gl'

function node(kind: NodeCandidate['kind'], id: string, x: number, radius: number): NodeCandidate {
  return { kind, id, x, y: 0, radius }
}

describe('pickNearestNode — 둘을 통틀어 가장 가까운 하나', () => {
  it('반경 밖이면 아무것도 키우지 않는다', () => {
    // 테두리까지 12.5px — 여유 12px 를 넘는다
    expect(pickNearestNode([node('stop', 's', 18, 5.5)], { x: 0, y: 0 })).toBeNull()
    expect(pickNearestNode([], { x: 0, y: 0 })).toBeNull()
  })

  it('그림 위가 아니어도 테두리에서 여유 안이면 잡힌다', () => {
    const stop = node('stop', 's', 5.5 + HOVER_GROW_REACH, 5.5)
    expect(pickNearestNode([stop], { x: 0, y: 0 })).toBe(stop)
  })

  it('중심이 아니라 테두리까지 잰다 — 큰 시계판 위의 커서는 옆 작은 표시에 밀리지 않는다', () => {
    const marker = node('marker', 'm', 15, 22) // 테두리 안쪽 7px
    const stop = node('stop', 's', -10, 5.5) // 테두리 바깥 4.5px
    expect(pickNearestNode([stop, marker], { x: 0, y: 0 })?.id).toBe('m')
  })

  it('종류마다 하나씩이 아니라 전체에서 하나만 고른다', () => {
    const near = node('stop', 'near', 8, 5.5)
    const far = node('marker', 'far', -40, 22)
    expect(pickNearestNode([far, near], { x: 0, y: 0 })).toBe(near)
  })

  it('같은 거리면 앞의 것(위에 그려진 것)이 이긴다', () => {
    const first = node('stop', 'a', 10, 5.5)
    const second = node('stop', 'b', -10, 5.5)
    expect(pickNearestNode([first, second], { x: 0, y: 0 })).toBe(first)
  })
})

describe('toNodeCandidates — 질의 결과를 화면 위 원으로', () => {
  const project = ([lng, lat]: [number, number]) => ({ x: lng * 100, y: lat * 100 })

  it('마커는 pixelOffset 만큼 비키고 꼬리 핀이면 머리까지 올라간 자리가 중심이다', () => {
    const features: GrowFeature[] = [
      {
        properties: {
          id: 'm1',
          offsetX: 10,
          offsetY: -4,
          footprintRadius: 16,
          footprintLift: 30,
        },
        geometry: { type: 'Point', coordinates: [1, 2] },
      },
    ]
    expect(toNodeCandidates(features, 'marker', project)).toEqual([
      { kind: 'marker', id: 'm1', x: 110, y: 166, radius: 16 },
    ])
  })

  it('중간 표시는 좌표가 곧 중심이고, 클러스터·id 없는 것은 노드가 아니다', () => {
    const features: GrowFeature[] = [
      { properties: { id: 's1' }, geometry: { type: 'Point', coordinates: [1, 1] } },
      {
        properties: { cluster_id: 3, point_count: 4 },
        geometry: { type: 'Point', coordinates: [0, 0] },
      },
      { properties: { id: '' }, geometry: { type: 'Point', coordinates: [0, 0] } },
      { properties: { id: 's2' }, geometry: { type: 'LineString', coordinates: [] } },
    ]
    expect(toNodeCandidates(features, 'stop', project)).toEqual([
      { kind: 'stop', id: 's1', x: 100, y: 100, radius: 5.5 },
    ])
  })
})

describe('키우는 값 — style-spec 검증', () => {
  const source = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }

  function styleFor(markerId: string | null, stopId: string | null) {
    const stopLayers = stopGrowStyles(stopId).map(({ layerId, layout, paint }) => ({
      id: layerId,
      type: layout ? ('symbol' as const) : ('circle' as const),
      source: 'src',
      ...(layout ? { layout } : {}),
      ...(paint ? { paint } : {}),
    }))
    return {
      version: 8 as const,
      sources: { src: source },
      layers: [
        { id: 'markers', type: 'symbol', source: 'src', layout: markerGrowLayout(markerId) },
        ...stopLayers,
      ],
    }
  }

  it('키운 값과 원래 값이 모두 스펙을 지킨다', () => {
    expect(validate(styleFor('m1', 's1') as never)).toEqual([])
    expect(validate(styleFor(null, null) as never)).toEqual([])
  })

  it('가리킨 마커만 배율만큼 커지고 맨 위로 올라간다', () => {
    const layout = markerGrowLayout('m1')
    expect(layout['icon-size']).toEqual([
      'case',
      ['==', ['get', 'id'], 'm1'],
      0.5 * HOVER_GROW_SCALE,
      0.5,
    ])
    expect(layout['icon-offset']).toEqual([
      'case',
      ['==', ['get', 'id'], 'm1'],
      ['get', 'grownIconOffset'],
      ['get', 'iconOffset'],
    ])
    expect(markerGrowLayout(null)['icon-size']).toBe(0.5)
  })
})

// ── 런타임 ───────────────────────────────────────────────────────────────────

type Listener = (event: never) => void

/** 이벤트·질의·레이어 값만 흉내 낸 지도. 투영은 lng/lat 를 그대로 px 로 쓴다 */
class FakeMap {
  listeners = new Map<string, Set<Listener>>()
  layers = new Set<string>([MARKER_SPRITE_LAYER_ID, ...STOP_HANDLE_LAYER_IDS, 'arrow-stops'])
  markers: GrowFeature[] = []
  stops: GrowFeature[] = []
  /** 레이어마다 마지막으로 바꿔 끼운 값 */
  set: { layerId: string; name: string; value: unknown }[] = []

  on(type: string, listener: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }
  off(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }
  emit(type: string, event: unknown = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event as never)
  }
  getLayer(id: string) {
    return this.layers.has(id) ? { id } : undefined
  }
  queryRenderedFeatures(_box: unknown, options: { layers: string[] }) {
    return options.layers.includes(MARKER_SPRITE_LAYER_ID) ? this.markers : this.stops
  }
  project([lng, lat]: [number, number]) {
    return { x: lng, y: lat }
  }
  setLayoutProperty(layerId: string, name: string, value: unknown) {
    this.set.push({ layerId, name, value })
  }
  setPaintProperty(layerId: string, name: string, value: unknown) {
    this.set.push({ layerId, name, value })
  }
  /** 손이 움직였다 — 프레임 끝에 한 번 잰다 */
  move(x: number, y: number, buttons = 0) {
    this.emit('mousemove', { point: { x, y }, originalEvent: { buttons } })
    vi.runAllTimers()
  }
  touched() {
    const layers = new Set(this.set.map((entry) => entry.layerId))
    this.set = []
    return layers
  }
}

function point(id: string, x: number, y: number, extra: Record<string, unknown> = {}): GrowFeature {
  return { properties: { id, ...extra }, geometry: { type: 'Point', coordinates: [x, y] } }
}

describe('attachHoverGrow — 바뀔 때만, 바뀐 종류만', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup() {
    const map = new FakeMap()
    map.markers = [point('m1', 100, 100, { footprintRadius: 22 })]
    map.stops = [point('s1', 140, 100)]
    const detach = attachHoverGrow(map as unknown as mapboxgl.Map)
    return { map, detach }
  }

  it('가까운 마커를 키우고, 같은 노드 위에서 흔들리는 동안은 다시 건드리지 않는다', () => {
    const { map } = setup()
    map.move(100, 70) // 시계판 테두리에서 8px
    expect(map.touched()).toEqual(new Set([MARKER_SPRITE_LAYER_ID]))
    map.move(101, 71)
    expect(map.touched().size).toBe(0)
  })

  it('마커에서 중간 표시로 옮기면 마커는 되돌리고 표시 레이어만 키운다', () => {
    const { map } = setup()
    map.move(100, 70)
    map.touched()
    map.move(146, 100)
    const touched = map.touched()
    expect(touched.has(MARKER_SPRITE_LAYER_ID)).toBe(true)
    expect(touched.has('arrow-stops')).toBe(true)
  })

  it('버튼을 누른 채 움직이면(끌기) 원래 크기로 돌린다', () => {
    const { map } = setup()
    map.move(146, 100)
    map.touched()
    map.move(146, 100, 1)
    const reset = map.set.find((entry) => entry.layerId === 'arrow-stops')
    expect(reset?.value).toBe(5.5)
  })

  it('걷으면 키운 노드도 원래 크기로 돌아가고 리스너가 남지 않는다', () => {
    const { map, detach } = setup()
    map.move(100, 70)
    map.touched()
    detach()
    expect(map.set).toContainEqual({
      layerId: MARKER_SPRITE_LAYER_ID,
      name: 'icon-size',
      value: 0.5,
    })
    expect([...map.listeners.values()].every((set) => set.size === 0)).toBe(true)
  })

  it('아무 노드에서도 멀면 레이어를 건드리지 않는다', () => {
    const { map } = setup()
    map.move(400, 400)
    expect(map.touched().size).toBe(0)
  })
})
