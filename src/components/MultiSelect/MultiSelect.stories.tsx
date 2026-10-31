import { expect, fn, userEvent, waitFor, within } from '@storybook/test'
import { useState } from 'react'

import { MultiSelect, type MultiSelectOption } from './MultiSelect'
import anatomy from './MultiSelect.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof MultiSelect> = {
  title: 'Components/L1/MultiSelect',
  component: MultiSelect,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    density: {
      control: 'select',
      options: ['compact', 'default', 'loose'],
    },
    disabled: { control: 'boolean' },
    searchable: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  args: {
    variant: 'default',
    size: 'md',
    density: 'default',
    disabled: false,
    searchable: true,
    placeholder: 'Select...',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MultiSelect>

const FRUIT_OPTIONS: MultiSelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
  { value: 'durian', label: 'Durian', disabled: true },
  { value: 'elderberry', label: 'Elderberry' },
  { value: 'fig', label: 'Fig' },
  { value: 'grape', label: 'Grape' },
]

export const Default: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="w-80 p-4">
        <MultiSelect {...args} options={FRUIT_OPTIONS} value={selected} onChange={setSelected} />
        <p className="mt-2 text-xs text-fg-muted">
          Selected: {selected.length > 0 ? selected.join(', ') : 'none'}
        </p>
      </div>
    )
  },
}

export const WithPreselected: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['apple', 'grape'])
    return (
      <div className="w-80 p-4">
        <MultiSelect {...args} options={FRUIT_OPTIONS} value={selected} onChange={setSelected} />
        <p className="mt-2 text-xs text-fg-muted">Selected: {selected.join(', ')}</p>
      </div>
    )
  },
}

export const WithError: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="w-80 p-4">
        <MultiSelect
          {...args}
          variant="error"
          options={FRUIT_OPTIONS}
          value={selected}
          onChange={setSelected}
        />
      </div>
    )
  },
}

export const NotSearchable: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="w-80 p-4">
        <MultiSelect
          {...args}
          searchable={false}
          options={FRUIT_OPTIONS}
          value={selected}
          onChange={setSelected}
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: (args) => (
    <div className="w-80 p-4">
      <MultiSelect {...args} disabled options={FRUIT_OPTIONS} value={['apple', 'banana']} />
    </div>
  ),
}

/**
 * trigger(disclosure) 클릭 → listbox 노출 + aria-expanded 동기화.
 */
export const OpensOnTriggerClick: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="w-80 p-4">
        <MultiSelect
          {...args}
          options={FRUIT_OPTIONS}
          value={selected}
          onChange={setSelected}
          searchable={false}
        />
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

    // 다시 클릭 → 닫힘
    await userEvent.click(combobox)
    await waitFor(() => {
      if (canvasElement.querySelector('[role="listbox"]')) throw new Error('닫히지 않음')
    })
  },
}

/**
 * 두 항목 선택 → onChange가 각각 배열로 호출된다.
 */
export const MultipleSelectionCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="w-80 p-4">
        <MultiSelect
          {...args}
          options={FRUIT_OPTIONS}
          value={selected}
          onChange={(v) => {
            args.onChange?.(v)
            setSelected(v)
          }}
          searchable={false}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox'))
    await expect(canvas.getByRole('listbox')).toBeVisible()

    const options = canvas.getAllByRole('option')
    // Apple 선택
    await userEvent.click(options[0])
    await expect(args.onChange).toHaveBeenLastCalledWith(['apple'])

    // Banana 선택 (listbox가 multiselect이므로 닫히지 않음)
    await userEvent.click(options[1])
    await expect(args.onChange).toHaveBeenLastCalledWith(['apple', 'banana'])
  },
}

/**
 * Tag 제거 버튼 클릭 → onChange가 해당 값 없이 호출된다.
 */
export const TagRemovalCallsOnChange: Story = {
  args: { onChange: fn() },
  render: (args) => {
    const [selected, setSelected] = useState<string[]>(['apple', 'banana'])
    return (
      <div className="w-80 p-4">
        <MultiSelect
          {...args}
          options={FRUIT_OPTIONS}
          value={selected}
          onChange={(v) => {
            args.onChange?.(v)
            setSelected(v)
          }}
          searchable={false}
        />
      </div>
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // 'Apple' 태그의 제거 버튼 클릭
    const removeBtn = canvas.getByRole('button', { name: 'Remove Apple' })
    await userEvent.click(removeBtn)
    await expect(args.onChange).toHaveBeenCalledWith(['banana'])
  },
}

/**
 * Escape 키 → listbox 닫힘.
 */
export const EscapeCloses: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <div className="w-80 p-4">
        <MultiSelect
          {...args}
          options={FRUIT_OPTIONS}
          value={selected}
          onChange={setSelected}
          searchable={false}
        />
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

export const Density: Story = {
  render: () => {
    const [a, setA] = useState<string[]>([])
    const [b, setB] = useState<string[]>([])
    const [c, setC] = useState<string[]>([])
    return (
      <div className="flex flex-wrap gap-8 p-4">
        <div className="w-72 space-y-1">
          <p className="text-xs text-fg-muted">compact</p>
          <MultiSelect
            options={FRUIT_OPTIONS}
            value={a}
            onChange={setA}
            density="compact"
            searchable={false}
          />
        </div>
        <div className="w-72 space-y-1">
          <p className="text-xs text-fg-muted">default</p>
          <MultiSelect
            options={FRUIT_OPTIONS}
            value={b}
            onChange={setB}
            density="default"
            searchable={false}
          />
        </div>
        <div className="w-72 space-y-1">
          <p className="text-xs text-fg-muted">loose</p>
          <MultiSelect
            options={FRUIT_OPTIONS}
            value={c}
            onChange={setC}
            density="loose"
            searchable={false}
          />
        </div>
      </div>
    )
  },
}
