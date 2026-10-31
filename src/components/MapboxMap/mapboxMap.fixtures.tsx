import type { MapArrow, MapMarker, MapRegionStyler, MapRouteLoop } from './types/mapbox.types'

export function resolveMapboxAccessToken(): string {
  return typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
    ? ((import.meta as unknown as { env: Record<string, string> }).env.VITE_MAPBOX_ACCESS_TOKEN ??
        '')
    : ''
}

export function MapPopupCard({
  title,
  description,
  meta,
  color,
}: {
  title: string
  description?: string
  meta?: string
  color?: string
}) {
  return (
    <div className="min-w-40 max-w-60 font-sans">
      <div
        className="h-0.5 rounded-t-2xl"
        style={{ backgroundColor: color ?? 'var(--ds-color-primary, #055cf5)' }}
      />
      <div className="px-4 py-3">
        <p className="m-0 text-sm font-bold text-fg">{title}</p>
        {description ? <p className="mt-1 text-xs text-fg-muted">{description}</p> : null}
        {meta ? <p className="mt-2 text-xs font-semibold text-primary">{meta}</p> : null}
      </div>
    </div>
  )
}

export const MARKER_ALPHA: MapMarker = {
  id: 'alpha',
  position: { lng: 126.978, lat: 37.5665 },
  color: '#055CF5',
  badge: '1',
  label: 'Alpha',
  popup: (
    <MapPopupCard
      title="Marker Alpha"
      description="Sample point at 37.5665, 126.978"
      meta="badge: 1"
      color="#055CF5"
    />
  ),
}

export const MARKER_BETA: MapMarker = {
  id: 'beta',
  position: { lng: 127.0276, lat: 37.4979 },
  color: '#F47921',
  badge: '2',
  label: 'Beta',
  popup: (
    <MapPopupCard
      title="Marker Beta"
      description="Sample point at 37.4979, 127.0276"
      meta="badge: 2"
      color="#F47921"
    />
  ),
}

export const MARKER_GAMMA: MapMarker = {
  id: 'gamma',
  position: { lng: 126.7052, lat: 37.4563 },
  color: '#008047',
  badge: '3',
  label: 'Gamma',
  popup: (
    <MapPopupCard
      title="Marker Gamma"
      description="Sample point at 37.4563, 126.7052"
      color="#008047"
    />
  ),
}

/** Dot badge marker — no label */
export const MARKER_DOT: MapMarker = {
  id: 'dot',
  position: { lng: 127.0012, lat: 37.5344 },
  color: '#055CF5',
  badge: '·',
  popup: (
    <MapPopupCard
      title="Dot marker"
      description="Minimal badge without label"
      meta="badge: ·"
      color="#055CF5"
    />
  ),
}

/** Highlight marker — accent color */
export const MARKER_HIGHLIGHT: MapMarker = {
  id: 'highlight',
  position: { lng: 127.015, lat: 37.512 },
  color: '#EF4444',
  badge: '★',
  popup: (
    <MapPopupCard
      title="Highlight marker"
      description="Emphasis marker for dynamic insertion demos"
      meta="badge: ★"
      color="#EF4444"
    />
  ),
}

export const MARKERS_THREE: MapMarker[] = [MARKER_ALPHA, MARKER_BETA, MARKER_GAMMA]

export const ARROWS_STRAIGHT: MapArrow[] = [
  { from: 'alpha', to: 'beta', color: '#055CF5', width: 3, follow: 'straight' },
  { from: 'beta', to: 'gamma', color: '#F47921', width: 3, follow: 'straight', dashed: true },
]

export const ARROWS_ROAD: MapArrow[] = [
  { from: 'alpha', to: 'beta', color: '#055CF5', width: 4, follow: 'road' },
  { from: 'beta', to: 'gamma', color: '#F47921', width: 4, follow: 'road' },
]

// ── 노선(route) 스타일 ───────────────────────────────────────────────────────
// 방문 지점을 역 원으로, 이름을 선 위 반복 표기로, 사이의 빈 자리를 중간 표시로 그린다.

const ROUTE_COLOR = '#7F77DD'

/** 순번만 달린 역 원 — 이름은 스프라이트가 아니라 선이 들고 있다 */
function station(id: string, lng: number, lat: number, badge: string): MapMarker {
  return { id, position: { lng, lat }, color: ROUTE_COLOR, badge, variant: 'station' }
}

export const ROUTE_STATIONS: MapMarker[] = [
  station('stop-1', 126.9779, 37.5665, '1'),
  station('stop-2', 127.0276, 37.5219, '2'),
  station('stop-3', 127.0473, 37.5045, '3'),
]

export const ROUTE_ARROWS: MapArrow[] = [
  {
    from: 'stop-1',
    to: 'stop-2',
    color: ROUTE_COLOR,
    width: 4.5,
    label: '김추영',
    stops: [{ id: 'slot-11:00' }, { id: 'slot-11:30' }],
  },
  {
    from: 'stop-2',
    to: 'stop-3',
    color: ROUTE_COLOR,
    width: 4.5,
    label: '김추영',
    stops: [{ id: 'slot-13:00' }],
  },
]

/**
 * 같은 좌표에 연속 방문이 있는 경우.
 *
 * 역 원을 좌표에 그대로 두면 완전히 포개져 순번을 읽을 수 없다. 그 좌표를 **중심으로** 원을
 * 세우고 방문들을 둘레에 앉힌다. 원의 중심 점이 진짜 좌표를 가리키고, 빈 자리 표시도 같은
 * 원 위에 얹힌다. 둘레의 두 방문 사이를 잇는 화살표는 필요 없다 — 원이 곧 그 구간이다.
 */
const SHARED_POINT = { lng: 127.0276, lat: 37.5219 }
const LOOP_RADIUS = 36

/** 원 위 각도(deg) → 화면 픽셀 오프셋. 0 = 오른쪽, 시계 방향 */
function onLoop(angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180
  return [Math.round(LOOP_RADIUS * Math.cos(rad)), Math.round(LOOP_RADIUS * Math.sin(rad))]
}

export const ROUTE_COINCIDENT_STATIONS: MapMarker[] = [
  station('arrive', 126.9779, 37.5665, '1'),
  {
    ...station('same-a', SHARED_POINT.lng, SHARED_POINT.lat, '2'),
    pixelOffset: onLoop(180),
  },
  {
    ...station('same-b', SHARED_POINT.lng, SHARED_POINT.lat, '3'),
    pixelOffset: onLoop(0),
  },
  station('depart', 127.0673, 37.4945, '4'),
]

export const ROUTE_COINCIDENT_LOOPS: MapRouteLoop[] = [
  {
    id: 'shared-building',
    center: SHARED_POINT,
    radius: LOOP_RADIUS,
    color: ROUTE_COLOR,
    // 두 방문(180°·0°) 사이 아래쪽에 빈 30분 한 칸
    stops: [{ id: 'slot-12:30', angle: 90 }],
  },
]

export const ROUTE_COINCIDENT_ARROWS: MapArrow[] = [
  { from: 'arrive', to: 'same-a', color: ROUTE_COLOR, width: 4.5, label: '김추영' },
  { from: 'same-b', to: 'depart', color: ROUTE_COLOR, width: 4.5, label: '김추영' },
]

/**
 * 드래그 데모용 구간.
 *
 * 구간 위 표시와 루프 위 표시를 한 화면에 함께 둔다 — 소스는 다르지만 소비자에게는 같은
 * 핸들이어야 하므로, 둘이 같이 보이는 자리에서 확인하는 편이 낫다.
 */
export const ROUTE_DRAG_ARROWS: MapArrow[] = [
  {
    from: 'arrive',
    to: 'same-a',
    color: ROUTE_COLOR,
    width: 4.5,
    label: '김추영',
    stops: [{ id: 'slot-10:30' }],
  },
  {
    from: 'same-b',
    to: 'depart',
    color: ROUTE_COLOR,
    width: 4.5,
    label: '김추영',
    stops: [{ id: 'slot-14:00' }],
  },
]

/**
 * 물었을 때만 답하는 노선.
 *
 * 같은 노선에 시각을 상시로 찍으면 역 배지·선 위 이름·빈 자리 원 위에 글자가 한 겹 더
 * 얹힌다. 대신 문자열만 실어 두고, 가리키거나 끄는 동안에만 꺼내 보인다 — 표시는 "몇 시
 * 칸인가", 선은 "몇 시에서 몇 시이고 얼마나 비었나".
 *
 * 문자열의 모양(`11:00`, `· 여유 1시간`)은 여기서 정한다. 디자인시스템은 시각도 여유도
 * 모르고 받은 글자만 그린다.
 */
export const ROUTE_HINT_ARROWS: MapArrow[] = [
  {
    from: 'arrive',
    to: 'same-a',
    color: ROUTE_COLOR,
    width: 4.5,
    label: '김추영',
    tooltip: '10:00 → 11:00 · 여유 30분',
    stops: [{ id: 'slot-10:30', tooltip: '10:30' }],
  },
  {
    from: 'same-b',
    to: 'depart',
    color: ROUTE_COLOR,
    width: 4.5,
    label: '김추영',
    tooltip: '13:30 → 15:00 · 여유 1시간',
    stops: [{ id: 'slot-14:00', tooltip: '14:00' }],
  },
]

/** 원 위 빈 자리도 같은 물건이다 — 소스만 다를 뿐 묻는 방법도 끄는 방법도 같다 */
export const ROUTE_HINT_LOOPS: MapRouteLoop[] = [
  {
    ...ROUTE_COINCIDENT_LOOPS[0]!,
    stops: [{ id: 'slot-12:30', angle: 90, tooltip: '12:30' }],
  },
]

/**
 * 핀도 물으면 답한다.
 *
 * 노선에 걸리지 않은 점(아직 아무 선에도 속하지 않은 방문)은 상시 이름표를 달 자리가
 * 마땅치 않다 — 그런 점이 수십 개면 글자가 지도를 덮는다. 물었을 때만 답하게 두면
 * 밀도는 0 이고 답은 늘 하나다.
 */
export const ROUTE_HINT_MARKERS: MapMarker[] = [
  ...ROUTE_COINCIDENT_STATIONS,
  {
    id: 'pending',
    position: { lng: 127.0286, lat: 37.5443 },
    color: '#9aa0a6',
    variant: 'dot',
    tooltip: '희망 10–14시',
  },
]

/**
 * 이 줌 미만으로 축소하면 루프를 접는다.
 *
 * 원은 반지름이 화면 px 고정이라 축소할수록 지도에서 덮는 넓이가 커진다. 전국이 한 화면에
 * 들어오는 배율에서는 노선 전체가 원 안에 들어가 버리므로, 그 전에 원래의 한 점으로 되돌린다.
 */
export const ROUTE_LOOP_MIN_ZOOM = 11

/** 접힌 모습 — 둘레에 벌려 둔 방문들을 진짜 좌표 한 점으로 되돌리고 순번 범위만 남긴다 */
export const ROUTE_COINCIDENT_COLLAPSED_STATIONS: MapMarker[] = [
  station('arrive', 126.9779, 37.5665, '1'),
  station('shared', SHARED_POINT.lng, SHARED_POINT.lat, '2·3'),
  station('depart', 127.0673, 37.4945, '4'),
]

export const ROUTE_COINCIDENT_COLLAPSED_ARROWS: MapArrow[] = [
  { from: 'arrive', to: 'shared', color: ROUTE_COLOR, width: 4.5, label: '김추영' },
  { from: 'shared', to: 'depart', color: ROUTE_COLOR, width: 4.5, label: '김추영' },
]

export const SAMPLE_REGIONS: GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  Record<string, unknown>
> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Region A',
        regionCode: 'A',
        regionId: 'region-a',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [127.02, 37.48],
            [127.09, 37.48],
            [127.09, 37.52],
            [127.02, 37.52],
            [127.02, 37.48],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        name: 'Region B',
        regionCode: 'B',
        regionId: 'region-b',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [126.96, 37.56],
            [127.0, 37.56],
            [127.0, 37.59],
            [126.96, 37.59],
            [126.96, 37.56],
          ],
        ],
      },
    },
  ],
}

export const regionStyler: MapRegionStyler<{ name?: string; regionId?: string }> = (
  _feature,
  { selected, dimmed },
) => ({
  fillColor: dimmed
    ? 'rgba(156, 163, 175, 0.25)'
    : selected
      ? 'rgba(5, 92, 245, 0.45)'
      : 'rgba(5, 92, 245, 0.22)',
  fillOpacity: selected ? 0.45 : 0.3,
  lineColor: selected ? 'rgba(5, 92, 245, 0.85)' : 'rgba(5, 92, 245, 0.55)',
  lineWidth: selected ? 2 : 1,
})
