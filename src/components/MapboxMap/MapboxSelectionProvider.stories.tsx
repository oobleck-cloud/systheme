import { useState } from 'react'

import { MapboxMap } from './MapboxMap'
import { MARKERS_THREE, resolveMapboxAccessToken } from './mapboxMap.fixtures'
import { MapboxSelectionProvider, useMapboxSelection } from './MapboxSelectionProvider'
import { MapProvider } from './MapProvider'

import type { Meta, StoryObj } from '@storybook/react'

function ConnectedMap() {
  const { selectedMarkerId, select } = useMapboxSelection()

  return (
    <MapboxMap
      height="100%"
      markers={MARKERS_THREE}
      activeMarkerId={selectedMarkerId}
      onActiveMarkerChange={select}
    />
  )
}

function SelectionReadout() {
  const { selectedMarkerId, unselect } = useMapboxSelection()
  if (!selectedMarkerId) {
    return <p className="text-sm text-fg-muted">Provider: 선택된 마커 없음</p>
  }
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm">
      선택 ID: <strong>{selectedMarkerId}</strong>
      <button type="button" className="ml-3 text-xs underline" onClick={unselect}>
        unselect()
      </button>
    </div>
  )
}

const meta: Meta = {
  title: 'Components/L2/MapboxMap/MapboxSelectionProvider',
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <MapProvider accessToken={resolveMapboxAccessToken()}>
        <div
          className="flex flex-col gap-3 rounded-lg border border-border p-3"
          style={{ height: 460 }}
        >
          <Story />
        </div>
      </MapProvider>
    ),
  ],
}

export default meta
type Story = StoryObj

export const ControlledByProvider: Story = {
  name: 'Provider + Map 연동',
  render: () => (
    <MapboxSelectionProvider>
      <ConnectedMap />
      <SelectionReadout />
    </MapboxSelectionProvider>
  ),
}

export const ControlledMode: Story = {
  name: 'Controlled 모드',
  render: function ControlledModeStory() {
    const [id, setId] = useState<string | null>(null)
    return (
      <MapboxSelectionProvider selectedMarkerId={id} onSelectionChange={setId}>
        <MapboxMap
          height="100%"
          markers={MARKERS_THREE}
          activeMarkerId={id}
          onActiveMarkerChange={setId}
        />
        <p className="text-sm">외부 state: {id ?? 'null'}</p>
      </MapboxSelectionProvider>
    )
  },
}
