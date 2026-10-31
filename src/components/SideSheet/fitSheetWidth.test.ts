/**
 * 시트 폭은 **창이 아니라 자기가 사는 행**에 맞춘다.
 *
 * 예전에는 `100vw` 로만 막았다. 창은 넓어도 시트가 사는 행에는 사이드바·크롬이 이미 자리를
 * 차지하고 있어서, 창 기준으로 재면 그만큼 삐져나간다. 실제로 고객 이력 시트가 사이드바 밑으로
 * 밀려 **글자 왼쪽이 잘린 채** 열렸다.
 */
import { describe, expect, it } from 'vitest'

import { fitSheetWidth } from './SideSheet'

describe('fitSheetWidth', () => {
  it('측정 전에는 요청한 폭 그대로 둔다 — 한 프레임 뒤에 맞춰진다', () => {
    expect(fitSheetWidth(760, null, 320)).toEqual({ width: 760, covering: false })
    expect(fitSheetWidth(760, 0, 320)).toEqual({ width: 760, covering: false })
  })

  it('넓은 행에서는 요청한 폭을 그대로 준다', () => {
    expect(fitSheetWidth(760, 1600, 320)).toEqual({ width: 760, covering: false })
  })

  it('본문 자리를 먹을 만큼 넓으면 깎는다 — 본문이 0이 되면 나눠 갖는 게 아니다', () => {
    expect(fitSheetWidth(760, 1000, 320)).toEqual({ width: 680, covering: false })
  })

  it('폰 폭에서는 덮는다 — 잘린 시트보다 덮는 시트가 낫다', () => {
    // 고객 이력 시트가 실제로 잘렸던 조건(요청 760 · 행 482)
    expect(fitSheetWidth(760, 482, 320)).toEqual({ width: 482, covering: true })
    expect(fitSheetWidth(420, 375, 320)).toEqual({ width: 375, covering: true })
  })

  it('어떤 경우에도 행보다 넓어지지 않는다 — 잘림의 조건 그 자체', () => {
    for (const host of [320, 375, 482, 640, 768, 1024, 1440]) {
      for (const want of [420, 760, 960]) {
        expect(fitSheetWidth(want, host, 320).width).toBeLessThanOrEqual(host)
      }
    }
  })
})
