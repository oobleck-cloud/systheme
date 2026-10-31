import { describe, expect, it } from 'vitest'

import { pickMostSpecificRegionFeature, regionCodeSpecificity } from './region-hit'

describe('regionCodeSpecificity', () => {
  it('ranks dong above sigungu', () => {
    expect(regionCodeSpecificity('4113500000')).toBe(2)
    expect(regionCodeSpecificity('4113510200')).toBeGreaterThan(regionCodeSpecificity('4113500000'))
  })
})

describe('pickMostSpecificRegionFeature', () => {
  it('prefers smaller dong polygon over overlapping gu', () => {
    const gu: GeoJSON.Feature = {
      type: 'Feature',
      properties: { regionCode: '4113500000' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [10, 0],
            [10, 10],
            [0, 10],
            [0, 0],
          ],
        ],
      },
    }
    const dong: GeoJSON.Feature = {
      type: 'Feature',
      properties: { regionCode: '4113510200' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [1, 1],
            [2, 1],
            [2, 2],
            [1, 2],
            [1, 1],
          ],
        ],
      },
    }
    const picked = pickMostSpecificRegionFeature([gu, dong])
    expect((picked?.properties as { regionCode: string }).regionCode).toBe('4113510200')
  })
})
