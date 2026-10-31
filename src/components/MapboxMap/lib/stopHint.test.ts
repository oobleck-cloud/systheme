import { describe, expect, it } from 'vitest'

import {
  buildStopHint,
  hasHintTexts,
  resolveLegHint,
  resolveStopHint,
  type HintFeature,
} from './stopHint'

import type { MapArrow, MapRouteLoop } from '../types/mapbox.types'

/** 구간 위 표시가 `queryRenderedFeatures` 로 돌아오는 모양 */
function stopFeature(tooltip: string, color = '#7F77DD'): HintFeature {
  return {
    properties: { id: 'slot-11:00', color, tooltip },
    geometry: { type: 'Point', coordinates: [127, 37.5] },
  }
}

function legFeature(tooltip: string): HintFeature {
  return {
    properties: { legId: 'a→b#0', color: '#7F77DD', tooltip },
    geometry: {
      type: 'LineString',
      coordinates: [
        [126, 37],
        [128, 38],
      ],
    },
  }
}

describe('resolveStopHint', () => {
  it('표시의 자리에 건다 — 커서에 붙이면 손이 흔들릴 때 글자도 따라 떤다', () => {
    expect(resolveStopHint([stopFeature('11:00')])).toEqual({
      text: '11:00',
      at: { lng: 127, lat: 37.5 },
      color: '#7F77DD',
    })
  })

  it('문자열을 주지 않은 표시는 답하지 않는다 — 빈 줄을 띄우지 않는다', () => {
    expect(resolveStopHint([stopFeature('')])).toBeNull()
  })

  it('겹쳐 잡히면 문자열을 가진 첫 표시를 쓴다 — 한 번에 하나만 답한다', () => {
    const features = [stopFeature(''), stopFeature('11:00'), stopFeature('11:30')]
    expect(resolveStopHint(features)?.text).toBe('11:00')
  })

  it('색이 없으면 기본색 — 글자가 색 없이 그려지면 안 된다', () => {
    const noColor: HintFeature = {
      properties: { tooltip: '11:00' },
      geometry: { type: 'Point', coordinates: [127, 37.5] },
    }
    expect(resolveStopHint([noColor])?.color).toBe('#055cf5')
  })

  it('점이 아닌 도형에는 걸 자리가 없다', () => {
    expect(resolveStopHint([legFeature('11:00')])).toBeNull()
  })
})

describe('resolveLegHint', () => {
  const cursor = { lng: 127.2, lat: 37.6 }

  it('선에는 붙일 점이 없어 커서 자리에 건다', () => {
    expect(resolveLegHint([legFeature('10:30 → 12:00 · 여유 1시간')], cursor)).toEqual({
      text: '10:30 → 12:00 · 여유 1시간',
      at: cursor,
      color: '#7F77DD',
    })
  })

  it('문자열이 없는 구간은 답하지 않는다', () => {
    expect(resolveLegHint([legFeature('')], cursor)).toBeNull()
  })
})

describe('buildStopHint', () => {
  it('언제나 0 개 또는 1 개 — 두 줄이 동시에 뜰 방법이 없다', () => {
    expect(buildStopHint(null).features).toHaveLength(0)
    const fc = buildStopHint({ text: '11:00', at: { lng: 127, lat: 37.5 }, color: '#7F77DD' })
    expect(fc.features).toHaveLength(1)
    expect(fc.features[0]!.properties).toEqual({ text: '11:00', color: '#7F77DD' })
    expect((fc.features[0]!.geometry as GeoJSON.Point).coordinates).toEqual([127, 37.5])
  })
})

describe('hasHintTexts', () => {
  const bare: MapArrow[] = [{ from: 'a', to: 'b', stops: [{ id: 's1' }] }]
  const loop: MapRouteLoop = { id: 'shared', center: { lng: 127, lat: 37.5 } }

  it('아무도 문자열을 주지 않았으면 붙일 이유가 없다', () => {
    expect(hasHintTexts(bare, [loop])).toBe(false)
    expect(hasHintTexts([], [])).toBe(false)
  })

  it('구간·구간 위 표시·원 위 표시 중 하나라도 주면 켠다', () => {
    expect(hasHintTexts([{ from: 'a', to: 'b', tooltip: '한 시간' }], [])).toBe(true)
    expect(
      hasHintTexts([{ from: 'a', to: 'b', stops: [{ id: 's1', tooltip: '11:00' }] }], []),
    ).toBe(true)
    expect(
      hasHintTexts([], [{ ...loop, stops: [{ id: 's1', angle: 90, tooltip: '12:30' }] }]),
    ).toBe(true)
  })

  it('빈 문자열은 준 것이 아니다', () => {
    expect(hasHintTexts([{ from: 'a', to: 'b', tooltip: '' }], [])).toBe(false)
  })

  it('핀 하나만 문자열을 들어도 켠다 — 선이 하나도 없는 지도가 있다', () => {
    const pin = { id: 'm1', position: { lng: 127, lat: 37.5 } }
    expect(hasHintTexts([], [], [pin])).toBe(false)
    expect(hasHintTexts([], [], [{ ...pin, tooltip: '희망 10–14시' }])).toBe(true)
  })
})
