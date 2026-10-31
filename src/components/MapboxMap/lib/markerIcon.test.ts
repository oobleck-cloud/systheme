import { describe, expect, it } from 'vitest'

import { isCenterAnchored, markerImageId } from './markerIcon'

describe('markerImageId', () => {
  it('같은 그림이면 같은 이미지 id — 스프라이트를 공유한다', () => {
    const a = markerImageId({ number: '1', color: '#055cf5', label: '김서연' })
    const b = markerImageId({ number: '1', color: '#055cf5', label: '김서연' })
    expect(a).toBe(b)
  })

  it('variant가 다르면 다른 이미지 id', () => {
    const filled = markerImageId({ number: '1', color: '#055cf5', variant: 'filled' })
    const hollow = markerImageId({ number: '1', color: '#055cf5', variant: 'hollow' })
    const ghost = markerImageId({ number: '1', color: '#055cf5', variant: 'ghost' })
    expect(new Set([filled, hollow, ghost]).size).toBe(3)
  })

  it('variant 미지정은 filled와 동일하게 취급', () => {
    expect(markerImageId({ number: '1', color: '#055cf5' })).toBe(
      markerImageId({ number: '1', color: '#055cf5', variant: 'filled' }),
    )
  })

  it('active 여부가 이미지 id에 반영된다', () => {
    const plain = markerImageId({ number: '1', color: '#055cf5' })
    const active = markerImageId({ number: '1', color: '#055cf5', active: true })
    expect(plain).not.toBe(active)
  })

  it('역 원은 이름표를 굽지 않으므로 이름이 달라도 스프라이트를 공유한다', () => {
    const a = markerImageId({ number: '1', color: '#055cf5', variant: 'station', label: '김추영' })
    const b = markerImageId({ number: '1', color: '#055cf5', variant: 'station', label: '이주영' })
    expect(a).toBe(b)
  })

  it('역 원은 다른 변형과 구분된다', () => {
    expect(markerImageId({ number: '1', color: '#055cf5', variant: 'station' })).not.toBe(
      markerImageId({ number: '1', color: '#055cf5', variant: 'filled' }),
    )
  })

  it('좌표를 중심으로 놓는 변형은 역 원뿐', () => {
    expect(isCenterAnchored('station')).toBe(true)
    expect(isCenterAnchored('dot')).toBe(false)
    expect(isCenterAnchored(undefined)).toBe(false)
  })

  it('색·배지·이름표 중 하나만 달라도 다른 id', () => {
    const base = { number: '1', color: '#055cf5', label: '김서연' } as const
    const ids = new Set([
      markerImageId(base),
      markerImageId({ ...base, color: '#16a34a' }),
      markerImageId({ ...base, number: '2' }),
      markerImageId({ ...base, label: '박지훈' }),
    ])
    expect(ids.size).toBe(4)
  })
})
