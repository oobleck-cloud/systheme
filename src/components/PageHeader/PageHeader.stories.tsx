import { Badge } from '../Badge'
import { Button } from '../Button/Button'
import { SegmentedControl } from '../SegmentedControl'

import { PageHeader } from './PageHeader'
import anatomy from './PageHeader.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof PageHeader> = {
  title: 'Components/L1/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {
  args: {
    eyebrow: '조직',
    title: '운영 일정',
    actions: (
      <Button type="button" size="sm" variant="outline">
        오늘
      </Button>
    ),
  },
}

export const WithDescription: Story = {
  args: {
    eyebrow: '플래너',
    title: '플래너 목록',
    description: '활성 플래너 24명',
    actions: (
      <Button type="button" size="sm">
        플래너 등록
      </Button>
    ),
  },
}

export const DetailIdentity: Story = {
  args: {
    eyebrow: '플래너',
    title: '이영준',
    leading: (
      <span className="flex size-12 items-center justify-center rounded-full bg-surface text-lg font-semibold">
        준
      </span>
    ),
    titleAddon: (
      <>
        <Badge size="sm" variant="success">
          활성
        </Badge>
        <Badge size="sm">정규직</Badge>
      </>
    ),
    description: '서울 강동 · 송파',
  },
}

export const WithSubbar: Story = {
  args: {
    eyebrow: '조직',
    title: '멤버 관리',
    children: (
      <SegmentedControl
        size="sm"
        aria-label="멤버 관리 하위 화면"
        value="members"
        items={[
          { value: 'members', label: '멤버 목록' },
          { value: 'invitations', label: '초대 관리' },
        ]}
      />
    ),
  },
}
