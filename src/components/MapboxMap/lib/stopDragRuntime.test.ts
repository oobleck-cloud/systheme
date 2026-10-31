/**
 * 드래그 세션의 흐름을 가짜 지도로 확인한다.
 *
 * 이 환경은 타일 서버가 막혀 있어 실제 지도 위 드래그를 눈으로 볼 수 없다. 그래서 지도에서
 * 우리가 실제로 쓰는 부분(이벤트·질의·`dragPan`·소스)만 흉내 낸 뒤, 손이 하는 순서대로
 * 이벤트를 흘려 넣어 "무엇이 언제 불리고 지도 상태가 되돌아오는가"를 확인한다.
 * `arrows.test.ts` 가 카메라를 주입하는 것과 같은 이유다.
 */
import { describe, expect, it, vi } from 'vitest'

import { STOP_HANDLE_LAYER_IDS } from './arrows'
import { MARKER_SPRITE_LAYER_ID } from './markerLayers'
import { attachStopDrag, type HitFeature, type StopDragHandlers } from './stopDrag'

import type mapboxgl from 'mapbox-gl'

type Listener = (event: never) => void

/** 구간 도형 레이어 — 드래그 중 감췄다가 되돌려야 하는 것들 */
const LEG_LAYER_IDS = ['arrows-line', 'arrows-label', 'arrow-stops']

/** 구간 위 표시 — 자기 구간의 id 와 두 끝을 싣고 온다 */
const STOP_FEATURE: HitFeature = {
  properties: {
    id: 'slot-12:30',
    color: '#7F77DD',
    legId: 'a→b#0',
    legFromLng: 126,
    legFromLat: 37,
    legToLng: 128,
    legToLat: 38,
  },
  geometry: { type: 'Point', coordinates: [127, 37.5] },
}

/** 루프 위 표시 — 접을 구간이 없다 */
const LOOP_STOP_FEATURE: HitFeature = {
  properties: { id: 'slot-12:30', color: '#7F77DD' },
  geometry: { type: 'Point', coordinates: [127, 37.5] },
}

class FakeMap {
  private listeners = new Map<string, Set<Listener>>()
  private layers = new Set<string>([
    ...STOP_HANDLE_LAYER_IDS,
    ...LEG_LAYER_IDS,
    MARKER_SPRITE_LAYER_ID,
  ])
  private filters = new Map<string, unknown>()
  private sources = new Map<string, { setData: (data: unknown) => void; data: unknown }>()
  private canvas = document.createElement('canvas')

  /** 히트 레이어 질의 결과 — 커서 아래에 중간 표시가 있는가 */
  stops: HitFeature[] = [STOP_FEATURE]
  /** 마커 레이어 질의 결과 — 놓은 자리에 마커가 있는가 */
  markers: HitFeature[] = []

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

  /** 붙어 있는 리스너 총수 — 걷어낸 뒤 0 이어야 한다 */
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

  queryRenderedFeatures(_point: [number, number], options: { layers: string[] }) {
    if (options.layers.some((id) => STOP_HANDLE_LAYER_IDS.includes(id))) return this.stops
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

  setFilter(id: string, filter: unknown) {
    this.filters.set(id, filter)
  }

  /** 그 레이어에 걸린 필터. 아무도 건드리지 않았으면 undefined */
  filterOf(id: string): unknown {
    return this.filters.get(id)
  }

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

  previewData(): GeoJSON.FeatureCollection | undefined {
    return this.sources.get('stop-drag-source')?.data as GeoJSON.FeatureCollection | undefined
  }

  getCanvas() {
    return this.canvas
  }

  cursor(): string {
    return this.canvas.style.cursor
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

function setup(overrides: Partial<FakeMap> = {}) {
  const map = Object.assign(new FakeMap(), overrides)
  const handlers: Required<StopDragHandlers> = {
    onStopDragStart: vi.fn(),
    onStopDrop: vi.fn(),
    onStopDragCancel: vi.fn(),
  }
  const detach = attachStopDrag(map as unknown as mapboxgl.Map, handlers)
  return { map, handlers, detach }
}

/** 중간 표시를 집어 커서를 옮기는 데까지 */
function grab(map: FakeMap) {
  map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))
  map.fire('mousemove', pointerEvent(60, 40, 127.2, 37.6))
}

/** 구간 도형 레이어 중 하나라도 특정 구간을 걷어내고 있는가 */
function hidesLeg(map: FakeMap): boolean {
  return LEG_LAYER_IDS.some((id) => JSON.stringify(map.filterOf(id) ?? null).includes('legId'))
}

function rubberLine(map: FakeMap): GeoJSON.Position[] {
  return (map.previewData()?.features[0]?.geometry as GeoJSON.LineString).coordinates
}

describe('attachStopDrag', () => {
  it('중간 표시를 집으면 지도를 세우고 드래그 시작을 알린다', () => {
    const { map, handlers } = setup()
    grab(map)

    expect(handlers.onStopDragStart).toHaveBeenCalledWith('slot-12:30')
    expect(map.dragPanEnabled).toBe(false)
    expect(map.scrollZoomEnabled).toBe(false)
    expect(map.cursor()).toBe('grabbing')
  })

  it('커서를 따라 구간이 V 로 접힌다 — 전용 소스만 갱신한다', () => {
    const { map } = setup()
    grab(map)

    expect(rubberLine(map)).toEqual([
      [126, 37],
      [127.2, 37.6],
      [128, 38],
    ])
  })

  it('끄는 동안 원래 구간을 감추고, 끝나면 되돌린다 — 선이 둘로 보이지 않아야 한다', () => {
    const { map } = setup()
    expect(hidesLeg(map)).toBe(false)

    grab(map)
    expect(hidesLeg(map)).toBe(true)
    for (const id of LEG_LAYER_IDS) {
      expect(JSON.stringify(map.filterOf(id))).toContain('a→b#0')
    }

    map.fire('mouseup', pointerEvent(60, 40, 127.2, 37.6))
    expect(hidesLeg(map)).toBe(false)
    // 이름 레이어가 늘 걸고 있던 조건은 되돌린 뒤에도 남아 있어야 한다.
    expect(map.filterOf('arrows-label')).toEqual(['!=', ['get', 'label'], ''])
    expect(map.filterOf('arrows-line')).toBeUndefined()
  })

  it('ESC 로 취소해도 감춘 구간이 돌아온다 — 안 그러면 선이 사라진 채로 남는다', () => {
    const { map } = setup()
    grab(map)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(hidesLeg(map)).toBe(false)
  })

  it('드래그 중 걷어내도 감춘 구간이 돌아온다', () => {
    const { map, detach } = setup()
    grab(map)
    detach()

    expect(hidesLeg(map)).toBe(false)
  })

  it('루프 위 표시는 접을 구간이 없다 — 단선 프리뷰만 끌고 아무것도 감추지 않는다', () => {
    const { map, handlers } = setup()
    map.stops = [LOOP_STOP_FEATURE]
    grab(map)

    expect(rubberLine(map)).toEqual([
      [127, 37.5],
      [127.2, 37.6],
    ])
    expect(hidesLeg(map)).toBe(false)
    // 감출 것이 없다고 해서 드래그 자체가 달라지지는 않는다.
    expect(handlers.onStopDragStart).toHaveBeenCalledWith('slot-12:30')
  })

  it('마커 위에 놓으면 드롭만 알린다 — 취소는 오지 않는다', () => {
    const { map, handlers } = setup()
    map.markers = [{ properties: { id: 'stop-2' } }]
    grab(map)
    map.fire('mouseup', pointerEvent(60, 40, 127.2, 37.6))

    expect(handlers.onStopDrop).toHaveBeenCalledWith({
      stopId: 'slot-12:30',
      markerId: 'stop-2',
      lngLat: { lng: 127.2, lat: 37.6 },
    })
    expect(handlers.onStopDragCancel).not.toHaveBeenCalled()
    expect(map.dragPanEnabled).toBe(true)
    expect(map.scrollZoomEnabled).toBe(true)
    expect(map.previewData()?.features).toEqual([])
  })

  it('마커 밖에 놓으면 markerId 는 null 이고 취소가 뒤따른다', () => {
    const { map, handlers } = setup()
    grab(map)
    map.fire('mouseup', pointerEvent(60, 40, 127.2, 37.6))

    expect(handlers.onStopDrop).toHaveBeenCalledWith(
      expect.objectContaining({ stopId: 'slot-12:30', markerId: null }),
    )
    expect(handlers.onStopDragCancel).toHaveBeenCalledTimes(1)
  })

  it('ESC 로 취소하면 드롭 없이 끝난다', () => {
    const { map, handlers } = setup()
    grab(map)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(handlers.onStopDrop).not.toHaveBeenCalled()
    expect(handlers.onStopDragCancel).toHaveBeenCalledTimes(1)
    expect(map.dragPanEnabled).toBe(true)
  })

  it('지도 밖에서 손을 떼도 세션이 남지 않는다', () => {
    const { map, handlers } = setup()
    grab(map)
    window.dispatchEvent(new MouseEvent('mouseup'))

    expect(handlers.onStopDragCancel).toHaveBeenCalledTimes(1)
    expect(map.dragPanEnabled).toBe(true)
  })

  it('중간 표시가 없는 자리를 누르면 아무 일도 일어나지 않는다', () => {
    const { map, handlers } = setup()
    map.stops = []
    map.fire('mousedown', pointerEvent(10, 10, 127, 37.5))

    expect(handlers.onStopDragStart).not.toHaveBeenCalled()
    expect(map.dragPanEnabled).toBe(true)
  })

  it('hover 는 잡히는 자리에서만 grab 커서를 건다', () => {
    const { map } = setup()
    map.fire('mousemove', pointerEvent(10, 10, 127, 37.5))
    expect(map.cursor()).toBe('grab')

    map.stops = []
    map.fire('mousemove', pointerEvent(400, 400, 128, 38))
    expect(map.cursor()).toBe('')
  })

  it('드래그 중 걷어내도 지도 상태와 리스너가 새지 않는다', () => {
    const { map, handlers, detach } = setup()
    grab(map)
    detach()

    expect(handlers.onStopDragCancel).toHaveBeenCalledTimes(1)
    expect(map.dragPanEnabled).toBe(true)
    expect(map.scrollZoomEnabled).toBe(true)
    expect(map.listenerCount()).toBe(0)
    expect(map.getSource('stop-drag-source')).toBeUndefined()
  })

  it('원래 꺼져 있던 카메라 조작은 끝나도 켜지 않는다', () => {
    const { map } = setup()
    map.dragPanEnabled = false
    map.scrollZoomEnabled = false
    grab(map)
    map.fire('mouseup', pointerEvent(60, 40, 127.2, 37.6))

    expect(map.dragPanEnabled).toBe(false)
    expect(map.scrollZoomEnabled).toBe(false)
  })

  it('한 손가락 터치도 같은 핸들로 동작한다', () => {
    const { map, handlers } = setup()
    map.markers = [{ properties: { id: 'stop-2' } }]
    map.fire('touchstart', pointerEvent(10, 10, 127, 37.5))
    map.fire('touchmove', pointerEvent(60, 40, 127.2, 37.6))
    map.fire('touchend', pointerEvent(60, 40, 127.2, 37.6))

    expect(handlers.onStopDragStart).toHaveBeenCalledWith('slot-12:30')
    expect(handlers.onStopDrop).toHaveBeenCalledWith(
      expect.objectContaining({ markerId: 'stop-2' }),
    )
  })

  it('두 손가락은 지도 제스처다 — 핸들을 집지 않는다', () => {
    const { map, handlers } = setup()
    const twoFingers = {
      ...pointerEvent(10, 10, 127, 37.5),
      points: [
        { x: 10, y: 10 },
        { x: 40, y: 40 },
      ],
    }
    map.fire('touchstart', twoFingers)

    expect(handlers.onStopDragStart).not.toHaveBeenCalled()
    expect(map.dragPanEnabled).toBe(true)
  })
})
