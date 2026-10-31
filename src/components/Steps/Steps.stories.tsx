import { expect, fn, userEvent } from '@storybook/test'

import { Steps, type StepItem } from './Steps'
import anatomy from './Steps.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const sampleSteps: StepItem[] = [
  { id: 'plan', label: '플랜 선택', description: '사용량 산정' },
  { id: 'billing', label: '결제 정보', description: '카드 또는 송장' },
  { id: 'confirm', label: '확인', description: '최종 검토' },
]

const meta: Meta<typeof Steps> = {
  title: 'Components/L1/Steps',
  component: Steps,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    currentStep: { control: { type: 'number', min: 0, max: 2 } },
  },
  args: {
    steps: sampleSteps,
    currentStep: 1,
    orientation: 'horizontal',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof Steps>

export const Default: Story = {}

export const Vertical: Story = {
  args: { orientation: 'vertical' },
}

export const FirstStep: Story = {
  args: { currentStep: 0 },
}

export const Completed: Story = {
  args: { currentStep: 3 },
}

/**
 * Anatomy 검증 — step-trigger는 select-option, currentStep을 writes.
 * completed/current는 클릭 가능, upcoming은 disabled.
 */
export const NavigationContract: Story = {
  args: { steps: sampleSteps, currentStep: 1, onStepChange: fn() },
  play: async ({ canvasElement, args }) => {
    const items = canvasElement.querySelectorAll('[data-slot="step-item"]')

    await expect(items[0]).toHaveAttribute('data-status', 'completed')
    await expect(items[1]).toHaveAttribute('data-status', 'current')
    await expect(items[2]).toHaveAttribute('data-status', 'upcoming')

    // current step 버튼은 aria-current="step"
    const triggers = canvasElement.querySelectorAll('[data-slot="steps-indicator"]')
    await expect(triggers[1]).toHaveAttribute('aria-current', 'step')

    // completed step 클릭 시 onStepChange가 0으로 호출
    await userEvent.click(triggers[0])
    await expect(args.onStepChange).toHaveBeenCalledWith(0)

    // upcoming step은 disabled
    await expect(triggers[2]).toBeDisabled()
  },
}

/**
 * 키보드 접근성: Tab으로 completed step에 포커스 후 Enter → onStepChange 호출.
 */
export const KeyboardAccessibility: Story = {
  args: { steps: sampleSteps, currentStep: 2, onStepChange: fn() },
  play: async ({ canvasElement, args }) => {
    const triggers = canvasElement.querySelectorAll<HTMLButtonElement>(
      '[data-slot="steps-indicator"]',
    )
    // currentStep=2: step 0, 1 이 completed, step 2 is current
    // completed step 0에 포커스
    triggers[0].focus()
    await expect(document.activeElement).toBe(triggers[0])

    // Enter → onStepChange(0)
    await userEvent.keyboard('{Enter}')
    await expect(args.onStepChange).toHaveBeenCalledWith(0)
  },
}

/** 글자 브레드크럼 — 콘텐츠 위에 얹는 얇은 위치 표시. 학습 화면의 "영상 시청 › 문제 풀기 › 이수 완료". */
export const TextAppearance: Story = {
  args: {
    appearance: 'text',
    currentStep: 1,
    steps: [
      { id: 'watch', label: '영상 시청' },
      { id: 'quiz', label: '문제 풀기' },
      { id: 'done', label: '이수 완료' },
    ],
  },
}
/** 표시 전용 — onStepChange 가 없으면 완료 단계도 클릭되지 않는다(모든 indicator 가 disabled). */
export const Disabled: Story = {
  args: { currentStep: 1, onStepChange: undefined },
  play: async ({ canvasElement }) => {
    const triggers = canvasElement.querySelectorAll<HTMLButtonElement>(
      '[data-slot="steps-indicator"]',
    )
    await expect(triggers.length).toBe(sampleSteps.length)
    for (const trigger of triggers) {
      await expect(trigger).toBeDisabled()
    }
  },
}

const manySteps: StepItem[] = [
  { id: 'inquiry', label: '접수', description: '고객 문의 접수 및 기본 정보 확인' },
  {
    id: 'assign',
    label: '플래너 배정',
    description: '지역·일정 기준 자동 배정, 필요 시 수동 조정',
  },
  { id: 'visit', label: '방문상담', description: '현장 방문 후 짐량·특이사항 기록' },
  { id: 'quote', label: '견적 발송', description: '3개 업체 견적을 고객에게 카카오톡으로 발송' },
  { id: 'select', label: '업체 선택', description: '고객이 견적을 비교하고 업체를 고른다' },
  { id: 'contract', label: '계약', description: '계약금 입금 확인 및 이사 일정 확정' },
  { id: 'moving', label: '이사 당일', description: '작업 시작·완료 보고' },
  { id: 'review', label: '후기', description: '서비스 평가 및 후속 상담' },
]

/**
 * 단계가 많고 설명이 길면 세로로 쌓는다 — 가로 배치는 라벨이 서로 밀려 읽히지 않는다.
 * 세로에서는 라벨·설명이 자연스럽게 줄바꿈된다.
 */
export const ManySteps: Story = {
  args: { steps: manySteps, currentStep: 3, orientation: 'vertical' },
  render: (args) => (
    <div className="w-80">
      <Steps {...args} />
    </div>
  ),
}
