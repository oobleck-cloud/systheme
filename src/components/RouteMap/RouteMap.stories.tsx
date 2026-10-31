import { RouteMap } from './RouteMap'
import anatomy from './RouteMap.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof RouteMap> = {
  title: 'Components/L2/RouteMap',
  component: RouteMap,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="h-64 w-full rounded-lg border border-border bg-surface">
        <Story />
      </div>
    ),
  ],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof RouteMap>

const seoulOrigin = {
  lat: 37.5796,
  lng: 126.9768,
  address: '서울 종로구 삼청동',
}
const seoulDestination = {
  lat: 37.496,
  lng: 127.0276,
  address: '서울 강남구 삼성동',
}

/**
 * SDK를 주입하지 않은 기본 쉘 상태.
 * 실제 배포 환경에서는 `onMount` 에서 카카오맵/네이버지도 등을 초기화한다.
 */
export const Shell: Story = {
  name: '쉘 (SDK 미주입)',
  args: {
    origin: seoulOrigin,
    destination: seoulDestination,
    distance: '32 km',
  },
  render: (args) => <RouteMap {...args} className="h-full w-full" />,
}

export const WithDistance: Story = {
  name: '거리 배지 표시',
  args: {
    origin: seoulOrigin,
    destination: seoulDestination,
    distance: '15.3 km',
  },
  render: (args) => <RouteMap {...args} className="h-full w-full" />,
}

export const NoDistance: Story = {
  name: '거리 배지 없음',
  args: {
    origin: seoulOrigin,
    destination: seoulDestination,
  },
  render: (args) => <RouteMap {...args} className="h-full w-full" />,
}
