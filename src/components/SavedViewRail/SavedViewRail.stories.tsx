import { expect, fn, userEvent, within } from '@storybook/test'

import { SavedViewRail } from './SavedViewRail'
import anatomy from './SavedViewRail.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof SavedViewRail> = {
  title: 'Components/L2/SavedViewRail',
  component: SavedViewRail,
  tags: ['autodocs'],
  args: {
    views: [
      { id: '1', name: 'Open deals' },
      { id: '2', name: 'My pipeline' },
    ],
    defaultSelectedViewId: '1',
    onSelectView: fn(),
    onSaveView: fn(),
    onDeleteView: fn(),
    onDuplicateView: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof SavedViewRail>

export const Default: Story = {}

export const SecondViewSelected: Story = {
  args: { defaultSelectedViewId: '2' },
}

/** 편집 모달 열기 흐름: 버튼 클릭 → 이름 자동 완성 확인 */
export const EditorOpenFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('이름 편집'))
    await expect(canvas.getByRole('dialog')).toBeVisible()
    await expect(canvas.getByLabelText('뷰 이름')).toHaveValue('Open deals')
  },
}

/** 이름 수정 후 저장 → onSaveView(name, viewId) 호출 확인 */
export const AnatomyEditorFlow: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('이름 편집'))

    const input = canvas.getByLabelText('뷰 이름')
    await userEvent.clear(input)
    await userEvent.type(input, 'Renamed')

    await userEvent.click(canvas.getByText('저장'))
    await expect(args.onSaveView).toHaveBeenCalledWith('Renamed', '1')
  },
}

/** 삭제·복제 → onDeleteView/onDuplicateView(viewId) 확인 */
export const AnatomyEditorDestructive: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByText('이름 편집'))

    await userEvent.click(canvas.getByText('삭제'))
    await expect(args.onDeleteView).toHaveBeenCalledWith('1')

    // 편집기가 자동 닫혔으므로 다시 열기
    await userEvent.click(canvas.getByText('이름 편집'))
    await userEvent.click(canvas.getByText('복제'))
    await expect(args.onDuplicateView).toHaveBeenCalledWith('1')
  },
}

/** 뷰 행 클릭 → onSelectView, 편집기 열기 버튼 클릭 */
export const AnatomyViewRowAndOpenEditor: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const rows = canvasElement.querySelectorAll('[data-slot="saved-view-rail-view-row"]')

    await userEvent.click(rows[0] as HTMLElement)
    await expect(args.onSelectView).toHaveBeenCalledWith('1')

    await userEvent.click(canvas.getByText('이름 편집'))
    await expect(canvas.getByRole('dialog')).toBeVisible()
  },
}
