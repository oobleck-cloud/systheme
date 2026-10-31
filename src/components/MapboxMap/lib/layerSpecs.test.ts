/**
 * 레이어 정의를 Mapbox style-spec 검증기에 그대로 먹인다.
 *
 * 스타일 스펙 위반은 대부분 조용하다 — 레이어가 통째로 무시되거나 콘솔 경고 한 줄로 끝나서,
 * 지도를 띄우고 눈으로 봐야 알아차린다. 이 환경은 타일조차 뜨지 않으므로 더욱 그렇다.
 * (예: `symbol-spacing` 은 data-constant 라 표현식을 받지 못한다 — 이 검증으로 잡았다.)
 */
import { validate } from 'mapbox-gl/dist/style-spec/index.cjs'
import { describe, expect, it } from 'vitest'

import { setHiddenLeg, STOP_HANDLE_LAYERS, type MapLayerSpec } from './arrows'
import { STOP_DRAG_PREVIEW_LAYERS } from './stopDrag'
import { STOP_HINT_LAYERS } from './stopHint'

import type mapboxgl from 'mapbox-gl'

/**
 * 레이어가 참조하는 소스를 빈 geojson 으로 채운 최소 스타일.
 *
 * `glyphs` 는 글자를 그리는 레이어가 있으면 스타일에 있어야 한다. 실제 지도는 테마 스타일이
 * 들고 오지만, 검증용 최소 스타일에는 우리가 넣어 줘야 `text-field` 를 볼 수 있다.
 */
function styleWith(layers: MapLayerSpec[]) {
  const sources: Record<string, unknown> = {}
  for (const layer of layers) {
    const source = (layer as { source?: string }).source
    if (source) {
      sources[source] = { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }
    }
  }
  return {
    version: 8 as const,
    glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    sources,
    layers,
  }
}

describe('MapboxMap 레이어 정의 — style-spec 검증', () => {
  it('중간 표시 히트 레이어가 스펙을 지킨다', () => {
    expect(validate(styleWith(STOP_HANDLE_LAYERS))).toEqual([])
  })

  it('드래그 프리뷰 레이어가 스펙을 지킨다', () => {
    expect(validate(styleWith(STOP_DRAG_PREVIEW_LAYERS))).toEqual([])
  })

  it('호버 힌트 레이어가 스펙을 지킨다', () => {
    expect(validate(styleWith(STOP_HINT_LAYERS))).toEqual([])
  })

  it('셋을 한 스타일에 함께 올려도 id 충돌이 없다', () => {
    const layers = [...STOP_HANDLE_LAYERS, ...STOP_DRAG_PREVIEW_LAYERS, ...STOP_HINT_LAYERS]
    expect(validate(styleWith(layers))).toEqual([])
  })

  /**
   * 밀도 규율을 스펙 검증이 아니라 정의 자체로 못 박는다.
   *
   * `text-allow-overlap` 을 켜면 힌트가 지도 위 다른 글자를 덮고 올라앉는다. 그건 스펙 위반이
   * 아니라 조용히 잘 그려지는 종류의 사고라, 검증기가 아니라 여기서 잡아야 한다.
   */
  it('힌트 텍스트는 자리를 다투지 않는다 — 자리가 없으면 mapbox 가 떨군다', () => {
    const textLayers = [...STOP_HINT_LAYERS, ...STOP_DRAG_PREVIEW_LAYERS].filter(
      (layer) => (layer as { type?: string }).type === 'symbol',
    )
    expect(textLayers).toHaveLength(2)
    for (const layer of textLayers) {
      const layout = (layer as { layout?: Record<string, unknown> }).layout ?? {}
      expect(layout['text-allow-overlap']).toBeUndefined()
      expect(layout['text-ignore-placement']).toBeUndefined()
    }
  })
})

/**
 * 구간을 감출 때 거는 필터도 같은 검증을 받는다.
 *
 * 이 필터는 레이어 정의가 아니라 드래그 중에 조립되므로 위 검증에 걸리지 않는다. 잘못된
 * 필터는 조용히 무시되거나 레이어를 통째로 비우는데, 그 결과가 "구간을 감췄다" 와 눈으로
 * 구분되지 않아 더욱 늦게 발견된다.
 */
describe('구간 감춤 필터 — style-spec 검증', () => {
  /** `setHiddenLeg` 가 무엇을 거는지만 받아 적는 가짜 지도 */
  function captureFilters(legId: string | null): Record<string, unknown> {
    const filters: Record<string, unknown> = {}
    const map = {
      getLayer: (id: string) => ({ id }),
      setFilter: (id: string, filter: unknown) => {
        filters[id] = filter
      },
    }
    setHiddenLeg(map as unknown as mapboxgl.Map, legId)
    return filters
  }

  function styleWithFilters(filters: Record<string, unknown>) {
    const layers = Object.entries(filters).map(([id, filter]) => ({
      id,
      type: 'line' as const,
      source: 'src',
      ...(filter === undefined ? {} : { filter }),
    }))
    return styleWith(layers as MapLayerSpec[])
  }

  it('구간을 감추는 필터가 스펙을 지킨다 — 이름 레이어는 원래 조건과 합쳐진다', () => {
    const filters = captureFilters('a→b#0')
    expect(validate(styleWithFilters(filters))).toEqual([])
    expect(filters['arrows-label']).toEqual([
      'all',
      ['!=', ['get', 'label'], ''],
      ['!=', ['get', 'legId'], 'a→b#0'],
    ])
  })

  it('되돌린 필터도 스펙을 지킨다', () => {
    expect(validate(styleWithFilters(captureFilters(null)))).toEqual([])
  })
})
