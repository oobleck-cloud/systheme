'use client'

import { expect, userEvent, waitFor, within } from '@storybook/test'
import { useState } from 'react'

import { FloatingToolbar, Toolbar, ToolbarGroup, ToolbarItem } from './Toolbar'
import anatomy from './Toolbar.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const BoldIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M4 3h5a3 3 0 0 1 0 6H4V3z" />
    <path d="M4 9h5.5a3.5 3.5 0 0 1 0 7H4V9z" />
  </svg>
)

const ItalicIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <line x1="10" y1="3" x2="6" y2="13" />
    <line x1="7" y1="3" x2="13" y2="3" />
    <line x1="3" y1="13" x2="9" y2="13" />
  </svg>
)

const UnderlineIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M4 3v5a4 4 0 0 0 8 0V3" />
    <line x1="2" y1="14" x2="14" y2="14" />
  </svg>
)

const LinkIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M7 9a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-1 1" />
    <path d="M9 7a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" />
  </svg>
)

const PlusIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
)

const MoreIcon = () => (
  <svg
    className="h-4 w-4"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
  >
    <circle cx="4" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
  </svg>
)

const meta: Meta<typeof Toolbar> = {
  title: 'Components/L3/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  argTypes: {
    density: { control: 'select', options: ['compact', 'default', 'loose'] },
  },
  args: {
    density: 'default',
  },
}

mergeAnatomyMeta(meta, anatomy)

export default meta

type Story = StoryObj<typeof Toolbar>

export const Default: Story = {
  name: 'Default (Docked Toolbar)',
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-fg-muted">연관 액션을 하나의 Panel로 묶은 Docked Toolbar</p>
      <Toolbar>
        <ToolbarGroup connected endShape="full">
          <IconButton variant="ghost" size="sm" aria-label="굵게">
            <BoldIcon />
          </IconButton>
          <IconButton variant="ghost" size="sm" aria-label="기울임">
            <ItalicIcon />
          </IconButton>
          <IconButton variant="ghost" size="sm" aria-label="밑줄">
            <UnderlineIcon />
          </IconButton>
          <IconButton variant="ghost" size="sm" aria-label="링크">
            <LinkIcon />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>
    </div>
  ),
}

export const FloatingToolbarStory: Story = {
  name: 'FloatingToolbar',
  render: function Render() {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative flex min-h-64 flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-fg-muted">버튼을 눌러 Floating Toolbar를 열고 닫습니다.</p>
        <Button variant="outline" onClick={() => setVisible((v) => !v)}>
          {visible ? '닫기' : '열기'}
        </Button>
        <FloatingToolbar
          visible={visible}
          placement="bottom-center"
          onDismiss={() => setVisible(false)}
        >
          <ToolbarGroup connected endShape="full">
            <IconButton variant="ghost" size="sm" aria-label="굵게">
              <BoldIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="기울임">
              <ItalicIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="밑줄">
              <UnderlineIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="링크">
              <LinkIcon />
            </IconButton>
          </ToolbarGroup>
        </FloatingToolbar>
      </div>
    )
  },
}

export const WithDivider: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-sm text-fg-muted">Panel 분리로 그룹을 구분한 Toolbar</p>
      <Toolbar>
        <ToolbarGroup connected endShape="full">
          <IconButton variant="ghost" size="sm" aria-label="굵게">
            <BoldIcon />
          </IconButton>
          <IconButton variant="ghost" size="sm" aria-label="기울임">
            <ItalicIcon />
          </IconButton>
          <IconButton variant="ghost" size="sm" aria-label="밑줄">
            <UnderlineIcon />
          </IconButton>
        </ToolbarGroup>
        <ToolbarGroup connected endShape="md">
          <IconButton variant="ghost" size="sm" aria-label="링크">
            <LinkIcon />
          </IconButton>
          <Button variant="ghost" size="sm">
            댓글
          </Button>
        </ToolbarGroup>
      </Toolbar>
    </div>
  ),
}

export const MixedGroups: Story = {
  name: 'Mixed Groups (분리 Panel)',
  render: () => (
    <div className="flex flex-col gap-6 p-6">
      <p className="text-sm text-fg-muted">
        각 ToolbarItem / ToolbarGroup 이 독립 surface 1개 — padding·이중 Panel 없음
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-fg-subtle">Docked Toolbar</p>
        <Toolbar>
          <ToolbarItem shape="circle">
            <IconButton variant="ghost" size="sm" shape="circle" aria-label="추가">
              <PlusIcon />
            </IconButton>
          </ToolbarItem>
          <ToolbarGroup connected endShape="full">
            <IconButton variant="ghost" size="sm" aria-label="굵게">
              <BoldIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="기울임">
              <ItalicIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="밑줄">
              <UnderlineIcon />
            </IconButton>
          </ToolbarGroup>
          <ToolbarItem shape="circle">
            <IconButton variant="ghost" size="sm" shape="circle" aria-label="더보기">
              <MoreIcon />
            </IconButton>
          </ToolbarItem>
        </Toolbar>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-fg-subtle">텍스트 액션 그룹 + 단독 아이콘</p>
        <Toolbar>
          <ToolbarGroup connected endShape="md">
            <Button variant="ghost" size="sm">
              편집
            </Button>
            <Button variant="ghost" size="sm">
              복제
            </Button>
          </ToolbarGroup>
          <ToolbarItem shape="circle">
            <IconButton variant="ghost" size="sm" shape="circle" aria-label="더보기">
              <MoreIcon />
            </IconButton>
          </ToolbarItem>
        </Toolbar>
      </div>
    </div>
  ),
}

export const FloatingMixedGroups: Story = {
  name: 'Floating Mixed Groups',
  render: function Render() {
    const [visible, setVisible] = useState(false)
    return (
      <div className="relative flex min-h-64 flex-col items-center justify-center gap-4 p-6">
        <p className="text-sm text-fg-muted">Floating Toolbar — 분리 Panel 클러스터</p>
        <Button variant="outline" onClick={() => setVisible((v) => !v)}>
          {visible ? '닫기' : '열기'}
        </Button>
        <FloatingToolbar
          visible={visible}
          placement="bottom-center"
          onDismiss={() => setVisible(false)}
        >
          <ToolbarItem shape="circle">
            <IconButton variant="ghost" size="sm" shape="circle" aria-label="추가">
              <PlusIcon />
            </IconButton>
          </ToolbarItem>
          <ToolbarGroup connected endShape="full">
            <IconButton variant="ghost" size="sm" aria-label="굵기">
              <BoldIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="기울임">
              <ItalicIcon />
            </IconButton>
            <IconButton variant="ghost" size="sm" aria-label="밑줄">
              <UnderlineIcon />
            </IconButton>
          </ToolbarGroup>
        </FloatingToolbar>
      </div>
    )
  },
}

export const ContextualSelection: Story = {
  render: function Render() {
    const [selected, setSelected] = useState(false)
    return (
      <div className="relative flex min-h-64 flex-col items-start gap-4 p-6">
        <p className="text-sm text-fg-muted">체크박스를 선택하면 Floating Toolbar가 나타납니다.</p>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => setSelected(e.target.checked)}
          />
          항목 선택
        </label>
        <FloatingToolbar
          visible={selected}
          placement="bottom-center"
          onDismiss={() => setSelected(false)}
        >
          <ToolbarGroup connected endShape="md">
            <Button variant="ghost" size="sm">
              편집
            </Button>
            <Button variant="ghost" size="sm">
              복제
            </Button>
          </ToolbarGroup>
          <ToolbarItem shape="rounded" tone="destructive">
            <Button>삭제</Button>
          </ToolbarItem>
        </FloatingToolbar>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    const checkbox = canvas.getByRole('checkbox')
    expect(canvas.queryByRole('toolbar')).toBeNull()

    await userEvent.click(checkbox)
    await waitFor(() => {
      expect(canvas.getByRole('toolbar')).toBeVisible()
    })

    await userEvent.click(checkbox)
    await waitFor(
      () => {
        expect(canvas.queryByRole('toolbar')).toBeNull()
      },
      { timeout: 500 },
    )
  },
}

export const DensityMatrix: Story = {
  name: 'Density',
  render: () => (
    <div className="flex flex-col gap-8 p-6">
      <p className="text-sm text-fg-muted">
        compact(h-8) · default(h-11, 구 Panel+sm 외곽) · loose(h-12)
      </p>
      {(['compact', 'default', 'loose'] as const).map((density) => (
        <div key={density} className="flex flex-col gap-2">
          <p className="text-xs font-medium text-fg-subtle">{density}</p>
          <Toolbar density={density}>
            <ToolbarGroup connected endShape="md">
              <Button variant="ghost">편집</Button>
              <Button variant="ghost">복제</Button>
            </ToolbarGroup>
            <ToolbarItem shape="rounded" tone="destructive">
              <Button>삭제</Button>
            </ToolbarItem>
            <ToolbarItem shape="circle">
              <IconButton variant="ghost" aria-label="더보기">
                <MoreIcon />
              </IconButton>
            </ToolbarItem>
          </Toolbar>
        </div>
      ))}
    </div>
  ),
}
