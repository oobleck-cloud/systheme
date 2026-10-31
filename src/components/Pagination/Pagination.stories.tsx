import { expect, fn, userEvent, within } from '@storybook/test'
import { useState, type ComponentProps } from 'react'

import { Pagination } from './Pagination'
import anatomy from './Pagination.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof Pagination> = {
  title: 'Components/L1/Pagination',
  component: Pagination,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Pagination>

function StatefulPagination(
  props: Omit<ComponentProps<typeof Pagination>, 'onPageChange' | 'page'>,
) {
  const [page, setPage] = useState(3)
  return <Pagination {...props} page={page} onPageChange={setPage} />
}

export const Default: Story = {
  render: () => <StatefulPagination totalPages={12} totalItems={240} siblingCount={1} />,
}

/** 페이지 번호 자릿수(1 vs 12)와 무관하게 동일한 버튼 너비 */
export const FixedPageControlWidth: Story = {
  render: () => (
    <Pagination
      page={1}
      totalPages={31}
      totalItems={620}
      siblingCount={1}
      onPageChange={() => {}}
    />
  ),
}

/**
 * prev/next stepper 클릭 → onPageChange(page±1).
 */
export const PrevNextCallsOnPageChange: Story = {
  args: { onPageChange: fn() },
  render: (args) => {
    const [page, setPage] = useState(5)
    return (
      <Pagination
        {...args}
        page={page}
        totalPages={10}
        totalItems={200}
        siblingCount={1}
        onPageChange={(p) => {
          args.onPageChange?.(p)
          setPage(p)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // 이전·다음은 **현재 양옆 번호**가 한다. 양 끝(«/»)은 처음·마지막으로 한 번에 간다.
    const first = canvas.getByRole('button', { name: '첫 페이지' })
    const last = canvas.getByRole('button', { name: '마지막 페이지' })

    await expect(first).not.toBeDisabled()
    await expect(last).not.toBeDisabled()

    await userEvent.click(canvas.getByRole('button', { name: '6' }))
    await expect(args.onPageChange).toHaveBeenCalledWith(6)

    await userEvent.click(last)
    await expect(args.onPageChange).toHaveBeenLastCalledWith(10)
  },
}

/**
 * page-control 버튼 클릭 → onPageChange(pageNumber).
 */
export const PageButtonCallsOnPageChange: Story = {
  args: { onPageChange: fn() },
  render: (args) => {
    const [page, setPage] = useState(1)
    return (
      <Pagination
        {...args}
        page={page}
        totalPages={5}
        siblingCount={2}
        onPageChange={(p) => {
          args.onPageChange?.(p)
          setPage(p)
        }}
      />
    )
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    // 페이지 버튼들 중 '3' 클릭
    const pageBtn3 = canvas.getByRole('button', { name: '3' })
    await userEvent.click(pageBtn3)
    await expect(args.onPageChange).toHaveBeenCalledWith(3)
    // aria-current="page" 가 3번 버튼에 설정됨
    await expect(pageBtn3).toHaveAttribute('aria-current', 'page')
  },
}

/**
 * 경계값: 첫 페이지 시 prev 비활성, 마지막 페이지 시 next 비활성.
 */
export const DisabledAtBoundaries: Story = {
  render: () => {
    const [page, setPage] = useState(1)
    return <Pagination page={page} totalPages={5} onPageChange={setPage} />
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // 첫 페이지: « 비활성
    await expect(canvas.getByRole('button', { name: '첫 페이지' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '마지막 페이지' })).not.toBeDisabled()

    // 마지막 페이지로 이동
    await userEvent.click(canvas.getByRole('button', { name: '5' }))
    await expect(canvas.getByRole('button', { name: '마지막 페이지' })).toBeDisabled()
    await expect(canvas.getByRole('button', { name: '첫 페이지' })).not.toBeDisabled()
  },
}
