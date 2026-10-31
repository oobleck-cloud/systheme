import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, test } from 'vitest'

import { AxisExpand, PanelReveal, ScaleReveal } from './reveal'

afterEach(() => cleanup())

/**
 * Expressive Motion Language primitives — 렌더 스모크.
 * 모션 자체(스프링 값)는 motionTokens 소관이라 여기선 계약만 핀한다:
 *  - children 렌더 + rest props(role 등) 패스스루
 *  - open 제어 모드(open=false → 미마운트)
 *  - reduced-motion 폴백 경로가 matchMedia 없이도 안 깨짐
 */
beforeAll(() => {
  // jsdom 은 matchMedia 미구현 — Framer useReducedMotion 폴백 방어.
  if (!window.matchMedia) {
    // 테스트 전용 최소 스텁
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false
      },
    })
  }
})

describe('reveal primitives', () => {
  test('PanelReveal — children 렌더 + role 패스스루', () => {
    render(
      <PanelReveal role="dialog" origin="top right">
        <span>안녕</span>
      </PanelReveal>,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('안녕')).toBeTruthy()
  })

  test('PanelReveal — open=false 면 미마운트', () => {
    render(
      <PanelReveal open={false}>
        <span>숨김</span>
      </PanelReveal>,
    )
    expect(screen.queryByText('숨김')).toBeNull()
  })

  test('PanelReveal — orchestrateContent=false 면 content 래퍼 없이 children 직접', () => {
    render(
      <PanelReveal orchestrateContent={false}>
        <span>직접</span>
      </PanelReveal>,
    )
    expect(screen.getByText('직접')).toBeTruthy()
  })

  test('AxisExpand — axis x/y 모두 children 렌더', () => {
    render(
      <>
        <AxisExpand axis="x">
          <span>가로</span>
        </AxisExpand>
        <AxisExpand axis="y">
          <span>세로</span>
        </AxisExpand>
      </>,
    )
    expect(screen.getByText('가로')).toBeTruthy()
    expect(screen.getByText('세로')).toBeTruthy()
  })

  test('AxisExpand — open=false 면 미마운트', () => {
    render(
      <AxisExpand open={false}>
        <span>접힘</span>
      </AxisExpand>,
    )
    expect(screen.queryByText('접힘')).toBeNull()
  })

  test('ScaleReveal — children 렌더 + role 패스스루', () => {
    render(
      <ScaleReveal role="dialog">
        <span>모달</span>
      </ScaleReveal>,
    )
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('모달')).toBeTruthy()
  })
})
