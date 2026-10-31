/**
 * MapboxMap 공용 타입 — 도메인 비의존.
 *
 * 이 파일은 디자인 시스템의 `MapboxMap` 컴포넌트가 외부로 노출하는
 * 모든 데이터 형상을 정의한다. 특정 비즈니스 용어(주문/상담/서비스 구역 등)를
 * 포함하지 않으며, 소비자가 `data` 제네릭과 렌더 슬롯으로 확장한다.
 */
import type { MarkerVariant } from '../lib/markerIcon'
import type { ReactNode } from 'react'

export type { MarkerVariant }

// ── 기본 단위 ────────────────────────────────────────────────────────────────

/** 경위도 좌표. `mapbox-gl`의 LngLat와 동일한 형상. */
export interface LngLat {
  lng: number
  lat: number
}

/** 지도 테마. */
export type MapTheme = 'light' | 'dark'

// ── 카메라 ───────────────────────────────────────────────────────────────────

/**
 * 카메라 제어. 여러 개의 개별 prop 대신 하나의 객체로 응집한다.
 */
/** 지도 위 떠 있는 패널만큼 비워둘 여백 (px). */
export interface MapPadding {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

/**
 * 현재 보이는 범위. `onCameraMove` 로 전달된다.
 *
 * 소비자가 mapbox-gl 인스턴스를 직접 만지지 않고도
 * "화면 중심이 어느 구역인가", "지금 몇 건이 보이나" 를 계산할 수 있게 한다.
 */
export interface MapView {
  center: LngLat
  zoom: number
  bounds: { sw: LngLat; ne: LngLat }
}

export interface MapCamera {
  /** 초기 중심 좌표. markers/regions가 있고 `autoFit`이 true면 무시됨 */
  center?: LngLat
  /** 초기 줌 레벨 */
  zoom?: number
  /** 데이터(markers/regions) 범위에 자동 맞춤. 기본값: true */
  autoFit?: boolean
  /**
   * 이 값이 바뀔 때만 autoFit을 재실행한다.
   * 값이 유지되면 데이터가 바뀌어도 카메라는 유지된다.
   */
  fitKey?: string | number
  /**
   * autoFit 시 bounds 계산에만 쓸 region subset.
   * 미지정 시 `regions` 전체를 사용한다.
   */
  fitRegions?: GeoJSON.FeatureCollection[]
  /**
   * true면 데이터 변경 시에도 카메라를 전혀 움직이지 않음.
   * `autoFit`, `fitKey`보다 우선한다.
   */
  preserve?: boolean
  /**
   * autoFit 시 비워둘 여백. 지도 위에 좌측 목록·하단 시간표 같은 패널이
   * 떠 있으면 그만큼 padding을 줘야 데이터가 패널 밑에 가려지지 않는다.
   */
  padding?: MapPadding
}

// ── 마커 ─────────────────────────────────────────────────────────────────────

/**
 * 지도 위의 단일 마커.
 *
 * `TData` 제네릭으로 소비자가 자유롭게 메타를 태울 수 있으며,
 * 콜백(`onMarkerClick`)에서 원본 마커 객체 형태로 되돌려받는다.
 */
export interface MapMarker<TData = unknown> {
  /** 고유 ID */
  id: string
  /** 위치 */
  position: LngLat
  /** 마커 기본 색상 (기본값: 디자인 시스템 blue-500) */
  color?: string
  /** 마커 내부 원형 배지 텍스트 (숫자 · 알파벳 · 1~2글자 이모지 등) */
  badge?: string
  /** 마커 하단 이름표. 값이 있으면 "이름표 있음" 스프라이트로 렌더 */
  label?: string
  /** 마커 위 보조 텍스트 */
  caption?: string
  /** caption 텍스트 색상 */
  captionColor?: string
  /**
   * 핀 표현 변형. 기본값 `'filled'`.
   * 편집 전/후를 동시에 보여줘야 하는 화면에서 원래 위치(`hollow`)와
   * 아직 저장되지 않은 새 위치(`ghost`)를 구분한다.
   */
  variant?: MarkerVariant
  /**
   * 선택 강조 링. `activeMarkerId` 와 달리 팝업/오버레이 스왑 없이
   * 스프라이트 자체를 강조하므로 다중 강조에도 쓸 수 있다.
   */
  active?: boolean
  /**
   * 앵커에서 픽셀만큼 비켜 그린다. `[오른쪽, 아래]`, 음수는 반대 방향.
   *
   * 같은 좌표에 두 핀을 나란히 놓아야 할 때 쓴다 — 편집 전/후를 함께 보여주는
   * 화면에서 원래 핀과 제안 핀이 정확히 겹쳐 하나로 보이는 것을 막는다.
   * 좌표를 흔드는 대신 화면 좌표로 비켜야 줌을 해도 간격이 유지된다.
   */
  pixelOffset?: readonly [number, number]
  /**
   * 물었을 때만 답하는 한 줄 — 커서가 이 핀 위에 있는 동안에만 뜬다.
   *
   * 구간(`MapArrow.tooltip`)·빈 자리(`MapArrowStop.tooltip`)와 **같은 물건**이며 같은 모양으로
   * 그려진다. 상시 이름표(`label`)와 갈라 쓰는 기준은 "늘 읽어야 하는가" 다 — 핀마다 붙는
   * 상시 글자는 몇 개만 넘어도 지도를 덮지만, 물어서 얻는 한 줄은 하나뿐이라 덮을 것이 없다.
   */
  tooltip?: string
  /**
   * 팝업 콘텐츠. `ReactNode`만 지원하며, 링크·버튼 등 도메인 요소는
   * 소비자가 직접 React로 주입한다.
   */
  popup?: ReactNode
  /** 소비자 메타데이터. 콜백 인자로 마커 전체가 돌아올 때 함께 전달 */
  data?: TData
}

// ── 클러스터 ─────────────────────────────────────────────────────────────────

/**
 * 마커 클러스터링. Mapbox 내장(supercluster)을 사용한다.
 *
 * 화면 좌표를 직접 격자로 묶는 방식은 줌 애니메이션 중 클러스터가 튀므로
 * 쓰지 않는다. 내장 클러스터는 확장 줌 계산(`getClusterExpansionZoom`)도 제공한다.
 */
export interface MapClusterOptions {
  /** 클러스터 반경 (px). 기본값 48 */
  radius?: number
  /** 이 줌을 넘으면 클러스터를 풀고 개별 마커를 보여준다. 기본값 15 */
  maxZoom?: number
  /** 클러스터 원 색상. 기본값 마커 기본색 */
  color?: string
  /** 클러스터 클릭 시 확장 줌으로 이동. 기본값 true */
  zoomOnClick?: boolean
}

// ── 오버레이 ─────────────────────────────────────────────────────────────────

/** 오버레이를 좌표에 붙일 기준점. */
export type MapOverlayAnchor = 'center' | 'top' | 'bottom' | 'left' | 'right'

/**
 * 좌표에 고정되는 DOM 오버레이.
 *
 * 마커(`MapMarker`)는 캔버스 스프라이트라 줌 중에도 흔들리지 않는 대신 조형이
 * 스프라이트로 굽는 것에 묶인다. 구역 집계 카드처럼 여러 줄·여러 색을 쓰거나
 * 버튼으로 동작해야 하는 것은 DOM 으로 얹는다.
 *
 * 개수가 많아지면 줌마다 리플로우가 늘어나므로, 구역 단위처럼 수십 개 규모에만 쓴다.
 */
export interface MapOverlay {
  /** 고유 id. 좌표가 같아도 id 가 다르면 별개 오버레이다. */
  id: string
  position: LngLat
  content: ReactNode
  /** 기본값 `'center'` */
  anchor?: MapOverlayAnchor
}

// ── 화살표 ───────────────────────────────────────────────────────────────────

/**
 * 선 위에 얹는 중간 표시.
 *
 * 좌표가 아니라 "구간 위의 몇 번째 자리"다. 두 마커 사이에 순서대로 균등 배치되며,
 * 실제 지점이 아니므로 지도 클릭 대상이 되지 않는다 — 지리적 사실이 아닌 것이
 * 좌표처럼 눌리면 오독이 굳는다.
 *
 * 다만 `onStopDrop` 계열 콜백을 주면 **끌 수 있는 핸들**은 된다. 끌어서 옮기는 것은
 * "이 자리를 저기로 보낸다"는 뜻이라 자리라는 성격과 어긋나지 않는다 — 여전히 눌러서
 * 선택되지는 않는다.
 */
export interface MapArrowStop {
  /** 콜백으로 되돌려받을 식별자 */
  id: string
  /** 원 색. 기본값은 화살표 색 */
  color?: string
  /**
   * 이 자리를 가리켜야 알 수 있는 짧은 한 줄(예: `11:00`).
   *
   * 호버하면 표시 옆에 뜨고, 끄는 동안에는 커서를 따라온다 — 끌면서 "지금 몇 시에 놓는가"를
   * 판단하려면 손을 멈추고 호버할 수가 없기 때문이다. 둘 다 부를 때만 나타나므로 지도의
   * 상시 밀도는 늘지 않는다.
   *
   * 문자열은 소비자가 만든다. 디자인시스템은 시각도 여유도 모르고 받은 글자만 그린다.
   */
  tooltip?: string
}

/**
 * 두 마커를 잇는 화살표(선).
 */
export interface MapArrow {
  /** (선택) 화살표 식별자 */
  id?: string
  /** 시작 마커 ID */
  from: string
  /** 도착 마커 ID */
  to: string
  color?: string
  /** 선 두께 (px) */
  width?: number
  /** 점선 여부 */
  dashed?: boolean
  /**
   * 경로 모양. 기본값: `'straight'`.
   * - `'straight'` — 두 지점을 잇는 직선
   * - `'road'` — Mapbox Directions API로 실제 도로 경로 사용
   */
  follow?: 'straight' | 'road'
  /**
   * 선을 따라 일정 간격으로 반복 표기할 이름. 지하철 노선도가 노선 이름을 되풀이하는 것과 같다.
   *
   * 끝점에 한 번 붙이는 이름표와 달리, 선이 길어도·화면이 잘려도 "이게 누구 선인가"를 잃지 않는다.
   * 간격에 못 미치는 짧은 구간에는 Mapbox 가 알아서 찍지 않으므로 짧은 leg 는 조용히 비워진다.
   */
  label?: string
  /**
   * 구간 위에 순서대로 균등 배치할 중간 표시.
   *
   * `follow: 'road'` 구간에는 아직 얹지 않는다 — 도로 경로는 길이가 직선과 크게 달라
   * 등분 위치가 시간 간격을 뜻하지 못한다.
   */
  stops?: MapArrowStop[]
  /**
   * 선 위에 커서를 올렸을 때만 뜨는 짧은 한 줄(예: `10:30 → 12:00 · 여유 1시간`).
   *
   * `label` 과 다르다 — `label` 은 선을 따라 늘 반복되는 이름이라 "이게 누구 선인가"를
   * 잃지 않기 위한 것이고, 이쪽은 물었을 때만 답하는 구간의 속사정이다. 늘 떠 있으면
   * 노선 하나에 글자가 두 배가 된다.
   */
  tooltip?: string
}

// ── 루프 ─────────────────────────────────────────────────────────────────────

/** 원 위의 중간 표시. 각도로 자리를 정한다 */
export interface MapRouteLoopStop extends MapArrowStop {
  /** 원 위 각도 (deg). 0 = 오른쪽, 시계 방향(화면 기준) */
  angle: number
}

/**
 * 한 좌표를 여러 방문이 공유할 때 그 자리에 세우는 원.
 *
 * 같은 건물에 연속 방문이 있으면 마커가 완전히 포개져 순번을 읽을 수 없다. 선을 옆으로
 * 휘게 하는 것으로는 풀리지 않는다 — 두 점 사이 거리가 0 이면 휠 자리도 없기 때문이다.
 *
 * 대신 그 좌표를 **중심으로** 원을 세우고, 방문들을 원 둘레에 앉힌다(마커의 `pixelOffset`
 * 을 원 위 좌표로 준다). 원의 중심에는 진짜 좌표를 가리키는 점을 찍는다 — 둘레의 마커는
 * 실제 위치가 아니라 "이 자리를 나눠 쓴다"는 표시이므로, 진짜 좌표가 어디인지는 따로
 * 말해 줘야 한다. 빈 자리 표시도 같은 원 위에 얹힌다.
 *
 * 반지름은 화면 픽셀이라 줌과 무관하게 일정하다.
 */
export interface MapRouteLoop {
  id: string
  /** 원의 중심 = 방문들이 공유하는 진짜 좌표 */
  center: LngLat
  /** 원 반지름 (px). 기본값 36 */
  radius?: number
  color?: string
  /** 선 두께 (px) */
  width?: number
  /** 원 위에 얹을 중간 표시(빈 자리 등) */
  stops?: MapRouteLoopStop[]
  /** 중심에 진짜 좌표 점을 찍는다. 기본값 true */
  showCenter?: boolean
  /**
   * 이 줌 미만으로 축소하면 원을 그리지 않는다. 기본값 11.
   *
   * 반지름이 화면 px 고정이라 축소할수록 원이 지도에서 차지하는 실제 넓이가 커진다. 전국이
   * 한 화면에 들어오는 배율에서는 노선 전체가 원 안에 들어가, "이 방문들이 한 자리를
   * 공유한다"가 아니라 "전부 한 자리다"로 읽힌다.
   *
   * 원을 감출 때 둘레에 앉혀 둔 마커의 `pixelOffset` 도 함께 거두는 것은 소비자 몫이다 —
   * 무엇을 대신 보여줄지(한 개로 합칠지, 건수 배지를 달지)는 도메인 판단이라 여기서 정하지
   * 않는다.
   */
  minZoom?: number
}

// ── 지역(Region) ─────────────────────────────────────────────────────────────

/**
 * 지역 레이어의 페인트 스타일.
 * `getRegionStyle`이 feature별로 반환하는 값.
 */
export interface MapRegionStyle {
  fillColor: string
  fillOpacity?: number
  lineColor: string
  lineWidth?: number
}

/** 지역 렌더링 상태 — `getRegionStyle`에 전달된다. */
export interface MapRegionState {
  /** `isRegionSelected(feature) === true`일 때 */
  selected: boolean
  /** 다른 feature가 선택돼 해당 feature가 흐려져야 할 때 */
  dimmed: boolean
}

/**
 * 지역 스타일 결정 함수.
 * 도메인 비의존 색상 규칙을 소비자가 주입한다.
 *
 * @example
 * ```ts
 * getRegionStyle={(feature, { selected, dimmed }) => ({
 *   fillColor: dimmed ? '#E5E7EB' : feature.properties.hexColor,
 *   fillOpacity: selected ? 0.5 : 0.3,
 *   lineColor: feature.properties.borderColor,
 *   lineWidth: selected ? 2 : 1,
 * })}
 * ```
 */
export type MapRegionStyler<P = Record<string, unknown>> = (
  feature: GeoJSON.Feature<GeoJSON.Geometry, P>,
  state: MapRegionState,
) => MapRegionStyle

// ── 이벤트 ───────────────────────────────────────────────────────────────────

/**
 * 중간 표시를 끌어다 놓았을 때의 결과.
 *
 * 디자인시스템은 "어느 표시를 어느 마커 위에 놓았다"까지만 말한다. 그것이 배정인지
 * 교환인지 금지된 조합인지는 도메인 판단이라 소비자가 정한다.
 */
export interface MapStopDropEvent {
  /** 끌던 중간 표시의 id (`MapArrowStop.id` · `MapRouteLoopStop.id`) */
  stopId: string
  /** 놓은 지점에 있던 마커. 마커 밖이면 `null` */
  markerId: string | null
  /** 놓은 지점의 좌표 */
  lngLat: LngLat
}

/**
 * 지역 클릭 이벤트.
 * `feature.properties`를 통해 소비자가 원하는 도메인 필드에 접근한다.
 */
export interface MapFeatureClickEvent<P = Record<string, unknown>> {
  feature: GeoJSON.Feature<GeoJSON.Geometry, P>
  lngLat: LngLat
}
