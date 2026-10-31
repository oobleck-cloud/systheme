import { expect, fn, userEvent, within } from '@storybook/test'
import { useState } from 'react'

import { EditableTagField, type EditableTagFieldOption } from './EditableTagField'
import anatomy from './EditableTagField.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const ROLE_OPTIONS: EditableTagFieldOption[] = [
  { value: 'APPLICANT', label: '지원자' },
  { value: 'LEARNER', label: '학습자' },
  { value: 'OPERATOR', label: '운영자' },
  { value: 'ADMIN', label: '관리자' },
]

const meta: Meta<typeof EditableTagField> = {
  title: 'Components/L2/EditableTagField',
  component: EditableTagField,
  tags: ['autodocs'],
  argTypes: {
    tagVariant: {
      control: 'select',
      options: [
        'default',
        'primary',
        'success',
        'warning',
        'error',
        'info',
        'outline',
        'outline-primary',
      ],
    },
    tagSize: { control: 'select', options: ['sm', 'md'] },
    disabled: { control: 'boolean' },
    saving: { control: 'boolean' },
  },
  args: {
    options: ROLE_OPTIONS,
    value: ['ADMIN', 'OPERATOR'],
    onSave: fn(),
    tagVariant: 'primary',
    tagSize: 'sm',
    placeholder: '역할 선택',
    editLabel: '역할 수정',
    saveLabel: '역할 변경 저장',
    cancelLabel: '역할 변경 취소',
    disabled: false,
    saving: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof EditableTagField>

export const Default: Story = {}

export const Empty: Story = {
  args: {
    value: [],
  },
}

export const Interactive: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(['OPERATOR'])
    return (
      <EditableTagField
        {...args}
        value={value}
        onSave={async (next) => {
          await args.onSave?.(next)
          setValue(next)
        }}
      />
    )
  },
}

export const ControlledEditing: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(['ADMIN'])
    const [editing, setEditing] = useState(false)
    return (
      <EditableTagField
        {...args}
        value={value}
        editing={editing}
        onEditingChange={setEditing}
        onSave={async (next) => {
          await args.onSave?.(next)
          setValue(next)
        }}
      />
    )
  },
}

export const Saving: Story = {
  args: {
    saving: true,
  },
}

export const InTableCell: Story = {
  render: (args) => (
    <table className="w-full max-w-xl border-collapse text-sm">
      <thead>
        <tr className="border-b border-border text-left">
          <th className="px-3 py-2">이름</th>
          <th className="px-3 py-2">역할</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border">
          <td className="px-3 py-2">홍길동</td>
          <td className="px-3 py-2">
            <EditableTagField {...args} />
          </td>
        </tr>
      </tbody>
    </table>
  ),
}

export const EditDisclosure: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: args.editLabel }))
    await expect(canvas.getByRole('combobox')).toBeInTheDocument()
  },
}
