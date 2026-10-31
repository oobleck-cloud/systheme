/**
 * 호버 힌트의 흐름을 가짜 지도로 확인한다.
 *
 * 이 환경은 타일 서버가 막혀 있어 지도 위에서 커서를 움직여 볼 수 없다. 그래서 지도에서
 * 우리가 실제로 쓰는 부분(이벤트·질의·소스)만 흉내 낸 뒤 손이 하는 순서대로 이벤트를 흘려
 * 넣어, "무엇이 언제 뜨고 언제 흔적 없이 사라지는가"를 확인한다.
 *
 * 드래그도 같은 지도에 함께 붙인다 — 둘이 같은 순간에 각자 한 줄씩 그리면 어느 쪽이 지금
 * 손에 든 값인지 흐려지므로, 함께 붙여 두지 않으면 확인할 수 없는 규칙이다.
 */
import { describe, expect, it, vi } from 'vitest'

import { ARROW_LINE_LAYER_ID, STOP_HANDLE_LAYER_IDS } from './arrows'
import { MARKER_SPRITE_LAYER_ID } from './markerLayers'
import { attachStopDrag } from './stopDrag'
import { attachStopHints, type HintFeature } from './stopHint'

import type mapboxgl from 'mapbox-gl'

type Listener = (event: never) => void

const HINT_SOURCE_ID = 'stop-hint-source'
const HINT_LAYER_ID = 'stop-hint-label'

/** 구간 위 표시 — 자기 시각과 구간을 싣고 온다 */
const STOP_FEATURE: HintFeature = {
  properties: {
    id: 'slot-11:00',
    color: '#7F77DD',
    tooltip: '11:00',
    legId: 'a→b#0',
    legFromLng: 126,
    legFromLat: 37,
    legToLng: 128,
    legToLat: 38,
  },
  geometry: { type: 'Point', coordinates: [127, 37.5] },
}

/** 핀 — 표시와 마찬가지로 점이라 자기 좌표에 답을 건다 */
const MARKER_FEATURE: HintFeature = {
  properties: { id: 'm1', color: '#9aa0a6', tooltip: '희망 10–14시' },
  geometry: { type: 'Point', coordinates: [127.1, 37.6] },
}

/** 구간(선) — 그 구간의 속사정을 싣고 온다 */
const LEG_FEATURE: HintFeature = {
  properties: { legId: 'a→b#0', color: '#7F77DD', tooltip: '10:30 → 12:00 · 여유 1시간' },
  geometry: {
    type: 'LineString',
    coordinates: [
      [126, 37],
      [128, 38],
    ],
  },
}

class FakeMap {
  private listeners = new Map<string, Set<Listener>>()
  private layers = new Set<string>([
    ...STOP_HANDLE_LAYER_IDS,
    ARROW_LINE_LAYER_ID,
    MARKER_SPRITE_LAYER_ID,
  ])
  private sources = new Map<string, { setData: (data: unknown) => void; data: unknown }>()
  private canvas = document.createElement('canvas')

  /** 커서 아래에 있는 것들 */
  stops: HintFeature[] = []
  legs: HintFeature[] = []
  markers: HintFeature[] = []

  /** 선 질의가 어떤 도형으로 왔는가 — 점이면 허용 오차가 없는 것이다 */
  lastLegQuery: unknown = null

  dragPanEnabled = true
  scrollZoomEnabled = true
  dragPan = {
    isEnabled: () => this.dragPanEnabled,
    disable: () => {
      this.dragPanEnabled = false
    },
    enable: () => {
      this.dragPanEnabled = true
    },
  }
  scrollZoom = {
    isEnabled: () => this.scrollZoomEnabled,
    disable: () => {
      this.scrollZoomEnabled = false
    },
    enable: () => {
      this.scrollZoomEnabled = true
    },
  }

  on(type: string, listener: Listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }

  off(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener)
  }

  listenerCount(): number {
    let total = 0
    for (const set of this.listeners.values()) total += set.size
    return total
  }

  fire(type: string, event: unknown) {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      ;(listener as (e: unknown) => void)(event)
    }
  }

  queryRenderedFeatures(geometry: unknown, options: { layers: string[] }) {
    if (options.layers.some((id) => STOP_HANDLE_LAYER_IDS.includes(id))) return this.stops
    if (options.layers.includes(ARROW_LINE_LAYER_ID)) {
      this.lastLegQuery = geometry
      return this.legs
    }
    return this.markers
  }

  getLayer(id: string) {
    return this.layers.has(id) ? { id } : undefined
  }

  addLayer(layer: { id: string }) {
    this.layers.add(layer.id)
  }

  removeLayer(id: string) {
    this.layers.delete(id)
  }

  setFilter() {}

  getSource(id: string) {
    return this.sources.get(id)
  }

  addSource(id: string, source: { data: unknown }) {
    const entry = {
      data: source.data,
      setData: (data: unknown) => {
        entry.data = data
      },
    }
    this.sources.set(id, entry)
  }

  removeSource(id: string) {
    this.sources.delete(id)
  }

  dataOf(sourceId: string): GeoJSON.FeatureCollection | undefined {
    return this.sources.get(sourceId)?.data as GeoJSON.FeatureCollection | undefined
  }

  getCanvas() {
    return this.canvas
  }
}

function pointerEvent(x: number, y: number, lng: number, lat: number) {
  return {
    point: { x, y },
    lngLat: { lng, lat },
    originalEvent: { button: 0 },
    points: [{ x, y }],
    preventDefault: () => {},
  }
}

function setup() {
  const map = new FakeMap()
  const detach = attachStopHints(map as unknown as mapboxgl.Map)
  return { map, detach }
}

/** 지금 떠 있는 힌트 한 줄. 없으면 null */
function hint(map: FakeMap): { text: unknown; at: unknown } | null {
  const features = map.dataOf(HINT_SOURCE_ID)?.features ?? []
  expect(features.length).toBeLessThanOrEqual(1)
  const feature = features[0]
  if (!feature) return null
  return {
    text: feature.properties?.text,
    at: (feature.geometry as GeoJSON.Point).coordinates,
  }
}

describe('attachStopHints', () => {
  it('가리키기 전에는 레이어도 소스도 없다 — 상시 밀도를 0 만큼 늘린다', () => {
    const { map } = setup()
    expect(map.getSource(HINT_SOURCE_ID)).toBeUndefined()
    expect(map.getLayer(HINT_LAYER_ID)).toBeUndefined()
  })

  it('표시에 올리면 그 자리에 한 줄이 뜬다', () => {
    const { map } = setup()
    map.stops = [STOP_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))

    expect(hint(map)).toEqual({ text: '11:00', at: [127, 37.5] })
    expect(map.getLayer(HINT_LAYER_ID)).toBeDefined()
  })

  it('선에 올리면 커서 자리에 구간의 한 줄이 뜬다 — 허용 오차 상자로 묻는다', () => {
    const { map } = setup()
    map.legs = [LEG_FEATURE]
    map.fire('mousemove', pointerEvent(50, 40, 127.2, 37.6))

    expect(hint(map)).toEqual({ text: '10:30 → 12:00 · 여유 1시간', at: [127.2, 37.6] })
    // 선은 얇다 — 점으로 물으면 사실상 못 잡는다.
    expect(map.lastLegQuery).toEqual([
      [44, 34],
      [56, 46],
    ])
  })

  it('핀에 올리면 핀 자리에 그 핀의 한 줄이 뜬다', () => {
    const { map } = setup()
    map.markers = [MARKER_FEATURE]
    map.fire('mousemove', pointerEvent(20, 20, 127.02, 37.52))

    // 커서(127.02)가 아니라 핀 좌표(127.1)에 건다 — 같은 핀 안에서 손이 움직여도 안 떤다.
    expect(hint(map)).toEqual({ text: '희망 10–14시', at: [127.1, 37.6] })
  })

  it('핀과 선이 함께 잡히면 핀이 이긴다 — 겨눈 것은 밑을 지나는 선이 아니다', () => {
    const { map } = setup()
    map.markers = [MARKER_FEATURE]
    map.legs = [LEG_FEATURE]
    map.fire('mousemove', pointerEvent(20, 20, 127.02, 37.52))

    expect(hint(map)?.text).toBe('희망 10–14시')
  })

  it('표시와 핀이 함께 잡히면 표시가 이긴다 — 표시가 더 좁고 손잡이다', () => {
    const { map } = setup()
    map.stops = [STOP_FEATURE]
    map.markers = [MARKER_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))

    expect(hint(map)?.text).toBe('11:00')
  })

  it('문자열이 없는 핀 위에서는 아무 말도 하지 않는다', () => {
    const { map } = setup()
    map.markers = [{ ...MARKER_FEATURE, properties: { color: '#9aa0a6', tooltip: '' } }]
    map.fire('mousemove', pointerEvent(20, 20, 127.02, 37.52))

    expect(hint(map)).toBeNull()
  })

  it('표시와 선이 함께 잡히면 표시가 이긴다 — 겨눈 것은 좁은 쪽이다', () => {
    const { map } = setup()
    map.stops = [STOP_FEATURE]
    map.legs = [LEG_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))

    expect(hint(map)?.text).toBe('11:00')
  })

  it('벗어나면 흔적 없이 사라진다', () => {
    const { map } = setup()
    map.stops = [STOP_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))
    expect(hint(map)).not.toBeNull()

    map.stops = []
    map.fire('mousemove', pointerEvent(400, 400, 128, 38))
    expect(hint(map)).toBeNull()
  })

  it('캔버스를 벗어나도 사라진다 — 가리키기를 그만둔 것이다', () => {
    const { map } = setup()
    map.stops = [STOP_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))
    map.fire('mouseout', {})

    expect(hint(map)).toBeNull()
  })

  it('문자열이 없는 표시 위에서는 아무 말도 하지 않는다', () => {
    const { map } = setup()
    map.stops = [{ ...STOP_FEATURE, properties: { id: 'slot', color: '#7F77DD', tooltip: '' } }]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))

    expect(hint(map)).toBeNull()
  })

  it('스타일이 다시 로드돼 소스가 사라져도 다음 이동에서 되살아난다', () => {
    const { map } = setup()
    map.stops = [STOP_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))

    // 테마 교체 등으로 스타일이 통째로 다시 로드된 상황
    map.removeLayer(HINT_LAYER_ID)
    map.removeSource(HINT_SOURCE_ID)
    map.fire('mousemove', pointerEvent(11, 11, 127.011, 37.511))

    expect(hint(map)?.text).toBe('11:00')
  })

  it('걷어내면 레이어·소스·리스너가 남지 않는다', () => {
    const { map, detach } = setup()
    map.stops = [STOP_FEATURE]
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))
    detach()

    expect(map.getSource(HINT_SOURCE_ID)).toBeUndefined()
    expect(map.getLayer(HINT_LAYER_ID)).toBeUndefined()
    expect(map.listenerCount()).toBe(0)
  })
})

describe('호버 힌트와 드래그가 같은 지도에 있을 때', () => {
  function setupBoth() {
    const map = new FakeMap()
    const handlers = {
      onStopDragStart: vi.fn(),
      onStopDrop: vi.fn(),
      onStopDragCancel: vi.fn(),
    }
    const detachHints = attachStopHints(map as unknown as mapboxgl.Map)
    const detachDrag = attachStopDrag(map as unknown as mapboxgl.Map, handlers)
    map.stops = [STOP_FEATURE]
    return { map, handlers, detach: () => (detachDrag(), detachHints()) }
  }

  /** 프리뷰가 들고 다니는 줄 */
  function dragLabel(map: FakeMap) {
    return (map.dataOf('stop-drag-source')?.features ?? []).find(
      (f) => f.properties?.kind === 'label',
    )
  }

  it('끄는 동안에는 호버가 입을 다문다 — 같은 값이 두 줄로 보이지 않아야 한다', () => {
    const { map } = setupBoth()
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))
    expect(hint(map)).not.toBeNull()

    map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))
    expect(hint(map)).toBeNull()

    map.fire('mousemove', pointerEvent(60, 40, 127.2, 37.6))
    expect(hint(map)).toBeNull()
  })

  it('끌고 있는 칸의 값이 커서를 따라온다', () => {
    const { map } = setupBoth()
    map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))
    map.fire('mousemove', pointerEvent(60, 40, 127.2, 37.6))

    const label = dragLabel(map)
    expect(label?.properties?.text).toBe('11:00')
    expect((label?.geometry as GeoJSON.Point).coordinates).toEqual([127.2, 37.6])
  })

  it('놓으면 따라오던 줄이 사라지고 호버가 다시 답한다', () => {
    const { map } = setupBoth()
    map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))
    map.fire('mousemove', pointerEvent(60, 40, 127.2, 37.6))
    map.fire('mouseup', pointerEvent(60, 40, 127.2, 37.6))

    expect(map.dataOf('stop-drag-source')?.features).toEqual([])
    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))
    expect(hint(map)?.text).toBe('11:00')
  })

  it('ESC 로 취소해도 호버가 다시 답한다 — 재워 둔 것을 깨우지 않으면 영영 침묵한다', () => {
    const { map } = setupBoth()
    map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    map.fire('mousemove', pointerEvent(10, 10, 127.01, 37.51))
    expect(hint(map)?.text).toBe('11:00')
  })

  it('드래그 중 걷어내도 두 줄 모두 잔존물이 0 이다', () => {
    const { map, detach } = setupBoth()
    map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))
    map.fire('mousemove', pointerEvent(60, 40, 127.2, 37.6))
    detach()

    expect(map.getSource('stop-drag-source')).toBeUndefined()
    expect(map.getSource(HINT_SOURCE_ID)).toBeUndefined()
    expect(map.getLayer('stop-drag-label')).toBeUndefined()
    expect(map.getLayer(HINT_LAYER_ID)).toBeUndefined()
    expect(map.listenerCount()).toBe(0)
  })
})
