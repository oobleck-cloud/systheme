import { fn } from '@storybook/test'
import { useCallback, useMemo, useState } from 'react'

import { MapboxMap } from './MapboxMap'
import anatomy from './MapboxMap.anatomy.json'
import {
  ARROWS_ROAD,
  ARROWS_STRAIGHT,
  MARKER_ALPHA,
  MARKER_BETA,
  MARKER_DOT,
  MARKER_GAMMA,
  MARKER_HIGHLIGHT,
  MARKERS_THREE,
  ROUTE_ARROWS,
  ROUTE_COINCIDENT_ARROWS,
  ROUTE_COINCIDENT_COLLAPSED_ARROWS,
  ROUTE_COINCIDENT_COLLAPSED_STATIONS,
  ROUTE_COINCIDENT_LOOPS,
  ROUTE_COINCIDENT_STATIONS,
  ROUTE_DRAG_ARROWS,
  ROUTE_HINT_ARROWS,
  ROUTE_HINT_LOOPS,
  ROUTE_HINT_MARKERS,
  ROUTE_LOOP_MIN_ZOOM,
  ROUTE_STATIONS,
  SAMPLE_REGIONS,
  regionStyler,
  resolveMapboxAccessToken,
} from './mapboxMap.fixtures'
import { MapProvider } from './MapProvider'
import { MarkerSprite } from './MarkerSprite'

import type { MapFeatureClickEvent } from './types/mapbox.types'
import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const MAP_HEIGHT = 420

function MapFrame({ children }: { children: React.ReactNode }) {
  const hasToken = Boolean(resolveMapboxAccessToken())
  return (
    <MapProvider accessToken={resolveMapboxAccessToken()}>
      <div className="flex flex-col gap-3">
        {!hasToken ? (
          <p className="rounded-lg border border-error-border bg-error-bg px-3 py-2 text-sm text-error-text">
            Storybook용 <code className="text-xs">packages/design-system/.env.local</code> 에{' '}
            <code className="text-xs">VITE_MAPBOX_ACCESS_TOKEN</code> 을 설정하세요.
          </p>
        ) : null}
        <div
          className="w-full overflow-hidden rounded-lg border border-border"
          style={{ height: MAP_HEIGHT }}
        >
          {children}
        </div>
      </div>
    </MapProvider>
  )
}

const meta: Meta<typeof MapboxMap> = {
  title: 'Components/L2/MapboxMap',
  component: MapboxMap,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <MapFrame>{Story()}</MapFrame>],
  args: {
    height: '100%',
    theme: 'light',
    animateActiveMarker: false,
    onMarkerClick: fn(),
    onActiveMarkerChange: fn(),
    onRegionClick: fn(),
  },
  argTypes: {
    theme: { control: 'radio', options: ['light', 'dark'] },
    animateActiveMarker: {
      control: 'boolean',
      description: '선택 마커 오버레이 bounce 애니메이션',
    },
  },
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof MapboxMap>

/** Controls로 마커·화살표·선택·애니메이션을 조합하는 playground */
export const Playground: Story = {
  render: function PlaygroundStory() {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [markerCount, setMarkerCount] = useState(3)
    const [showArrows, setShowArrows] = useState(true)
    const [roadRoute, setRoadRoute] = useState(false)
    const [animateActive, setAnimateActive] = useState(false)

    const markers = useMemo(() => MARKERS_THREE.slice(0, markerCount), [markerCount])
    const arrows = useMemo(() => {
      if (!showArrows || markers.length < 2) return []
      const base = roadRoute ? ARROWS_ROAD : ARROWS_STRAIGHT
      return base.slice(0, markers.length - 1)
    }, [showArrows, roadRoute, markers.length])

    return (
      <div className="flex h-full flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-1">
            markers
            <select
              className="rounded border border-border bg-background px-1 py-0.5 text-xs"
              value={markerCount}
              onChange={(e) => setMarkerCount(Number(e.target.value))}
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={showArrows}
              onChange={(e) => setShowArrows(e.target.checked)}
            />
            arrows
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={roadRoute}
              onChange={(e) => setRoadRoute(e.target.checked)}
            />
            road route
          </label>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={animateActive}
              onChange={(e) => setAnimateActive(e.target.checked)}
            />
            animate active marker
          </label>
          <span className="text-fg-muted">
            active: <strong>{activeId ?? 'none'}</strong>
          </span>
        </div>
        <MapboxMap
          height="100%"
          markers={markers}
          arrows={arrows}
          activeMarkerId={activeId}
          onActiveMarkerChange={setActiveId}
          animateActiveMarker={animateActive}
        />
      </div>
    )
  },
}

export const SingleMarker: Story = {
  name: 'Single marker',
  args: {
    markers: [MARKER_ALPHA],
    camera: { autoFit: true, zoom: 14 },
  },
}

export const MultipleMarkers: Story = {
  name: 'Multiple markers + autoFit',
  args: {
    markers: MARKERS_THREE,
  },
}

export const MarkersWithLabels: Story = {
  name: 'Labels and badge variants',
  args: {
    markers: [
      { ...MARKER_ALPHA, badge: '13', label: 'Alpha' },
      { ...MARKER_BETA, badge: '15½', label: 'Beta' },
      { ...MARKER_GAMMA, badge: '·', label: '' },
    ],
  },
}

export const PinVariants: Story = {
  name: 'Pin variants — filled / hollow / ghost / dot',
  args: {
    markers: [
      { ...MARKER_ALPHA, badge: '1', label: '김서연', variant: 'filled' },
      { ...MARKER_BETA, badge: '2', label: '김서연', variant: 'hollow' },
      { ...MARKER_GAMMA, badge: '2', label: '김서연', variant: 'ghost' },
      { ...MARKER_DOT, variant: 'dot', color: '#64748b' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: [
          '편집 전/후를 한 화면에서 보여줘야 하는 지도용 변형입니다.',
          '`hollow` = 대체 예정인 원래 위치, `ghost` = 아직 저장되지 않은 새 위치,',
          '`dot` = 순번·이름표가 의미 없는 미배정 지점.',
        ].join(' '),
      },
    },
  },
}

export const ActivePins: Story = {
  name: 'Pin variants — active ring',
  args: {
    markers: [
      { ...MARKER_ALPHA, badge: '1', label: '김서연', active: true },
      { ...MARKER_BETA, badge: '2', label: '김서연', variant: 'hollow', active: true },
      { ...MARKER_DOT, variant: 'dot', color: '#64748b', active: true },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          '`active` 는 variant와 조합됩니다. `activeMarkerId` 오버레이와 달리 스프라이트 자체를 강조하므로 여러 개를 동시에 강조할 수 있습니다.',
      },
    },
  },
}

export const ClusteredMarkers: Story = {
  name: 'Clustering (Mapbox 내장)',
  args: {
    markers: Array.from({ length: 60 }, (_, i) => ({
      id: `c-${i}`,
      position: {
        lng: 126.978 + (((i * 37) % 100) - 50) / 700,
        lat: 37.5665 + (((i * 53) % 100) - 50) / 900,
      },
      badge: String((i % 9) + 1),
      color: i % 3 === 0 ? '#055cf5' : i % 3 === 1 ? '#16a34a' : '#f97316',
    })),
    cluster: { radius: 52, maxZoom: 15 },
    camera: { zoom: 12, autoFit: true },
  },
  parameters: {
    docs: {
      description: {
        story:
          '`cluster` 를 넘기면 Mapbox 내장 클러스터가 켜집니다. 클러스터를 클릭하면 풀리는 줌까지 확대합니다. 화면 좌표를 직접 격자로 묶는 방식은 줌 애니메이션 중 클러스터가 튀므로 쓰지 않습니다.',
      },
    },
  },
}

export const CameraPadding: Story = {
  name: 'Camera padding (떠 있는 패널 회피)',
  args: {
    markers: MARKERS_THREE,
    camera: { autoFit: true, padding: { left: 280, bottom: 160, top: 24, right: 24 } },
  },
  render: (args) => (
    <div className="relative size-full">
      <MapboxMap {...args} />
      <div className="pointer-events-none absolute top-3 bottom-3 left-3 w-[264px] rounded-lg border border-border bg-background/90 p-3 text-sm text-fg-subtle">
        떠 있는 좌측 패널 (264px)
      </div>
      <div className="pointer-events-none absolute right-3 bottom-3 left-[288px] h-[140px] rounded-lg border border-border bg-background/90 p-3 text-sm text-fg-subtle">
        떠 있는 하단 독 (140px)
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`camera.padding` 으로 autoFit 시 패널 영역을 비워둡니다. 패딩이 없으면 데이터가 패널 밑에 가려집니다.',
      },
    },
  },
}

export const StraightArrows: Story = {
  name: 'Straight arrows',
  args: {
    markers: MARKERS_THREE,
    arrows: ARROWS_STRAIGHT,
  },
}

export const RoadArrows: Story = {
  name: 'Road-following arrows (Directions API)',
  args: {
    markers: MARKERS_THREE,
    arrows: ARROWS_ROAD,
  },
  parameters: {
    docs: {
      description: {
        story:
          '`follow: "road"` arrows call the Mapbox Directions API. An access token is required.',
      },
    },
  },
}

export const RouteLine: Story = {
  name: 'Route line — station pins with a repeating name',
  args: {
    markers: ROUTE_STATIONS,
    arrows: ROUTE_ARROWS,
  },
  parameters: {
    docs: {
      description: {
        story: [
          '노선도처럼 그리는 모드입니다. `variant: "station"` 은 꼬리 없는 원이고 좌표가 원의 중심입니다.',
          '이름은 핀마다 붙이지 않고 `MapArrow.label` 로 선을 따라 반복 표기합니다 —',
          '방문이 늘어도 라벨 수가 늘지 않고, 선이 화면 밖으로 나가도 보이는 구간에 다시 찍힙니다.',
          '`stops` 는 두 역 사이에 순서대로 균등 배치되는 중간 표시(예: 빈 30분 칸)입니다.',
        ].join(' '),
      },
    },
  },
}

export const RouteCoincidentStations: Story = {
  name: 'Route line — coincident stations form a loop',
  render: function CoincidentLoopStory() {
    const [zoom, setZoom] = useState(14)
    const expanded = zoom >= ROUTE_LOOP_MIN_ZOOM

    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-xs text-fg-muted">
          줌 {zoom.toFixed(1)} —{' '}
          {expanded ? '펼침 (루프)' : `접힘 (줌 ${ROUTE_LOOP_MIN_ZOOM} 미만)`}
        </p>
        <div className="min-h-0 flex-1">
          <MapboxMap
            height="100%"
            markers={expanded ? ROUTE_COINCIDENT_STATIONS : ROUTE_COINCIDENT_COLLAPSED_STATIONS}
            arrows={expanded ? ROUTE_COINCIDENT_ARROWS : ROUTE_COINCIDENT_COLLAPSED_ARROWS}
            loops={ROUTE_COINCIDENT_LOOPS}
            camera={{ zoom: 14, autoFit: true, fitKey: 'coincident' }}
            onCameraMove={(view) => setZoom(view.zoom)}
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: [
          '같은 좌표에 연속 방문이 있으면 역 원이 완전히 포개져 순번을 읽을 수 없습니다.',
          '그 좌표를 중심으로 원을 세우고 방문들을 둘레에 앉힙니다 —',
          '원의 중심 점이 진짜 좌표를 가리키고, 빈 자리 표시도 같은 원 위에 얹힙니다.',
          '둘레의 두 방문을 잇는 화살표는 두지 않습니다. 원이 곧 그 구간입니다.',
          '',
          '반지름이 화면 픽셀이라 축소할수록 원이 덮는 실제 넓이가 커집니다.',
          `그래서 줌 ${ROUTE_LOOP_MIN_ZOOM} 미만에서는 원을 감추고(\`minZoom\`),`,
          '둘레에 벌려 둔 방문도 한 점으로 되돌립니다 — 무엇으로 합칠지는 도메인 판단이라',
          '디자인시스템이 정하지 않고 소비자가 이 스토리처럼 직접 갈아 끼웁니다.',
        ].join(' '),
      },
    },
  },
}

export const RouteStopDragToMarker: Story = {
  name: 'Route line — drag a stop onto a marker',
  render: function StopDragStory() {
    const [draggingStopId, setDraggingStopId] = useState<string | null>(null)
    const [log, setLog] = useState<string>('아직 놓지 않았습니다.')

    // 드롭 대상 강조는 소비자 몫이다 — 디자인시스템은 "어디에 놓았는지"만 알려주므로,
    // 무엇이 받을 수 있는 자리인지는 이렇게 소비자가 칠한다.
    const markers = useMemo(
      () =>
        ROUTE_COINCIDENT_STATIONS.map((m) =>
          draggingStopId ? { ...m, active: true } : { ...m, active: false },
        ),
      [draggingStopId],
    )

    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-xs text-fg-muted">
          {draggingStopId ? `끄는 중: ${draggingStopId}` : log}
        </p>
        <div className="min-h-0 flex-1">
          <MapboxMap
            height="100%"
            markers={markers}
            arrows={ROUTE_DRAG_ARROWS}
            loops={ROUTE_COINCIDENT_LOOPS}
            camera={{ zoom: 14, autoFit: true, fitKey: 'stop-drag' }}
            onStopDragStart={(stopId) => {
              setDraggingStopId(stopId)
              setLog(`끌기 시작: ${stopId}`)
            }}
            onStopDrop={(event) => {
              setLog(
                event.markerId
                  ? `${event.stopId} → ${event.markerId} 에 놓음`
                  : `${event.stopId} 를 마커 밖(${event.lngLat.lng.toFixed(4)}, ${event.lngLat.lat.toFixed(4)})에 놓음 — 배정 없음`,
              )
            }}
            onStopDragCancel={() => setDraggingStopId(null)}
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: [
          '중간 표시(빈 자리)를 끌어 마커 위에 놓는 상호작용입니다.',
          '구간 위 표시와 루프 위 표시가 같은 핸들로 동작하고, ESC 로 취소됩니다.',
          '',
          '구간 위 표시를 끌면 원래 선이 감춰지고 그 구간이 커서 쪽으로 접힌 V 가 대신 그려집니다 —',
          '선을 하나 더 긋는 것이 아니라 고무줄을 눌러 내리는 것입니다.',
          '루프 위 표시는 접을 양 끝이 없어(원은 구간이 아닙니다) 집은 자리에서 커서까지 단선으로 끕니다.',
          '',
          '디자인시스템은 "어느 표시를 어느 마커에 놓았다"까지만 말합니다 —',
          '그것이 배정인지 교환인지는 도메인 판단이라 소비자가 정하고,',
          '드롭 가능한 대상 강조도 `onStopDragStart` 를 받아 소비자가 칠합니다.',
          '',
          '⚠️ 드래그는 키보드로 대신할 수 없습니다. 같은 일을 할 수 있는 비드래그 경로는',
          '소비자가 반드시 따로 유지해야 합니다.',
        ].join(' '),
      },
    },
  },
}

export const RouteStopHints: Story = {
  name: 'Route line — ask a stop, a leg, or a pin what time it is',
  render: function StopHintStory() {
    const [log, setLog] = useState<string>('표시·선·핀에 커서를 올려 보세요.')

    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-xs text-fg-muted">{log}</p>
        <div className="min-h-0 flex-1">
          <MapboxMap
            height="100%"
            markers={ROUTE_HINT_MARKERS}
            arrows={ROUTE_HINT_ARROWS}
            loops={ROUTE_HINT_LOOPS}
            camera={{ zoom: 14, autoFit: true, fitKey: 'stop-hints' }}
            onStopDragStart={(stopId) => setLog(`끄는 중: ${stopId} — 값이 커서를 따라옵니다.`)}
            onStopDrop={(event) =>
              setLog(
                event.markerId
                  ? `${event.stopId} → ${event.markerId} 에 놓음`
                  : `${event.stopId} 를 마커 밖에 놓음 — 배정 없음`,
              )
            }
            onStopDragCancel={() => setLog('표시·선·핀에 커서를 올려 보세요.')}
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: [
          '노선도에는 이미 역 배지·선 위 이름·빈 자리 원이 올라가 있습니다.',
          '여기에 시각까지 상시로 찍으면 글자가 한 겹 더 얹혀 정작 읽어야 할 것이 밀려납니다.',
          '그래서 시각은 **부를 때만** 나타납니다 — 상시 밀도는 0 만큼만 늘어납니다.',
          '',
          '`MapArrowStop.tooltip` — 표시에 커서를 올리면 그 자리 옆에 한 줄(예: `11:00`).',
          '`MapArrow.tooltip` — 선에 올리면 그 구간의 한 줄(예: `10:00 → 11:00 · 여유 30분`).',
          '선은 얇아 커서가 정확히 올라가기 어려우므로 질의에 허용 오차를 둡니다.',
          '`MapMarker.tooltip` — 핀에 올리면 그 핀의 한 줄(예: `희망 10–14시`).',
          '어느 선에도 걸리지 않은 점은 상시 이름표를 달 자리가 마땅치 않은데,',
          '물었을 때만 답하면 밀도를 늘리지 않고도 그 점의 사정을 읽을 수 있습니다.',
          '겹치면 좁은 것이 이깁니다: 표시 > 핀 > 선.',
          '',
          '빈 자리를 끄는 동안에는 그 칸의 문자열이 커서를 따라옵니다 —',
          '"지금 몇 시에 놓는가"가 판단의 근거인데, 그걸 보려고 손을 멈추고 호버할 수는 없습니다.',
          '이때 호버 답은 잠시 입을 다뭅니다. 같은 순간에 두 줄이 뜨면 어느 쪽이 손에 든 값인지 흐려집니다.',
          '',
          '문자열은 소비자가 만듭니다. 디자인시스템은 시각도 "여유"도 모르고 받은 글자만 그립니다.',
          '자리가 없으면 Mapbox 가 이 줄을 떨굽니다 — 다른 글자를 덮고 올라앉지 않습니다.',
        ].join(' '),
      },
    },
  },
}

export const HoverGrow: Story = {
  name: 'Hover grow — the node nearest the cursor grows a little',
  render: () => (
    <MapboxMap
      height="100%"
      markers={ROUTE_HINT_MARKERS}
      arrows={ROUTE_HINT_ARROWS}
      loops={ROUTE_HINT_LOOPS}
      camera={{ zoom: 14, autoFit: true, fitKey: 'hover-grow' }}
      hoverGrow
    />
  ),
  parameters: {
    docs: {
      description: {
        story: [
          '`hoverGrow` — 커서가 가까이 간 노드(마커·선 위 빈 자리) 하나를 1.2배로 키웁니다.',
          '그림 바로 위가 아니어도 테두리에서 12px 안이면 반응하고, 둘을 통틀어 가장 가까운 하나만 커집니다.',
          '노드가 빽빽한 화면에서 "지금 무엇을 가리키는가"를 누르기 전에 보여 주려는 것입니다.',
          '버튼을 누른 채 움직이는 동안(지도·빈 자리 끌기)은 키우지 않습니다. 기본은 꺼져 있습니다.',
        ].join(' '),
      },
    },
  },
}

export const DynamicMarkersOnClick: Story = {
  name: 'Dynamic markers on click',
  render: function DynamicMarkersOnClickStory() {
    const [showHighlight, setShowHighlight] = useState(false)

    const markers = useMemo(
      () => [MARKER_ALPHA, MARKER_BETA, MARKER_DOT, ...(showHighlight ? [MARKER_HIGHLIGHT] : [])],
      [showHighlight],
    )

    const arrows = useMemo(() => {
      if (!showHighlight) return ARROWS_STRAIGHT.slice(0, 1)
      return [
        ...ARROWS_STRAIGHT.slice(0, 1),
        {
          from: 'beta',
          to: 'highlight',
          color: '#EF4444',
          width: 4,
          follow: 'road' as const,
        },
      ]
    }, [showHighlight])

    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-sm text-fg-muted">
          Click marker Beta to insert a highlight marker and an accent road arrow.
        </p>
        <MapboxMap
          height="100%"
          markers={markers}
          arrows={arrows}
          regions={[SAMPLE_REGIONS]}
          onMarkerClick={(m) => {
            setShowHighlight(m.id === 'beta')
          }}
        />
      </div>
    )
  },
}

export const AggregateOverlayToggle: Story = {
  name: 'Aggregate overlay toggle (regression)',
  render: function AggregateOverlayToggleStory() {
    const [aggregated, setAggregated] = useState(false)

    // 집계 모드: 개별 마커를 전부 걷고 구역 카드 오버레이만 남긴다 — 상담지도의
    // 줌 집계 전환과 같은 조형. markers[0] 소멸(=파생 center 변화)과 오버레이
    // 시그니처 변화가 한 커밋에 겹치는 시나리오로, 지도 재생성 크래시의 회귀 방어다.
    const markers = aggregated ? [] : MARKERS_THREE

    const overlays = useMemo(() => {
      const card = (label: string, count: number) => (
        <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs shadow-md">
          <strong>{label}</strong> {count}건
        </div>
      )
      if (aggregated) {
        return [
          { id: 'agg-a', position: MARKER_ALPHA.position, content: card('서울 중심', 12) },
          { id: 'agg-b', position: MARKER_GAMMA.position, content: card('인천', 5) },
        ]
      }
      return [{ id: 'label-a', position: MARKER_BETA.position, content: card('강남', 3) }]
    }, [aggregated])

    return (
      <div className="flex h-full flex-col gap-2">
        <button
          type="button"
          className="self-start rounded-md border border-border px-3 py-1 text-sm"
          onClick={() => setAggregated((prev) => !prev)}
        >
          {aggregated ? '개별 핀 보기' : '구역 집계 보기'}
        </button>
        <MapboxMap height="100%" markers={markers} overlays={overlays} />
      </div>
    )
  },
}

export const WithRegions: Story = {
  name: 'GeoJSON region layer',
  args: {
    markers: MARKERS_THREE,
    regions: [SAMPLE_REGIONS],
    getRegionStyle: regionStyler,
  },
}

export const RegionSelection: Story = {
  name: 'Region click + dimmed highlight',
  render: function RegionSelectionStory() {
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
    const [lastClick, setLastClick] = useState<string>('none')

    const handleRegionClick = useCallback((event: MapFeatureClickEvent | null) => {
      if (!event) {
        setSelectedRegionId(null)
        setLastClick('map background (cleared)')
        return
      }
      const regionId = (event.feature.properties as { regionId?: string }).regionId
      setSelectedRegionId(regionId ?? null)
      setLastClick(
        String(
          (event.feature.properties as { name?: string; regionCode?: string }).name ??
            (event.feature.properties as { regionCode?: string }).regionCode ??
            'region',
        ),
      )
    }, [])

    return (
      <div className="flex h-full flex-col gap-2">
        <p className="text-sm">
          selected region: <strong>{lastClick}</strong>
        </p>
        <MapboxMap
          height="100%"
          markers={MARKERS_THREE}
          regions={[SAMPLE_REGIONS]}
          getRegionStyle={regionStyler}
          isRegionSelected={
            selectedRegionId
              ? (f) => (f.properties as { regionId?: string }).regionId === selectedRegionId
              : undefined
          }
          onRegionClick={handleRegionClick}
        />
      </div>
    )
  },
}

export const DarkTheme: Story = {
  name: 'Dark theme',
  args: {
    theme: 'dark',
    markers: MARKERS_THREE,
    arrows: ARROWS_STRAIGHT,
  },
}

export const PreserveCamera: Story = {
  name: 'Preserve camera on data change',
  render: function PreserveCameraStory() {
    const [extra, setExtra] = useState(false)
    const markers = extra ? [...MARKERS_THREE, MARKER_DOT] : MARKERS_THREE.slice(0, 2)

    return (
      <div className="flex h-full flex-col gap-2">
        <button
          type="button"
          className="w-fit rounded border border-border bg-background px-3 py-1 text-sm"
          onClick={() => setExtra((v) => !v)}
        >
          {extra ? 'Remove marker' : 'Add marker'}
        </button>
        <MapboxMap
          height="100%"
          markers={markers}
          camera={{ preserve: true, center: { lng: 126.978, lat: 37.52 }, zoom: 11 }}
        />
      </div>
    )
  },
}

export const AnimatedActiveMarker: Story = {
  name: 'Animated active marker overlay',
  args: {
    markers: MARKERS_THREE,
    animateActiveMarker: true,
  },
  render: function AnimatedActiveMarkerStory(args) {
    const [activeId, setActiveId] = useState<string | null>(null)

    return <MapboxMap {...args} activeMarkerId={activeId} onActiveMarkerChange={setActiveId} />
  },
  parameters: {
    docs: {
      description: {
        story:
          '`animateActiveMarker` enables the built-in bounce overlay on the selected marker. Toggle it in Controls.',
      },
    },
  },
}

export const CustomActiveMarkerOverlay: Story = {
  name: 'Custom active marker overlay',
  render: function CustomActiveMarkerOverlayStory() {
    const [activeId, setActiveId] = useState<string | null>(null)
    const [animate, setAnimate] = useState(true)

    return (
      <div className="flex h-full flex-col gap-2">
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={animate} onChange={(e) => setAnimate(e.target.checked)} />
          animateActiveMarker
        </label>
        <MapboxMap
          height="100%"
          markers={MARKERS_THREE}
          activeMarkerId={activeId}
          onActiveMarkerChange={setActiveId}
          animateActiveMarker={animate}
          renderActiveMarker={(m) => <MarkerSprite marker={m} />}
        />
      </div>
    )
  },
}

export const ControlledSelectionWithPanel: Story = {
  name: 'Controlled selection + side panel',
  render: function ControlledSelectionStory() {
    const [activeId, setActiveId] = useState<string | null>(null)
    const selected = MARKERS_THREE.find((m) => m.id === activeId) ?? null

    return (
      <div className="grid h-full grid-rows-[1fr_auto] gap-3">
        <MapboxMap
          height="100%"
          markers={MARKERS_THREE}
          activeMarkerId={activeId}
          onActiveMarkerChange={setActiveId}
          animateActiveMarker
        />
        {selected ? (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
            <MarkerSprite marker={selected} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{selected.label ?? selected.id}</p>
              <button
                type="button"
                className="mt-2 rounded border border-border px-2 py-0.5 text-xs"
                onClick={() => setActiveId(null)}
              >
                Clear selection
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-fg-muted">Click a marker to show the side panel.</p>
        )}
      </div>
    )
  },
}

export const EmptyMap: Story = {
  name: 'Empty map (default center)',
  args: {
    markers: [],
    camera: { center: { lng: 126.978, lat: 37.5665 }, zoom: 11, autoFit: false },
  },
}
