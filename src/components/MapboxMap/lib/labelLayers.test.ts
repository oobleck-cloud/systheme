import { describe, expect, it } from 'vitest'

import { LABEL_LAYER_ID, labelBeforeId, labelImageId, measureLabel } from './labelLayers'

import type { MapLabel } from '../types/mapbox.types'

const chip: MapLabel = {
  id: 'region:R1',
  position: { lng: 127, lat: 37.5 },
  lines: [
    [
      { text: '강서구', size: 11, weight: 600, color: '#2563eb' },
      { text: '7', size: 11, color: 'var(--color-fg-muted)' },
    ],
  ],
  background: 'var(--color-background)',
  borderColor: '#2563eb',
}

/** 글자 하나를 size×0.5 폭으로 재는 가짜 자 */
const ruler = (run: { text: string; size: number }) => run.text.length * run.size * 0.5

describe('labelBeforeId — 라벨은 핀·동선 밑, 구역 면 위', () => {
  it('맨 앞의 "라벨보다 위" 레이어 바로 밑에 끼운다', () => {
    const layers = [
      'road',
      'region-fill',
      'region-outline',
      'arrows-line',
      'arrow-stops',
      'markers-sprite',
    ]
    expect(labelBeforeId(layers)).toBe('arrows-line')
  })

  it('동선이 없으면 마커 밑', () => {
    expect(labelBeforeId(['road', 'region-fill', 'markers-sprite'])).toBe('markers-sprite')
  })

  it('라벨 자신과 구역·바탕 레이어는 기준이 아니다', () => {
    expect(labelBeforeId(['road', 'region-fill', LABEL_LAYER_ID])).toBeUndefined()
  })

  it('끌기 미리보기·힌트도 라벨 위다', () => {
    expect(labelBeforeId(['region-fill', 'stop-hint-label'])).toBe('stop-hint-label')
  })
})

describe('measureLabel', () => {
  it('한 줄 조각은 사이 간격을 두고 잇고, 여백·테두리를 더한다', () => {
    const box = measureLabel(chip, ruler)
    // 강서구 3×5.5 + 간격 6 + 7 1×5.5 = 28, 여백 8×2 + 테두리 2
    expect(box.width).toBeCloseTo(28 + 16 + 2)
    // 11 × 1.25 + 여백 2×2 + 테두리 2
    expect(box.height).toBeCloseTo(13.75 + 4 + 2)
  })

  it('여러 줄은 가장 넓은 줄에 맞추고 높이를 쌓는다', () => {
    const box = measureLabel(
      {
        padding: [0, 0],
        lines: [
          [{ text: 'ab', size: 10, color: '#000' }],
          [{ text: 'abcd', size: 20, color: '#000' }],
        ],
      },
      ruler,
    )
    expect(box.width).toBeCloseTo(40 + 2)
    expect(box.height).toBeCloseTo(12.5 + 25 + 1 + 2)
  })
})

describe('labelImageId', () => {
  it('모습이 같으면 id 가 달라도 같은 그림을 쓴다', () => {
    expect(labelImageId(chip, 'Pretendard')).toBe(
      labelImageId({ ...chip, id: 'region:R9', position: { lng: 0, lat: 0 } }, 'Pretendard'),
    )
  })

  it('글자·색·글꼴이 바뀌면 다른 그림이다', () => {
    const base = labelImageId(chip, 'Pretendard')
    expect(labelImageId({ ...chip, background: '#fff' }, 'Pretendard')).not.toBe(base)
    expect(labelImageId(chip, 'serif')).not.toBe(base)
  })
})
