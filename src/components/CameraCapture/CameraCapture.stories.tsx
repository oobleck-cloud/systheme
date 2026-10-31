import { CameraCapture } from './CameraCapture'
import anatomy from './CameraCapture.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof CameraCapture> = {
  title: 'Components/L3/CameraCapture',
  component: CameraCapture,
  tags: ['autodocs'],
  args: {
    autoRequestPermission: false,
    preferUltraWide: false,
    defaultFacingMode: 'environment',
    captureFormat: 'jpeg',
    captureQuality: 0.92,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof CameraCapture>

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
 * 캡처 결과를 콘솔에 출력합니다.
 * (실제 카메라 권한 허용 후 촬영 버튼 클릭)
 */
export const WithCaptureCallback: Story = {
  args: {
    autoRequestPermission: true,
    onCapture: (blob, mimeType) => {
      const url = URL.createObjectURL(blob)
      console.log('캡처 완료:', mimeType, url)
    },
  },
}

/**
 * PNG 포맷으로 캡처.
 */
export const PngFormat: Story = {
  args: {
    autoRequestPermission: true,
    captureFormat: 'png',
    captureQuality: 1,
  },
}
