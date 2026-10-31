import { describe, expect, it, vi } from 'vitest'

vi.mock('./markerIcon', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./markerIcon')>()
  return { ...actual, loadMarkerIconAsImage: vi.fn(async () => ({}) as HTMLImageElement) }
})
vi.mock('mapbox-gl', () => ({ default: { Popup: vi.fn(), Marker: vi.fn() } }))

const { addMarkerLayers, removeMarkerLayers, MARKER_SPRITE_LAYER_ID } =
  await import('./markerLayers')

import type { MapMarker } from '../types/mapbox.types'

/** 레이어·소스·그림을 흉내 내고, 무엇이 지워졌는지 적는 지도 */
function fakeMap() {
  const images = new Set<string>()
  const layers = new Set<string>()
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>()
  const log: string[] = []
  const map = {
    hasImage: (id: string) => images.has(id),
    addImage: (id: string) => {
      images.add(id)
      log.push(`addImage ${id}`)
    },
    removeImage: (id: string) => {
      images.delete(id)
      log.push(`removeImage ${id}`)
    },
    getLayer: (id: string) => (layers.has(id) ? { id } : undefined),
    addLayer: (spec: { id: string }) => {
      layers.add(spec.id)
      log.push(`addLayer ${spec.id}`)
    },
    removeLayer: (id: string) => {
      layers.delete(id)
      log.push(`removeLayer ${id}`)
    },
    setFilter: vi.fn(),
    getSource: (id: string) => sources.get(id),
    addSource: (id: string) => {
      sources.set(id, { setData: vi.fn() })
      log.push(`addSource ${id}`)
    },
    removeSource: (id: string) => {
      sources.delete(id)
      log.push(`removeSource ${id}`)
    },
    on: vi.fn(),
    off: vi.fn(),
    getCanvas: () => ({ style: {} }),
  }
  return { map: map as unknown as mapboxgl.Map, images, layers, log }
}

function marker(id: string, color: string): MapMarker {
  return { id, position: { lng: 127, lat: 37.5 }, color }
}

describe('addMarkerLayers — 제자리 갱신', () => {
  it('두 번째 갱신은 레이어·소스를 지우지 않고, 더는 안 쓰는 그림만 걷는다', async () => {
    const { map, images, log } = fakeMap()
    const detach1 = await addMarkerLayers(map, [marker('a', '#ff0000'), marker('b', '#00ff00')], {})
    detach1()
    const before = new Set(images)
    log.length = 0

    await addMarkerLayers(map, [marker('a', '#ff0000'), marker('c', '#0000ff')], {})

    expect(log.filter((l) => l.startsWith('removeLayer') || l.startsWith('removeSource'))).toEqual(
      [],
    )
    expect(log.filter((l) => l.startsWith('addLayer'))).toEqual([])
    // 빨강은 그대로, 초록은 걷히고, 파랑이 새로 생긴다 — 새 그림이 먼저 올라간 뒤 걷는다
    const removed = log.filter((l) => l.startsWith('removeImage'))
    const added = log.filter((l) => l.startsWith('addImage'))
    expect(added).toHaveLength(1)
    expect(removed).toHaveLength(1)
    expect(log.indexOf(added[0]!)).toBeLessThan(log.indexOf(removed[0]!))
    expect(images.size).toBe(2)
    expect([...before].filter((id) => images.has(id))).toHaveLength(1)
  })

  it('다 걷을 때는 레이어·소스·그림을 모두 지운다', async () => {
    const { map, images, layers } = fakeMap()
    await addMarkerLayers(map, [marker('a', '#ff0000')], {})
    expect(layers.has(MARKER_SPRITE_LAYER_ID)).toBe(true)

    removeMarkerLayers(map)

    expect(images.size).toBe(0)
    expect(layers.size).toBe(0)
  })

  it('그림을 굽는 사이 낡은 호출이 되면 레이어·데이터·그림을 건드리지 않는다', async () => {
    const { map, images, layers } = fakeMap()
    let stale = false
    const pending = addMarkerLayers(map, [marker('a', '#ff0000')], {}, undefined, () => stale)
    stale = true
    await pending

    expect(images.size).toBe(0)
    expect(layers.size).toBe(0)
  })
})
