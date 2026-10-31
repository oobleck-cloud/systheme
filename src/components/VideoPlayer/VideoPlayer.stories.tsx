import { VideoPlayer } from './VideoPlayer'
import anatomy from './VideoPlayer.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

/**
 * 테스트용 공개 MP4 영상 URL (Big Buck Bunny 클립).
 * Storybook에서 실제 재생을 확인할 수 있습니다.
 */
const SAMPLE_VIDEO_URL =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'

const meta: Meta<typeof VideoPlayer> = {
  title: 'Components/L3/VideoPlayer',
  component: VideoPlayer,
  tags: ['autodocs'],
  args: {
    autoPlay: false,
    loop: false,
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof VideoPlayer>

/**
 * src가 없는 빈 상태.
 */
export const Empty: Story = {
  args: {},
}

/**
 * 외부 URL 소스로 재생.
 * 재생 버튼(Switch)을 켜면 영상이 시작됩니다.
 */
export const WithSrc: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
  },
}

/**
 * autoPlay=true — 마운트 시 자동 재생.
 */
export const AutoPlay: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    autoPlay: true,
    loop: true,
  },
}

/**
 * 잘못된 URL — 오류 메시지를 표시합니다.
 */
export const BrokenSrc: Story = {
  args: {
    src: 'https://example.invalid/broken.mp4',
  },
}

/**
 * 카드 안에 끼워 넣는 세로 재생기 — Surface 껍데기 없이 뷰포트만(`frame="bare"`),
 * 컨트롤은 브라우저 기본(`controls="native"`)에 맡긴다. 상담 현장 촬영본이 이 조합을 쓴다.
 */
export const BarePortraitNative: Story = {
  args: {
    src: SAMPLE_VIDEO_URL,
    frame: 'bare',
    controls: 'native',
    aspect: 'portrait',
  },
  decorators: [
    (Story) => (
      <div className="w-44">
        <Story />
      </div>
    ),
  ],
}
