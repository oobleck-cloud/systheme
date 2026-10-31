import { fn } from '@storybook/test'

import { AdvancedFilterPanel, DEFAULT_OPERATOR_OPTIONS } from './AdvancedFilterPanel'
import anatomy from './AdvancedFilterPanel.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof AdvancedFilterPanel> = {
  title: 'Components/L3/AdvancedFilterPanel',
  component: AdvancedFilterPanel,
  tags: ['autodocs'],
  args: {
    fields: ['상태', '담당자', '우선순위', '생성일'],
    operatorOptions: DEFAULT_OPERATOR_OPTIONS,
    onSubmit: fn(),
    onReset: fn(),
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof AdvancedFilterPanel>

/** prop 없이도 내부 state로 완전히 동작하는 기본 상태 */
export const Default: Story = {
  args: {
    fields: undefined,
    operatorOptions: undefined,
    onSubmit: fn(),
    onReset: fn(),
  },
}

/** fields prop으로 필드 목록 주입 */
export const WithFields: Story = {}

/** operators 문자열 배열로 연산자 목록 커스터마이징 */
export const WithCustomOperators: Story = {
  args: {
    operators: ['같음', '포함', '비어있음'],
    operatorOptions: undefined,
  },
}

/** fieldOptions로 고급 SelectOption 배열 사용 */
export const WithFieldOptions: Story = {
  args: {
    fields: undefined,
    fieldOptions: [
      { value: 'status', label: '상태' },
      { value: 'owner', label: '담당자' },
      { value: 'priority', label: '우선순위' },
      { value: 'created_at', label: '생성일' },
    ],
  },
}

/** errorMessage 표시 */
export const WithError: Story = {
  args: {
    errorMessage: '최소 하나의 조건에 값을 입력해야 합니다.',
  },
}

/** 적용 버튼 → onSubmit(filterGroup) 콜백 확인 */
export const AnatomyFooterActions: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    'logic-toolbar': { skip: true },
    'logic-toggle': { skip: true },
    'logic-hint': { skip: true },
    conditions: { skip: true },
    'condition-row': { skip: true },
    field: { skip: true },
    operator: { skip: true },
    value: { skip: true },
    'remove-condition': { skip: true },
    'add-condition': { skip: true },
    footer: { skip: true },
    reset: { onPress: 'onReset' },
    submit: { onPress: 'onSubmit' },
    error: { skip: true },
  }),
}

/** value Input 입력 동작 확인 (내부 state로 값 변경) */
export const AnatomyConditionValueInput: Story = {
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    'logic-toolbar': { skip: true },
    'logic-toggle': { skip: true },
    'logic-hint': { skip: true },
    conditions: { skip: true },
    'condition-row': { skip: true },
    field: { skip: true },
    operator: { skip: true },
    value: { skip: true },
    'remove-condition': { skip: true },
    'add-condition': { skip: true },
    footer: { skip: true },
    reset: { skip: true },
    submit: { skip: true },
    error: { skip: true },
  }),
}
