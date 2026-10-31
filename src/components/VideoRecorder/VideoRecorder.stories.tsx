import { VideoRecorder } from './VideoRecorder'
import anatomy from './VideoRecorder.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof VideoRecorder> = {
  title: 'Components/L3/VideoRecorder',
  component: VideoRecorder,
  tags: ['autodocs'],
  args: {
    autoRequestPermission: false,
    preferUltraWide: false,
    defaultFacingMode: 'environment',
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof VideoRecorder>

/**
 * 카메라 권한을 요청하지 않은 초기 상태.
 * 뷰파인더에 "카메라 시작" 버튼이 표시됩니다.
 */
export const Default: Story = {
  args: {
    autoRequestPermission: false,
  },
}

/**
 * autoRequestPermission=true — 마운트 시 권한 자동 요청.
 * 브라우저 권한 허용 후 카메라 피드가 보입니다.
 */
export const AutoRequest: Story = {
  args: {
    autoRequestPermission: true,
  },
}

/**
 * 9:16 세로 비율로 고정된 뷰파인더.
 */
export const PortraitAspect: Story = {
  args: {
    autoRequestPermission: true,
    aspectRatio: 9 / 16,
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
}

/**
 * 업로드 진행 중 상태 — "사용" 버튼이 "처리 중…"으로 바뀝니다.
 */
export const Uploading: Story = {
  args: {
    autoRequestPermission: true,
    isUploading: true,
  },
}
