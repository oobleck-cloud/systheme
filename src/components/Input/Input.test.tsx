/**
 * Input — 제어(value) 바인딩
 *
 * value 를 넘기면 DOM input 에 반영돼야 한다(프리필·프로그램 갱신). 과거 value 를
 * destructure 만 하고 DOM 에 안 넘겨 프리필이 안 되던 회귀를 막는다.
 */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from './Input'

describe('Input 제어 value', () => {
  it('value 를 넘기면 그 값이 프리필된다', () => {
    render(<Input value="운동기구" onValueChange={() => {}} aria-label="품목 이름" />)
    expect(screen.getByLabelText<HTMLInputElement>('품목 이름').value).toBe('운동기구')
  })

  it('value 갱신이 DOM 에 반영된다', () => {
    const { rerender } = render(<Input value="a" onValueChange={() => {}} aria-label="x" />)
    expect(screen.getByLabelText<HTMLInputElement>('x').value).toBe('a')
    rerender(<Input value="b" onValueChange={() => {}} aria-label="x" />)
    expect(screen.getByLabelText<HTMLInputElement>('x').value).toBe('b')
  })

  it('value 없이 defaultValue 만 주면 uncontrolled 로 동작한다', () => {
    render(<Input defaultValue="초기" aria-label="y" />)
    expect(screen.getByLabelText<HTMLInputElement>('y').value).toBe('초기')
  })
})
