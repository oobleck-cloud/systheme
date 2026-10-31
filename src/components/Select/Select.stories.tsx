import { expect, fn, userEvent, waitFor, within } from '@storybook/test'
import { useState } from 'react'

import { Select } from './Select'
import anatomy from './Select.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
]

const meta: Meta<typeof Select> = {
  title: 'Components/L1/Select',
  component: Select,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select options={FRUITS} value={val} onChange={setVal} />
      </div>
    )
  },
}

export const Searchable: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select options={FRUITS} value={val} onChange={setVal} searchable />
      </div>
    )
  },
}

/** 속성 고르기처럼 선택지가 수십 개일 때 — 묶음 머리글 아래 모이고, 검색하면 hint 가 위치를 말한다. */
export const Grouped: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select
          searchable
          placeholder="+ 필터 추가"
          value={val}
          onChange={setVal}
          options={[
            { value: 'misoOrderId', label: '주문번호', group: '주문 › 기본 정보' },
            { value: 'status', label: '상태', group: '주문 › 기본 정보' },
            { value: 'moveDate', label: '이사 예정일', group: '주문 › 일정', keywords: ['이사일'] },
            { value: 'departure', label: '출발지', group: '주문 › 장소' },
            {
              value: 'contractPartnerScore',
              label: '평점',
              group: '견적 › 계약 파트너',
              hint: '견적 › 계약 파트너',
              keywords: ['별점'],
            },
            {
              value: 'quotedPartnerMaxScore',
              label: '최고 평점',
              group: '견적 › 견적 참여 파트너',
              hint: '견적 › 견적 참여 파트너',
            },
          ]}
        />
      </div>
    )
  },
}

export const WithValue: Story = {
  render: () => {
    const [val, setVal] = useState('banana')
    return (
      <div className="w-64">
        <Select options={FRUITS} value={val} onChange={setVal} />
      </div>
    )
  },
}

export const WithError: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select variant="error" options={FRUITS} value={val} onChange={setVal} />
      </div>
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64 space-y-3">
        <Select size="sm" options={FRUITS} value={val} onChange={setVal} placeholder="Small" />
        <Select size="md" options={FRUITS} value={val} onChange={setVal} placeholder="Medium" />
        <Select size="lg" options={FRUITS} value={val} onChange={setVal} placeholder="Large" />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="w-64">
      <Select disabled options={FRUITS} placeholder="Disabled" />
    </div>
  ),
}

/**
 * trigger(disclosure) 클릭 → listbox 노출 + aria-expanded 동기화.
 */
export const OpensOnTriggerClick: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select options={FRUITS} value={val} onChange={setVal} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const combobox = canvas.getByRole('combobox')

    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByRole('listbox')).toBeNull()

    await userEvent.click(combobox)
    await expect(combobox).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getByRole('listbox')).toBeVisible()

    // 다시 클릭 → 닫힌다
    await userEvent.click(combobox)
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await waitFor(() => {
      if (canvasElement.querySelector('[role="listbox"]')) throw new Error('listbox가 아직 있음')
    })
  },
}

/**
 * option 클릭 → onChange(value) 호출 + listbox 닫힘.
 */
export const OptionSelectCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select
          {...args}
          options={FRUITS}
          value={val}
          onChange={(v) => {
            args.onChange?.(v)
            setVal(v)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(canvas.getByRole('listbox')).toBeVisible()

    const options = canvas.getAllByRole('option')
    await userEvent.click(options[0])

    await expect(args.onChange).toHaveBeenCalledWith('apple')
    await waitFor(() => {
      if (canvasElement.querySelector('[role="listbox"]')) throw new Error('listbox가 닫히지 않음')
    })
  },
}

/**
 * Escape 키 → listbox 닫힘.
 */
export const EscapeCloses: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select options={FRUITS} value={val} onChange={setVal} />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(canvas.getByRole('listbox')).toBeVisible()

    await userEvent.keyboard('{Escape}')
    await waitFor(() => {
      if (canvasElement.querySelector('[role="listbox"]'))
        throw new Error('Escape 후에도 열려 있음')
    })
  },
}

/**
 * ArrowDown → 리스트 열림 + 첫 항목 하이라이트. Enter → onChange 호출.
 */
export const KeyboardNavigation: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select
          {...args}
          options={FRUITS}
          value={val}
          onChange={(v) => {
            args.onChange?.(v)
            setVal(v)
          }}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const combobox = canvas.getByRole('combobox')

    // ArrowDown → 열린다
    await userEvent.click(combobox)
    await expect(canvas.getByRole('listbox')).toBeVisible()

    // ArrowDown 2회 → focusedIndex=1(banana), Enter → select
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{ArrowDown}')
    await userEvent.keyboard('{Enter}')

    await expect(args.onChange).toHaveBeenCalledWith('banana')
  },
}

/**
 * searchable=true: 입력 → 옵션 필터링.
 */
export const SearchFilters: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="w-64">
        <Select options={FRUITS} value={val} onChange={setVal} searchable />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(canvas.getByRole('listbox')).toBeVisible()

    const searchInput = canvas.getByRole('textbox', { name: /search/i })
    await userEvent.type(searchInput, 'ch')

    // "cherry"만 남아야 함 (case-insensitive)
    const options = canvas.getAllByRole('option')
    const visibleLabels = options.map((el) => el.textContent?.trim())
    await expect(visibleLabels).toContain('Cherry')
    await expect(options.length).toBeLessThan(FRUITS.length)
  },
}

export const Density: Story = {
  render: () => {
    const [a, setA] = useState<string | undefined>(undefined)
    const [b, setB] = useState<string | undefined>(undefined)
    const [c, setC] = useState<string | undefined>(undefined)
    return (
      <div className="flex flex-wrap gap-8">
        <div className="w-56 space-y-1">
          <p className="text-xs text-fg-muted">compact</p>
          <Select
            options={FRUITS}
            value={a}
            onChange={setA}
            density="compact"
            placeholder="Open list"
          />
        </div>
        <div className="w-56 space-y-1">
          <p className="text-xs text-fg-muted">default</p>
          <Select
            options={FRUITS}
            value={b}
            onChange={setB}
            density="default"
            placeholder="Open list"
          />
        </div>
        <div className="w-56 space-y-1">
          <p className="text-xs text-fg-muted">loose</p>
          <Select
            options={FRUITS}
            value={c}
            onChange={setC}
            density="loose"
            placeholder="Open list"
          />
        </div>
      </div>
    )
  },
}

/**
 * 패널은 `document.body`로 포털되므로 `overflow-hidden` 조상이 잘라내지 못한다.
 * (예전에는 트리거 아래로 펼쳐진 리스트가 박스 경계에서 잘렸다.)
 */
export const EscapesOverflowClip: Story = {
  render: () => {
    const [val, setVal] = useState<string | undefined>(undefined)
    return (
      <div className="h-36 w-72 overflow-hidden rounded-lg border border-border bg-surface p-4">
        <p className="mb-2 text-sm text-fg-muted">overflow-hidden 박스</p>
        <Select options={FRUITS} value={val} onChange={setVal} placeholder="역할 선택" />
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    // 리스트가 잘리지 않고 박스 밖으로 펼쳐진다
    await expect(canvas.getByRole('listbox')).toBeVisible()
    const options = canvas.getAllByRole('option')
    await expect(options.length).toBe(FRUITS.length)
  },
}

/** 옵션이 없을 때 — 리스트는 열리고 '옵션 없음' 한 줄이 보인다. 트리거는 비활성이 아니다. */
export const Empty: Story = {
  render: () => (
    <div className="w-64">
      <Select options={[]} placeholder="담당 플래너 선택" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(canvas.getByRole('listbox')).toBeVisible()
    await expect(canvas.getByRole('option', { name: '옵션 없음' })).toBeVisible()
  },
}
