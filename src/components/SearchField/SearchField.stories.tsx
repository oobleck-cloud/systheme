import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { SearchField } from './SearchField'
import anatomy from './SearchField.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { Search, createIconElement } from '@/icons'
import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const SearchGlyph = () => createIconElement(Search, 'md')

const connectedSubmitButton = (label: string, onPress: () => void) => (
  <Button type="button" size="md" density="compact" variant="primary" onClick={onPress}>
    {label}
  </Button>
)

const meta: Meta<typeof SearchField> = {
  title: 'Components/L1/SearchField',
  component: SearchField,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
    submitLayout: { control: 'select', options: ['inline', 'connected'] },
    endShape: { control: 'select', options: ['none', 'md', 'full'] },
  },
  args: {
    placeholder: 'Search…',
    size: 'md',
    density: 'default',
    submitLayout: 'inline',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof SearchField>

export const Default: Story = {
  render: (args) => {
    const [q, setQ] = useState('')
    return (
      <SearchField
        {...args}
        value={q}
        onValueChange={setQ}
        leadingIcon={<SearchGlyph />}
        clear={
          q ? (
            <IconButton
              type="button"
              variant="ghost"
              size="sm"
              shape="rounded"
              aria-label="Clear search"
              onClick={() => setQ('')}
            >
              <span className="text-lg leading-none">×</span>
            </IconButton>
          ) : null
        }
        submit={
          <Button
            type="button"
            size="sm"
            density="compact"
            variant="primary"
            onClick={() => alert(`Search: ${q}`)}
          >
            Go
          </Button>
        }
      />
    )
  },
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex w-full max-w-md flex-col gap-4">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <SearchField
          key={size}
          {...args}
          size={size}
          placeholder={`Size: ${size}`}
          leadingIcon={<SearchGlyph />}
        />
      ))}
    </div>
  ),
}

export const Densities: Story = {
  args: { size: 'md', submitLayout: 'connected' },
  render: (args) => (
    <div className="flex w-full max-w-lg flex-col gap-4">
      {(['compact', 'default', 'loose'] as const).map((density) => (
        <SearchField
          key={density}
          {...args}
          density={density}
          placeholder={`Density: ${density}`}
          submit={connectedSubmitButton('검색', () => undefined)}
        />
      ))}
    </div>
  ),
}

export const SubmitLayouts: Story = {
  name: 'Submit layouts',
  render: (args) => {
    const [inlineQ, setInlineQ] = useState('')
    const [connectedQ, setConnectedQ] = useState('')
    return (
      <div className="flex w-full max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">inline — submit in trailing group</p>
          <SearchField
            {...args}
            submitLayout="inline"
            value={inlineQ}
            onValueChange={setInlineQ}
            leadingIcon={<SearchGlyph />}
            submit={
              <Button type="button" size="sm" variant="primary" density="compact">
                Go
              </Button>
            }
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-fg-muted">connected — ButtonGroup segment + submit</p>
          <SearchField
            {...args}
            submitLayout="connected"
            density="compact"
            value={connectedQ}
            onValueChange={setConnectedQ}
            placeholder="주문번호, 전화번호, 주소로 검색"
            submit={connectedSubmitButton('검색', () => alert(`Search: ${connectedQ}`))}
          />
        </div>
      </div>
    )
  },
}

/** 주문 목록 툴바와 동일한 connected + compact 패턴 */
export const OrdersToolbarPattern: Story = {
  name: 'Orders toolbar pattern',
  args: {
    size: 'md',
    density: 'compact',
    submitLayout: 'connected',
    placeholder: '주문번호, 전화번호, 주소로 검색',
    onSubmit: fn(),
  },
  render: (args) => {
    const [q, setQ] = useState('')
    const onSubmit = args.onSubmit ?? fn()
    return (
      <SearchField
        {...args}
        className="min-w-0 flex-1"
        value={q}
        onValueChange={setQ}
        onSubmit={() => onSubmit()}
        submit={connectedSubmitButton('검색', () => onSubmit())}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('주문번호, 전화번호, 주소로 검색')
    await expect(input.closest('[data-slot="search-root"]')).toHaveAttribute(
      'data-submit-layout',
      'connected',
    )
    await expect(
      input.closest('[data-slot="search-root"]')?.querySelector('[data-slot="connected-box-root"]'),
    ).toBeTruthy()
    await userEvent.type(input, 'order-1{Enter}')
    await expect(input).toHaveValue('order-1')
    await expect(args.onSubmit).toHaveBeenCalled()
  },
}

export const ConnectedSubmit: Story = {
  name: 'Connected submit',
  render: (args) => {
    const [q, setQ] = useState('')
    return (
      <SearchField
        {...args}
        value={q}
        onValueChange={setQ}
        submitLayout="connected"
        density="compact"
        placeholder="주문번호, 전화번호, 주소로 검색"
        submit={connectedSubmitButton('검색', () => alert(`Search: ${q}`))}
      />
    )
  },
}

/**
 * Anatomy 검증 — input은 search-input intent. type="search"이며 입력 시
 * onValueChange가 호출되어야 함.
 */
export const SearchInputContract: Story = {
  args: { onValueChange: fn(), placeholder: 'q' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText('q') as HTMLInputElement
    await expect(input.type).toBe('search')
    await userEvent.type(input, 'design')
    await expect(args.onValueChange).toHaveBeenCalled()
    await expect(input.value).toBe('design')
  },
}

export const AnatomyDrivenConnected: Story = {
  name: 'Anatomy driven (connected)',
  args: {
    submitLayout: 'connected',
    onValueChange: fn(),
    onSubmit: fn(),
    placeholder: 'anatomy',
    submit: connectedSubmitButton('검색', fn()),
  },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    'leading-icon': { skip: true },
    clear: { skip: true },
    submit: { onPress: 'onSubmit' },
  }),
}
