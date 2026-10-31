import { MARKER_ALPHA, MARKER_BETA, MARKER_DOT, MARKER_GAMMA } from './mapboxMap.fixtures'
import { MarkerSprite } from './MarkerSprite'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof MarkerSprite> = {
  title: 'Components/L2/MapboxMap/MarkerSprite',
  component: MarkerSprite,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="rounded-lg border border-border bg-muted p-8">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof MarkerSprite>

export const WithLabel: Story = {
  name: 'Label + badge',
  args: { marker: MARKER_ALPHA },
}

export const NumberedPin: Story = {
  name: 'Numbered pin',
  args: { marker: MARKER_BETA },
}

export const FractionBadge: Story = {
  name: 'Fraction badge (15½)',
  args: {
    marker: {
      ...MARKER_BETA,
      badge: '15½',
      label: 'Beta',
    },
  },
}

export const DotBadge: Story = {
  name: 'Dot badge (·)',
  args: { marker: MARKER_DOT },
}

export const CustomColor: Story = {
  name: 'Custom color',
  args: {
    marker: {
      ...MARKER_GAMMA,
      color: '#7C3AED',
      badge: '★',
      label: 'Highlight',
    },
  },
}

export const StationPins: Story = {
  name: 'Station pins (route line)',
  render: () => (
    <div className="flex flex-wrap items-center gap-6">
      {['1', '2', '15½'].map((badge) => (
        <MarkerSprite
          key={badge}
          marker={{ color: '#7F77DD', badge, variant: 'station', label: '김추영' }}
        />
      ))}
      <MarkerSprite marker={{ color: '#7F77DD', badge: '3', variant: 'station', active: true }} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`station` 은 꼬리가 없고 좌표가 원의 중심입니다. `label` 을 넘겨도 스프라이트에 굽지 않습니다 — 이름은 선 위에 반복 표기합니다.',
      },
    },
  },
}

export const AllVariants: Story = {
  name: 'Variant matrix',
  render: () => (
    <div className="flex flex-wrap items-end gap-6">
      <MarkerSprite marker={MARKER_ALPHA} />
      <MarkerSprite marker={MARKER_BETA} />
      <MarkerSprite marker={MARKER_DOT} />
      <MarkerSprite
        marker={{ ...MARKER_GAMMA, color: '#EF4444', badge: '★', label: 'Highlight' }}
      />
    </div>
  ),
}

/** 08~20시 30분 칸 24개. 희망(연하게)·방문(진하게)·희망 밖 방문(경고) */
const DIAL_CELLS = Array.from({ length: 24 }, (_, index) =>
  index === 7 ? 'strong' : index === 14 ? 'warn' : index >= 2 && index < 10 ? 'soft' : 'base',
) as ('base' | 'soft' | 'strong' | 'warn')[]

export const ClockDial: Story = {
  name: 'Clock dial (station)',
  args: {
    marker: {
      badge: '2',
      color: '#2563eb',
      variant: 'station',
      dial: { startHour: 8, cellMinutes: 30, cells: DIAL_CELLS },
    },
  },
}

export const ClockDialUnassigned: Story = {
  name: 'Clock dial (dot · 미배정)',
  args: {
    marker: {
      badge: '–',
      color: '#475569',
      variant: 'dot',
      dial: {
        startHour: 8,
        cellMinutes: 30,
        cells: DIAL_CELLS.map((tone) => (tone === 'soft' ? 'soft' : 'base')),
      },
    },
  },
}
