import { expect, fn, userEvent, within } from '@storybook/test'
import { useMemo, useState } from 'react'

import { SearchFieldAutocomplete } from './SearchFieldAutocomplete'
import anatomy from './SearchFieldAutocomplete.anatomy.json'

import type { SearchFieldAutocompleteOption } from './SearchFieldAutocomplete'
import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const SAMPLE: SearchFieldAutocompleteOption[] = [
  { id: '1', label: 'Alpha District Block A', description: 'Region A' },
  { id: '2', label: 'Beta District Block B', description: 'Region B' },
  { id: '3', label: 'Gamma District Block C', description: 'Region C' },
]

const meta: Meta<typeof SearchFieldAutocomplete> = {
  title: 'Components/L1/SearchFieldAutocomplete',
  component: SearchFieldAutocomplete,
  tags: ['autodocs'],
  args: {
    placeholder: 'Search by name or code',
    submitLayout: 'connected',
    minQueryLength: 2,
    onOptionSelect: fn(),
    onSubmit: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof SearchFieldAutocomplete>

export const Default: Story = {
  render: (args) => {
    const [q, setQ] = useState('')
    const options = useMemo(() => {
      const n = q.trim().toLowerCase()
      if (n.length < 2) return []
      return SAMPLE.filter(
        (o) =>
          o.label.toLowerCase().includes(n) || (o.description?.toLowerCase() ?? '').includes(n),
      )
    }, [q])

    return (
      <div className="w-full max-w-xl">
        <SearchFieldAutocomplete
          {...args}
          value={q}
          onValueChange={setQ}
          options={options}
          submit={
            <Button type="button" size="md" density="compact" variant="primary">
              Search
            </Button>
          }
        />
      </div>
    )
  },
}

export const KeyboardSelect: Story = {
  render: (args) => {
    const [q, setQ] = useState('Al')
    return (
      <SearchFieldAutocomplete
        {...args}
        value={q}
        onValueChange={setQ}
        options={SAMPLE}
        defaultOpen
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('combobox')
    await userEvent.click(input)
    await expect(canvas.getByRole('listbox')).toBeVisible()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await expect(args.onOptionSelect).toHaveBeenCalled()
  },
}
