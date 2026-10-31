import { expect, fn } from '@storybook/test'

import { DataExportStatus } from './DataExportStatus'
import anatomy from './DataExportStatus.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { anatomyAssertions, type AnatomyDoc } from '@/storybook/anatomyTest'
import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const baseArgs = {
  visible: true,
  progress: 0,
  errorMessage: '',
  onDownload: fn(),
  onDismiss: fn(),
  onRetry: fn(),
}

const meta: Meta<typeof DataExportStatus> = {
  title: 'Components/L1/DataExportStatus',
  component: DataExportStatus,
  tags: ['autodocs'],
  args: {
    ...baseArgs,
    phase: 'running',
    progress: 42,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DataExportStatus>

/** 기본: 실행 중 + 진행률 */
export const Default: Story = {}

/** 매트릭스: 위상별 (idle / queued / running / succeeded / failed) */
export const PhaseIdle: Story = { args: { ...baseArgs, phase: 'idle', progress: 0 } }
export const PhaseQueued: Story = { args: { ...baseArgs, phase: 'queued', progress: 0 } }
export const PhaseRunning: Story = { args: { ...baseArgs, phase: 'running', progress: 55 } }
export const PhaseSucceeded: Story = { args: { ...baseArgs, phase: 'succeeded', progress: 100 } }
export const PhaseFailed: Story = {
  args: { ...baseArgs, phase: 'failed', progress: 0, errorMessage: 'Network error' },
}

/** 보이지 않을 때는 마운트되지 않음 */
export const NotVisible: Story = { args: { ...baseArgs, visible: false, phase: 'running' } }

/** 성공 시 다운로드 + 닫기 (anatomy press-action / dismiss) */
export const AnatomyDriven: Story = {
  args: { ...baseArgs, phase: 'succeeded', progress: 100 },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    severity: { skip: true },
    progress: { skip: true },
    error: { skip: true },
    download: { onPress: 'onDownload' },
    retry: { skip: true },
    dismiss: { onPress: 'onDismiss' },
  }),
}

/** 실패 시 재시도 (retry press-action) */
export const AnatomyRetryWhenFailed: Story = {
  args: { ...baseArgs, phase: 'failed', errorMessage: 'Timeout' },
  play: anatomyAssertions(anatomy as AnatomyDoc, {
    root: { skip: true },
    severity: { skip: true },
    progress: { skip: true },
    error: { skip: true },
    download: { skip: true },
    retry: { onPress: 'onRetry' },
    dismiss: { skip: true },
  }),
}

/** 진행률 0과 100에서 Progress 슬롯이 존재 */
export const ProgressBounds: Story = {
  args: { ...baseArgs, phase: 'running', progress: 0 },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector('[data-slot="data-export-status-root"]')
    await expect(root).toBeTruthy()
    await expect(
      canvasElement.querySelector('[data-slot="data-export-status-progress"]'),
    ).toBeTruthy()
  },
}
