/**
 * ButtonGroup — 연결부 라운드 처리
 *
 * Test cases:
 * A. gap=0 (붙음): 세그먼트 라운드 — 첫 아이템 rounded-s-md + rounded-e-none, 끝 아이템 반대
 * B. gap>0 (떨어짐): 세그먼트 라운드를 입히지 않는다 — 아이템 자체 라운드(rounded-full 등) 유지
 * C. connected: 세그먼트 라운드 적용 (ConnectedBox 모드)
 */

import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from './Button'
import { ButtonGroup } from './ButtonGroup'

function itemClassNames(container: HTMLElement): string[] {
  return [...container.querySelectorAll('button')].map((b) => b.className)
}

describe('ButtonGroup 연결부 라운드', () => {
  it('gap=0 이면 세그먼트 라운드를 입힌다', () => {
    const { container } = render(
      <ButtonGroup gap={0}>
        <Button>하나</Button>
        <Button>둘</Button>
      </ButtonGroup>,
    )
    const [first, last] = itemClassNames(container)
    expect(first).toContain('rounded-s-md')
    expect(first).toContain('rounded-e-none')
    expect(last).toContain('rounded-e-md')
    expect(last).toContain('rounded-s-none')
  })

  it('gap>0 이면 아이템 자체 라운드를 존중한다', () => {
    const { container } = render(
      <ButtonGroup gap={2}>
        <Button className="rounded-full">하나</Button>
        <Button className="rounded-md">둘</Button>
      </ButtonGroup>,
    )
    const [first, last] = itemClassNames(container)
    expect(first).toContain('rounded-full')
    expect(first).not.toContain('rounded-e-none')
    expect(last).toContain('rounded-md')
    expect(last).not.toContain('rounded-s-none')
  })

  it('connected 면 세그먼트 라운드를 입힌다', () => {
    const { container } = render(
      <ButtonGroup connected>
        <Button>하나</Button>
        <Button>둘</Button>
      </ButtonGroup>,
    )
    const [first, last] = itemClassNames(container)
    expect(first).toContain('rounded-s-md')
    expect(last).toContain('rounded-e-md')
  })
})
