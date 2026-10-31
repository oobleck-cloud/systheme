import { describe, expect, it } from 'vitest'

import {
  buildArrowCollections,
  buildLoopCollection,
  type ArrowCamera,
  type ArrowPlan,
} from './arrows'

import type { MapArrow, MapMarker, MapRouteLoop } from '../types/mapbox.types'

/**
 * 경위도 1도 = 100px 인 선형 카메라.
 *
 * 실제 Web Mercator 는 위도에 따라 배율이 달라지지만, 여기서 확인하려는 것은 "픽셀 오프셋과
 * bow 가 경로에 반영되는가" 라서 되돌릴 수 있는 변환이면 충분하다.
 */
const camera: ArrowCamera = {
  // y 를 위도의 부호 반전이 아니라 오프셋으로 두어 결과에 -0 이 섞이지 않게 한다.
  project: ([lng, lat]) => ({ x: lng * 100, y: (90 - lat) * 100 }),
  unproject: ([x, y]) => ({ lng: x / 100, lat: 90 - y / 100 }),
  getZoom: () => 14,
}

function marker(id: string, lng: number, lat: number, pixelOffset?: [number, number]): MapMarker {
  return { id, position: { lng, lat }, ...(pixelOffset ? { pixelOffset } : {}) }
}

function plan(arrow: MapArrow, from: MapMarker, to: MapMarker): ArrowPlan {
  return { arrow, from, to, road: null }
}

const A = marker('a', 0, 0)
const B = marker('b', 1, 0)

function lineOf(result: ReturnType<typeof buildArrowCollections>): GeoJSON.Position[] {
  const feature = result.lines.features[0]!
  return (feature.geometry as GeoJSON.LineString).coordinates
}

describe('buildArrowCollections', () => {
  it('평범한 직선은 두 끝점 그대로', () => {
    const result = buildArrowCollections(camera, [plan({ from: 'a', to: 'b' }, A, B)])
    expect(lineOf(result)).toEqual([
      [0, 0],
      [1, 0],
    ])
  })

  it('마커의 pixelOffset 을 선 끝점에 반영한다', () => {
    const shifted = marker('b', 1, 0, [50, 0])
    const result = buildArrowCollections(camera, [plan({ from: 'a', to: 'b' }, A, shifted)])
    // 100px = 1도 이므로 50px 이동은 경도 +0.5
    expect(lineOf(result)[1]).toEqual([1.5, 0])
  })

  it('stops 를 구간 위에 순서대로 균등 배치한다', () => {
    const arrow: MapArrow = {
      from: 'a',
      to: 'b',
      stops: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
    }
    const result = buildArrowCollections(camera, [plan(arrow, A, B)])
    expect(result.stops.features.map((f) => f.properties?.id)).toEqual(['s1', 's2', 's3'])
    expect(result.stops.features.map((f) => (f.geometry as GeoJSON.Point).coordinates[0])).toEqual([
      0.25, 0.5, 0.75,
    ])
  })

  it('stops 색을 지정하지 않으면 선 색을 따른다', () => {
    const arrow: MapArrow = {
      from: 'a',
      to: 'b',
      color: '#7F77DD',
      stops: [{ id: 's1' }, { id: 's2', color: '#EF4444' }],
    }
    const result = buildArrowCollections(camera, [plan(arrow, A, B)])
    expect(result.stops.features.map((f) => f.properties?.color)).toEqual(['#7F77DD', '#EF4444'])
  })

  it('stops 는 자기 구간의 두 끝을 함께 싣는다 — 끌 때 V 를 접을 자리다', () => {
    const arrow: MapArrow = { from: 'a', to: 'b', stops: [{ id: 's1' }] }
    const stop = buildArrowCollections(camera, [plan(arrow, A, B)]).stops.features[0]!
    expect(stop.properties).toMatchObject({
      legFromLng: 0,
      legFromLat: 0,
      legToLng: 1,
      legToLat: 0,
    })
  })

  it('구간 끝은 선과 같은 자리다 — pixelOffset 으로 비켜 놓은 끝점을 따라간다', () => {
    const shifted = marker('b', 1, 0, [50, 0])
    const arrow: MapArrow = { from: 'a', to: 'b', stops: [{ id: 's1' }] }
    const result = buildArrowCollections(camera, [plan(arrow, A, shifted)])
    expect(result.stops.features[0]!.properties?.legToLng).toBe(lineOf(result)[1]![0])
  })

  it('선과 그 위 표시가 같은 legId 를 쓴다 — 끄는 동안 감출 대상을 이것으로 고른다', () => {
    const arrow: MapArrow = { id: 'leg-7', from: 'a', to: 'b', stops: [{ id: 's1' }] }
    const result = buildArrowCollections(camera, [plan(arrow, A, B)])
    expect(result.lines.features[0]!.properties?.legId).toBe('leg-7')
    expect(result.stops.features[0]!.properties?.legId).toBe('leg-7')
  })

  it('id 가 없어도 같은 두 마커를 잇는 화살표끼리 legId 가 겹치지 않는다', () => {
    const one: MapArrow = { from: 'a', to: 'b' }
    const two: MapArrow = { from: 'a', to: 'b' }
    const ids = buildArrowCollections(camera, [
      plan(one, A, B),
      plan(two, A, B),
    ]).lines.features.map((f) => f.properties?.legId)
    expect(new Set(ids).size).toBe(2)
  })

  it('label 은 선 feature 에 실린다 — 반복 표기는 symbol 레이어가 맡는다', () => {
    const withLabel = buildArrowCollections(camera, [
      plan({ from: 'a', to: 'b', label: '김추영' }, A, B),
    ])
    const without = buildArrowCollections(camera, [plan({ from: 'a', to: 'b' }, A, B)])
    expect(withLabel.lines.features[0]!.properties?.label).toBe('김추영')
    // 라벨 레이어가 빈 문자열을 걸러내므로 미지정은 '' 여야 한다
    expect(without.lines.features[0]!.properties?.label).toBe('')
  })

  it('tooltip 은 선과 표시에 실려만 간다 — 그릴지 말지는 가리킬 때 정해진다', () => {
    const arrow: MapArrow = {
      from: 'a',
      to: 'b',
      tooltip: '10:30 → 12:00 · 여유 1시간',
      stops: [{ id: 's1', tooltip: '11:00' }, { id: 's2' }],
    }
    const result = buildArrowCollections(camera, [plan(arrow, A, B)])
    expect(result.lines.features[0]!.properties?.tooltip).toBe('10:30 → 12:00 · 여유 1시간')
    expect(result.stops.features.map((f) => f.properties?.tooltip)).toEqual(['11:00', ''])
  })

  it('도로 경로는 픽셀 계산 없이 그대로 쓴다', () => {
    const road: GeoJSON.LineString = {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [0.4, 0.3],
        [1, 0],
      ],
    }
    const result = buildArrowCollections(camera, [
      { arrow: { from: 'a', to: 'b', stops: [{ id: 's1' }] }, from: A, to: B, road },
    ])
    expect(lineOf(result)).toEqual(road.coordinates)
    expect(result.stops.features).toHaveLength(0)
  })
})

describe('buildLoopCollection', () => {
  const loop: MapRouteLoop = {
    id: 'shared',
    center: { lng: 1, lat: 0 },
    radius: 36,
    color: '#7F77DD',
    stops: [{ id: 'slot-12:30', angle: 90 }],
  }

  function kinds(fc: GeoJSON.FeatureCollection) {
    return fc.features.map((f) => f.properties?.kind)
  }

  it('원 둘레·중심 점·중간 표시를 함께 낸다', () => {
    expect(kinds(buildLoopCollection(camera, [loop]))).toEqual(['ring', 'center', 'stop'])
  })

  it('중심 점은 진짜 좌표에 찍힌다', () => {
    const fc = buildLoopCollection(camera, [loop])
    const center = fc.features.find((f) => f.properties?.kind === 'center')!
    expect((center.geometry as GeoJSON.Point).coordinates).toEqual([1, 0])
  })

  it('원 둘레의 모든 점이 중심에서 반지름만큼 떨어져 있다', () => {
    const fc = buildLoopCollection(camera, [loop])
    const ring = fc.features.find((f) => f.properties?.kind === 'ring')!
    const c = camera.project([1, 0])
    for (const [lng, lat] of (ring.geometry as GeoJSON.LineString).coordinates) {
      const p = camera.project([lng, lat])
      expect(Math.hypot(p.x - c.x, p.y - c.y)).toBeCloseTo(36, 6)
    }
  })

  it('중간 표시는 지정한 각도로 원 위에 얹힌다 — 90도는 화면 아래', () => {
    const fc = buildLoopCollection(camera, [loop])
    const stop = fc.features.find((f) => f.properties?.kind === 'stop')!
    const [lng, lat] = (stop.geometry as GeoJSON.Point).coordinates as [number, number]
    const p = camera.project([lng, lat])
    const c = camera.project([1, 0])
    expect(p.x).toBeCloseTo(c.x, 6)
    expect(p.y).toBeCloseTo(c.y + 36, 6)
  })

  it('기본 임계(줌 11) 미만으로 축소하면 원을 그리지 않는다', () => {
    const zoomedOut = { ...camera, getZoom: () => 9 }
    expect(buildLoopCollection(zoomedOut, [loop]).features).toHaveLength(0)
  })

  it('minZoom 을 직접 주면 그 값을 쓴다', () => {
    const at12 = { ...camera, getZoom: () => 12 }
    expect(buildLoopCollection(at12, [{ ...loop, minZoom: 15 }]).features).toHaveLength(0)
    expect(buildLoopCollection(at12, [{ ...loop, minZoom: 10 }]).features.length).toBeGreaterThan(0)
  })

  it('원 위 표시에는 구간의 끝을 싣지 않는다 — 원은 접을 양 끝이 없다', () => {
    const fc = buildLoopCollection(camera, [loop])
    const stop = fc.features.find((f) => f.properties?.kind === 'stop')!
    expect(stop.properties).not.toHaveProperty('legFromLng')
    expect(stop.properties).not.toHaveProperty('legId')
  })

  it('원 위 표시도 자기 tooltip 을 싣고 온다 — 구간 위 표시와 같은 물건이어야 한다', () => {
    const fc = buildLoopCollection(camera, [
      { ...loop, stops: [{ id: 'slot-12:30', angle: 90, tooltip: '12:30' }] },
    ])
    const stop = fc.features.find((f) => f.properties?.kind === 'stop')!
    expect(stop.properties?.tooltip).toBe('12:30')
  })

  it('showCenter 를 끄면 중심 점을 찍지 않는다', () => {
    const fc = buildLoopCollection(camera, [{ ...loop, showCenter: false }])
    expect(kinds(fc)).toEqual(['ring', 'stop'])
  })
})
