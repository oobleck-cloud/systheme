/**
 * ChoiceGroup — 선택 계약
 *
 * A. multiple: 누를 때마다 넣고 빼며, 값은 고른 순서가 아니라 options 순서로 돌려준다
 * B. single: radiogroup 이고 화살표 이동이 곧 선택이다
 * C. 탭 스톱은 하나(roving) — 고른 보기, 없으면 첫 보기
 * D. disabled 보기는 누를 수 없다
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ChoiceGroup, type ChoiceGroupProps } from './ChoiceGroup'

const days = ['월', '화', '수'].map((d) => ({ value: d, label: d }))

function Controlled(props: Partial<ChoiceGroupProps> & { initial?: string[] }) {
  const { initial = [], onValueChange, ...rest } = props
  const [value, setValue] = useState(initial)
  return (
    <ChoiceGroup
      aria-label="요일"
      options={days}
      {...rest}
      value={value}
      onValueChange={(v) => {
        setValue(v)
        onValueChange?.(v)
      }}
    />
  )
}

describe('ChoiceGroup', () => {
  it('multiple — 넣고 빼며 options 순서로 돌려준다', () => {
    const onValueChange = vi.fn()
    render(<Controlled initial={['수']} onValueChange={onValueChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: '월' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['월', '수'])
    expect(screen.getByRole('checkbox', { name: '월' })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('checkbox', { name: '수' }))
    expect(onValueChange).toHaveBeenLastCalledWith(['월'])
  })

  it('single — radiogroup, 화살표가 곧 선택', () => {
    const onValueChange = vi.fn()
    render(<Controlled selectionMode="single" initial={['월']} onValueChange={onValueChange} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
    const first = screen.getByRole('radio', { name: '월' })
    first.focus()
    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(onValueChange).toHaveBeenLastCalledWith(['화'])
    expect(screen.getByRole('radio', { name: '화' })).toHaveFocus()
    // 이미 고른 보기를 다시 눌러도 비우지 않는다
    fireEvent.click(screen.getByRole('radio', { name: '화' }))
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  it('탭 스톱은 고른 보기 하나', () => {
    render(<Controlled initial={['화']} />)
    const tabbable = screen.getAllByRole('checkbox').filter((b) => b.tabIndex === 0)
    expect(tabbable.map((b) => b.textContent)).toEqual(['화'])
  })

  it('disabled 보기는 누를 수 없다', () => {
    const onValueChange = vi.fn()
    render(
      <ChoiceGroup
        aria-label="요일"
        options={[...days, { value: '목', label: '목', disabled: true }]}
        value={[]}
        onValueChange={onValueChange}
      />,
    )
    fireEvent.click(screen.getByRole('checkbox', { name: '목' }))
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
