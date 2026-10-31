import { describe, expect, it } from 'vitest'

import {
  buildDragPreview,
  resolveDropMarkerId,
  resolveStopHandle,
  type HitFeature,
  type StopHandle,
} from './stopDrag'

/**
 * `queryRenderedFeatures` 가 돌려주는 모양만 흉내낸다 — 지도 인스턴스는 필요 없다.
 *
 * 구간 위 표시는 자기 구간(`legId` + 양 끝)을 싣고 온다. 루프 위 표시는 그것이 없다.
 */
function stopFeature(id: string, lng: number, lat: number, color?: string): HitFeature {
  return {
    properties: { id, ...(color ? { color } : {}) },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  }
}

/** 구간 위 표시 — a→b 구간의 중간에 놓인 자리 */
function legStopFeature(id: string, lng: number, lat: number): HitFeature {
  return {
    properties: {
      id,
      color: '#7F77DD',
      legId: 'a→b#0',
      legFromLng: 126,
      legFromLat: 37,
      legToLng: 128,
      legToLat: 38,
    },
    geometry: { type: 'Point', coordinates: [lng, lat] },
  }
}

describe('resolveStopHandle', () => {
  it('중간 표시를 집으면 id·자리·색을 함께 돌려준다', () => {
    expect(resolveStopHandle([stopFeature('slot-11:00', 127, 37.5, '#7F77DD')])).toEqual({
      stopId: 'slot-11:00',
      origin: { lng: 127, lat: 37.5 },
      color: '#7F77DD',
      leg: null,
      legId: null,
      text: null,
    })
  })

  it('구간 위 표시는 자기 구간의 두 끝과 id 를 함께 싣고 온다 — V 를 접을 자리다', () => {
    expect(resolveStopHandle([legStopFeature('slot-11:00', 127, 37.5)])).toEqual({
      stopId: 'slot-11:00',
      origin: { lng: 127, lat: 37.5 },
      color: '#7F77DD',
      leg: { from: { lng: 126, lat: 37 }, to: { lng: 128, lat: 38 } },
      legId: 'a→b#0',
      text: null,
    })
  })

  it('표시가 문자열을 싣고 오면 끌면서 함께 들고 다닐 값으로 떼어 온다', () => {
    const withText = stopFeature('slot-11:00', 127, 37.5, '#7F77DD')
    withText.properties!.tooltip = '11:00'
    expect(resolveStopHandle([withText])?.text).toBe('11:00')
  })

  it('빈 문자열은 그릴 것이 없다는 뜻이다 — 빈 라벨을 달고 다니지 않는다', () => {
    const empty = stopFeature('slot-11:00', 127, 37.5)
    empty.properties!.tooltip = ''
    expect(resolveStopHandle([empty])?.text).toBeNull()
  })

  it('구간 정보가 없으면 leg 는 null — 루프 위 표시는 접을 양 끝이 없다', () => {
    const handle = resolveStopHandle([stopFeature('slot-12:30', 127, 37.5)])
    expect(handle?.leg).toBeNull()
    expect(handle?.legId).toBeNull()
  })

  it('구간의 끝이 하나라도 성하지 않으면 통째로 버린다 — 반쪽 V 는 그리지 않는다', () => {
    const half = legStopFeature('slot', 127, 37.5)
    delete half.properties!.legToLat
    expect(resolveStopHandle([half])?.leg).toBeNull()

    const nan = legStopFeature('slot', 127, 37.5)
    nan.properties!.legFromLng = Number.NaN
    expect(resolveStopHandle([nan])?.leg).toBeNull()
  })

  it('색이 없으면 기본색을 쓴다 — 고무줄이 색 없이 그려지면 안 된다', () => {
    expect(resolveStopHandle([stopFeature('slot', 127, 37.5)])?.color).toBe('#055cf5')
  })

  it('여러 개가 겹치면 가장 위에 그려진 것(첫 결과)을 집는다', () => {
    const features = [stopFeature('top', 127, 37.5), stopFeature('below', 127.1, 37.6)]
    expect(resolveStopHandle(features)?.stopId).toBe('top')
  })

  it('id 가 없는 feature 는 건너뛴다 — 되돌려줄 식별자가 없으면 집을 이유가 없다', () => {
    const nameless: HitFeature = {
      properties: { color: '#000' },
      geometry: { type: 'Point', coordinates: [127, 37.5] },
    }
    expect(resolveStopHandle([nameless, stopFeature('real', 127, 37.5)])?.stopId).toBe('real')
  })

  it('점이 아닌 도형은 집지 않는다 — 고무줄의 시작점을 정할 수 없다', () => {
    const line: HitFeature = {
      properties: { id: 'line' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [127, 37.5],
          [127.1, 37.6],
        ],
      },
    }
    expect(resolveStopHandle([line])).toBeNull()
  })

  it('좌표가 숫자가 아니면 집지 않는다', () => {
    const broken: HitFeature = {
      properties: { id: 'broken' },
      geometry: { type: 'Point', coordinates: ['127', null] },
    }
    expect(resolveStopHandle([broken])).toBeNull()
  })

  it('아무것도 잡히지 않으면 null', () => {
    expect(resolveStopHandle([])).toBeNull()
  })
})

describe('resolveDropMarkerId', () => {
  it('마커 위에 놓으면 그 마커 id', () => {
    expect(resolveDropMarkerId([{ properties: { id: 'stop-2' } }])).toBe('stop-2')
  })

  it('마커 밖이면 null — 소비자가 "배정 안 함"으로 읽는다', () => {
    expect(resolveDropMarkerId([])).toBeNull()
  })

  it('클러스터 원 위에 놓은 것은 대상이 없는 것으로 본다', () => {
    const cluster: HitFeature = { properties: { cluster_id: 3, point_count: 7 } }
    expect(resolveDropMarkerId([cluster])).toBeNull()
  })

  it('클러스터가 위에 겹쳐 있어도 그 아래 낱개 마커는 잡는다', () => {
    const features: HitFeature[] = [
      { properties: { cluster_id: 3, point_count: 7 } },
      { properties: { id: 'stop-9' } },
    ]
    expect(resolveDropMarkerId(features)).toBe('stop-9')
  })

  it('빈 문자열 id 는 식별자가 아니다', () => {
    expect(resolveDropMarkerId([{ properties: { id: '' } }])).toBeNull()
  })
})

describe('buildDragPreview', () => {
  const origin = { lng: 127, lat: 37.5 }
  const cursor = { lng: 127.2, lat: 37.6 }

  /** 126 —(127 자리에 표시)— 128 인 구간 위의 표시 */
  const onLeg: StopHandle = {
    stopId: 'slot-11:00',
    origin,
    color: '#7F77DD',
    leg: { from: { lng: 126, lat: 37 }, to: { lng: 128, lat: 38 } },
    legId: 'a→b#0',
    text: null,
  }
  /** 구간을 모르는 표시(루프 위) */
  const loose: StopHandle = { ...onLeg, leg: null, legId: null }

  function lineOf(fc: GeoJSON.FeatureCollection): GeoJSON.Position[] {
    return (fc.features[0]!.geometry as GeoJSON.LineString).coordinates
  }

  it('구간을 아는 표시는 두 끝에서 커서로 접힌 V 를 낸다 — 순서는 from → 커서 → to', () => {
    const fc = buildDragPreview(onLeg, cursor)
    expect(fc.features.map((f) => f.properties?.kind)).toEqual(['rubber', 'tip'])
    expect(lineOf(fc)).toEqual([
      [126, 37],
      [127.2, 37.6],
      [128, 38],
    ])
    expect((fc.features[1]!.geometry as GeoJSON.Point).coordinates).toEqual([127.2, 37.6])
  })

  it('구간을 모르면 집은 자리에서 커서까지 단선으로 물러선다', () => {
    expect(lineOf(buildDragPreview(loose, cursor))).toEqual([
      [127, 37.5],
      [127.2, 37.6],
    ])
  })

  it('첫 프레임의 V 는 표시 자리를 지난다 — 감춘 원래 선과 그대로 겹쳐 도형이 뛰지 않는다', () => {
    expect(lineOf(buildDragPreview(onLeg, origin))).toEqual([
      [126, 37],
      [127, 37.5],
      [128, 38],
    ])
  })

  it('아직 움직이지 않았으면 길이 0 인 선 — 시작 프레임에도 끝 점이 제자리에 찍힌다', () => {
    const fc = buildDragPreview(loose, origin)
    expect(lineOf(fc)).toEqual([
      [127, 37.5],
      [127, 37.5],
    ])
  })

  it('선과 끝 점이 같은 색을 쓴다 — 집어 든 표시의 색을 그대로 이어받는다', () => {
    const fc = buildDragPreview({ ...onLeg, color: '#EF4444' }, cursor)
    expect(fc.features.map((f) => f.properties?.color)).toEqual(['#EF4444', '#EF4444'])
  })

  it('문자열이 있으면 커서 자리에 한 줄을 더 붙인다 — 끌면서 몇 시인지 봐야 하기 때문', () => {
    const fc = buildDragPreview({ ...onLeg, text: '11:00' }, cursor)
    expect(fc.features.map((f) => f.properties?.kind)).toEqual(['rubber', 'tip', 'label'])
    const label = fc.features[2]!
    expect(label.properties?.text).toBe('11:00')
    expect((label.geometry as GeoJSON.Point).coordinates).toEqual([127.2, 37.6])
  })

  it('문자열이 없으면 아무것도 늘리지 않는다 — 밀도를 0 만큼만 늘린다', () => {
    expect(buildDragPreview(onLeg, cursor).features).toHaveLength(2)
  })
})
