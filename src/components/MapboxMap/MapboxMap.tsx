/**
 * MapboxMap — 도메인 비의존 인터랙티브 지도 컴포넌트.
 *
 * - 단일 `<MapboxMap />` 인터페이스 뒤로 Mapbox GL JS 세팅·마커·화살표·지역 레이어를
 *   모두 감춘다. 소비자는 `markers`/`arrows`/`regions` 데이터와 이벤트 콜백만 주입.
 * - access token 같은 앱 단위 설정은 외부의 `<MapProvider>`에서 가져온다.
 * - 마커 팝업은 `marker.popup: ReactNode`로 선언형으로 주입. 링크/버튼 등 도메인
 *   요소는 소비자가 React로 직접 조립한다.
 *
 * @example
 * ```tsx
 * <MapProvider accessToken={TOKEN}>
 *   <MapboxMap
 *     height={400}
 *     camera={{ center: { lng: 126.978, lat: 37.5665 }, zoom: 12 }}
 *     markers={[{ id: 'a', position: { lng: 127, lat: 37.5 }, badge: '1' }]}
 *   />
 * </MapProvider>
 * ```
 */
'use client'

import type { FC, ReactNode } from 'react'

import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// ── Popup 스타일 주입 (모듈 로드 시 1회) ─────────────────────────────────────
let _popupStylesInjected = false
function injectPopupStyles() {
  if (_popupStylesInjected || typeof document === 'undefined') return
  const el = document.getElementById('miso-ds-mapbox-popup') ?? document.createElement('style')
  el.id = 'miso-ds-mapbox-popup'
  el.textContent = `
    .mapbox-popup-default .mapboxgl-popup-content {
      padding: 0;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid rgba(0,0,0,0.06);
      overflow: hidden;
      background: #ffffff;
    }
    .mapbox-popup-default .mapboxgl-popup-close-button {
      display: none;
    }
    /* 팝업 tip 색상 — 카드 배경과 일치 */
    .mapbox-popup-default.mapboxgl-popup-anchor-left .mapboxgl-popup-tip       { border-right-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-right .mapboxgl-popup-tip      { border-left-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip     { border-top-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-top .mapboxgl-popup-tip        { border-bottom-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-bottom-left .mapboxgl-popup-tip  { border-top-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-bottom-right .mapboxgl-popup-tip { border-top-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-top-left .mapboxgl-popup-tip   { border-bottom-color: #ffffff; }
    .mapbox-popup-default.mapboxgl-popup-anchor-top-right .mapboxgl-popup-tip  { border-bottom-color: #ffffff; }
  `
  if (!document.getElementById('miso-ds-mapbox-popup')) {
    document.head.appendChild(el)
  }
  _popupStylesInjected = true
}

import { FloatingBounce } from './FloatingBounce'
import { useArrows } from './hooks/useArrows'
import { useHoverGrow } from './hooks/useHoverGrow'
import { useMapboxMap } from './hooks/useMapboxMap'
import { useMarkers } from './hooks/useMarkers'
import { useOverlays } from './hooks/useOverlays'
import { useRegions } from './hooks/useRegions'
import { useStopDrag } from './hooks/useStopDrag'
import { useStopHints } from './hooks/useStopHints'
import { adjustMapBounds } from './lib/bounds'
import { MarkerSprite } from './MarkerSprite'

import type {
  LngLat,
  MapArrow,
  MapRouteLoop,
  MapCamera,
  MapClusterOptions,
  MapFeatureClickEvent,
  MapMarker,
  MapOverlay,
  MapRegionStyler,
  MapStopDropEvent,
  MapTheme,
  MapView,
} from './types/mapbox.types'

import { cn } from '@/utils/cn'

// ── Public Props ─────────────────────────────────────────────────────────────

export interface MapboxMapProps<TMarker = unknown, TRegion = Record<string, unknown>> {
  // Layout
  /** 컨테이너 높이. 기본값: 400 */
  height?: string | number
  /** 컨테이너 최소 높이 */
  minHeight?: string | number
  /** 루트 엘리먼트 className */
  className?: string

  // Camera
  /** 카메라 제어 (center, zoom, autoFit, fitKey, preserve) */
  camera?: MapCamera

  // Theme & style
  /** 지도 테마. 기본값: 'light' */
  theme?: MapTheme
  /** style URL 직접 지정 (제공 시 `theme`의 기본 style을 덮어씀) */
  styleUrl?: string

  // Data
  markers?: MapMarker<TMarker>[]
  arrows?: MapArrow[]
  /** 한 좌표를 여러 방문이 공유할 때 그 자리에 세우는 원 */
  loops?: MapRouteLoop[]
  regions?: GeoJSON.FeatureCollection<GeoJSON.Geometry, TRegion>[]

  /**
   * 마커 클러스터링. 지정하면 Mapbox 내장 클러스터가 켜지고,
   * 클러스터 클릭 시 풀리는 줌까지 확대한다.
   */
  cluster?: MapClusterOptions

  /**
   * 좌표에 고정되는 DOM 오버레이. 스프라이트로 굽기 어려운 조형(여러 줄 카드,
   * 버튼)을 얹는 슬롯이다. 구역 단위처럼 수십 개 규모에만 쓴다.
   */
  overlays?: MapOverlay[]

  /**
   * 카메라 이동이 끝날 때 현재 보이는 범위를 알려준다.
   *
   * "화면 중심이 어느 구역인가" 처럼 뷰에 반응하는 UI를 소비자가
   * mapbox-gl 인스턴스 없이 구현할 수 있게 하는 슬롯이다.
   */
  onCameraMove?: (view: MapView) => void

  // Selection
  /** 외부에서 제어하는 활성 마커 ID */
  activeMarkerId?: string | null
  onActiveMarkerChange?: (id: string | null) => void

  // Events
  onMarkerClick?: (marker: MapMarker<TMarker>) => void
  /**
   * 커서가 마커 위에 올라오거나(마커 id) 벗어날 때(null). 바뀔 때만 부른다.
   * 지도 밖 목록에서 같은 항목을 강조하는 데 쓴다.
   */
  onMarkerHover?: (markerId: string | null) => void
  onRegionClick?: (event: MapFeatureClickEvent<TRegion> | null) => void

  /**
   * 커서가 가까이 간 노드 하나를 살짝(1.2배) 키운다. 기본값: false
   *
   * 노드는 마커와 선·루프 위 중간 표시다. 그림 바로 위가 아니어도 테두리에서 12px 안이면
   * 반응하고, 둘을 통틀어 가장 가까운 하나만 커진다. 버튼을 누른 채 움직이는 동안(지도·중간
   * 표시 끌기)은 키우지 않는다. 클릭·`onMarkerHover`·커서 모양은 그대로 그림 위에서만 반응한다.
   */
  hoverGrow?: boolean

  /**
   * 선·루프 위의 중간 표시를 끌어다 놓았을 때.
   *
   * `markerId` 가 null 이면 마커 밖에 놓은 것이다. 놓인 결과가 무슨 뜻인지(배정·교환·거절)는
   * 디자인시스템이 정하지 않는다.
   *
   * 이 세 콜백 중 하나라도 주면 중간 표시가 드래그 핸들이 된다. 클릭 대상이 되는 것은
   * 아니다 — 중간 표시는 좌표가 아니라 구간 위의 자리이므로 여전히 눌리지 않는다.
   *
   * ⚠️ 드래그는 키보드로 대신할 수 없다. 디자인시스템은 대체 경로를 만들지 않으므로,
   * 같은 일을 할 수 있는 비드래그 경로(목록·메뉴·폼 등)는 소비자가 반드시 함께 둬야 한다.
   *
   * ⚠️ `animateActiveMarker` · `renderActiveMarker` 로 선택 마커가 DOM 오버레이로 바뀐
   * 동안에는 그 마커의 스프라이트가 가려져 드롭 대상으로 잡히지 않는다.
   */
  onStopDrop?: (event: MapStopDropEvent) => void
  /** 드래그 시작. 소비자가 드롭 가능한 대상을 강조하는 데 쓴다 */
  onStopDragStart?: (stopId: string) => void
  /**
   * 배정이 성립하지 않고 끝났을 때 — ESC, 마커 밖 드롭, 드래그 중 언마운트·스타일 재로드.
   *
   * 드래그 하나는 "마커 위 `onStopDrop`" 또는 "`onStopDragCancel`" 중 정확히 하나로 끝난다.
   * 강조를 거두는 자리는 그 둘이다.
   */
  onStopDragCancel?: () => void

  // Extension slots (도메인 주입)
  /** 지역 feature별 스타일 결정 함수. 미지정 시 디자인 시스템 기본값 */
  getRegionStyle?: MapRegionStyler<TRegion>
  /** 지역 선택 판정. 하나라도 true면 나머지는 dimmed 스타일로 렌더 */
  isRegionSelected?: (feature: GeoJSON.Feature<GeoJSON.Geometry, TRegion>) => boolean

  /**
   * 선택된 마커 오버레이에 bounce 애니메이션을 적용한다.
   *
   * `true`이면 기본 `MarkerSprite` 오버레이에 FloatingBounce가 적용된다.
   * `renderActiveMarker`가 함께 주어지면 해당 노드를 FloatingBounce로 감싼다.
   */
  animateActiveMarker?: boolean

  /**
   * 선택된 마커 자리에 React portal로 렌더할 커스텀 오버레이.
   *
   * 기본 sprite는 해당 id만 숨겨지고, 반환된 ReactNode가 정확히 그 자리에
   * 마운트된다. `popup`과 독립적이며 두 슬롯을 동시에 쓸 수도 있다.
   *
   * `animateActiveMarker`만 켜면 이 슬롯을 생략해도 기본 MarkerSprite가 사용된다.
   *
   * @example
   * ```tsx
   * <MapboxMap
   *   animateActiveMarker
   *   renderActiveMarker={(m) => <MarkerSprite marker={m} />}
   * />
   * ```
   */
  renderActiveMarker?: (marker: MapMarker<TMarker>) => ReactNode

  // A11y
  'aria-label'?: string
}

// ── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_CENTER: LngLat = { lng: 126.978, lat: 37.5665 } // Seoul
const DEFAULT_ZOOM = 12

// ── Component ────────────────────────────────────────────────────────────────

export const MapboxMap: FC<MapboxMapProps> = ({
  height = 400,
  minHeight,
  className,
  camera,
  theme = 'light',
  styleUrl,
  markers = [],
  arrows = [],
  loops = [],
  regions = [],
  cluster,
  overlays = [],
  onCameraMove,
  activeMarkerId,
  onActiveMarkerChange,
  onMarkerClick,
  onMarkerHover,
  onRegionClick,
  hoverGrow = false,
  onStopDrop,
  onStopDragStart,
  onStopDragCancel,
  getRegionStyle,
  isRegionSelected,
  animateActiveMarker = false,
  renderActiveMarker,
  'aria-label': ariaLabel = '인터랙티브 지도',
}) => {
  // 팝업 스타일 1회 주입
  useEffect(() => {
    injectPopupStyles()
  }, [])

  const containerRef = useRef<HTMLDivElement>(null)
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstResizeRef = useRef(true)
  const lastFitKeyRef = useRef<string | number | undefined>(undefined)

  // ── Active marker state ──────────────────────────────────────────────────
  const [internalActiveId, setInternalActiveId] = useState<string | null>(null)
  const isControlled = activeMarkerId !== undefined
  const currentActiveId = isControlled ? (activeMarkerId ?? null) : internalActiveId

  // ── Popup portal state ───────────────────────────────────────────────────
  const [popup, setPopup] = useState<{
    element: HTMLElement
    markerId: string
  } | null>(null)

  const activePopupNode: ReactNode = useMemo(() => {
    if (!popup) return null
    const m = markers.find((x) => x.id === popup.markerId)
    return m?.popup ?? null
  }, [popup, markers])

  // ── Active marker portal state (renderActiveMarker) ──────────────────────
  const [activeMarkerPortal, setActiveMarkerPortal] = useState<{
    element: HTMLElement
    markerId: string
  } | null>(null)

  const resolvedRenderActiveMarker = useCallback(
    (marker: MapMarker) => {
      const content = renderActiveMarker ? (
        renderActiveMarker(marker)
      ) : (
        <MarkerSprite marker={marker} />
      )
      return animateActiveMarker ? <FloatingBounce>{content}</FloatingBounce> : content
    },
    [animateActiveMarker, renderActiveMarker],
  )

  const usesActiveMarkerOverlay = animateActiveMarker || Boolean(renderActiveMarker)

  const activeMarkerNode: ReactNode = useMemo(() => {
    if (!activeMarkerPortal || !usesActiveMarkerOverlay) return null
    const m = markers.find((x) => x.id === activeMarkerPortal.markerId)
    return m ? resolvedRenderActiveMarker(m) : null
  }, [activeMarkerPortal, markers, usesActiveMarkerOverlay, resolvedRenderActiveMarker])

  // ── Camera resolution ────────────────────────────────────────────────────
  const cam: MapCamera = camera ?? {}
  const autoFit = cam.autoFit ?? true
  const zoom = cam.zoom ?? DEFAULT_ZOOM
  const preserve = cam.preserve ?? false

  // 초기 center: preserve면 `cam.center`만 사용 (데이터 등장으로 점프 방지)
  const center: LngLat = preserve
    ? (cam.center ?? DEFAULT_CENTER)
    : markers.length > 0
      ? markers[0].position
      : (cam.center ?? DEFAULT_CENTER)

  // ── Map instance ─────────────────────────────────────────────────────────
  const { map, isLoaded } = useMapboxMap({
    container: containerRef,
    center,
    zoom,
    // 따라갈 대상은 호출부가 **지정한** 좌표뿐이다 — 위의 `center` 는 마커에서 떨어질 수 있는
    // 초기값이라, 그걸 따라가면 데이터 갱신이 카메라 명령 행세를 한다.
    followCenter: cam.center,
    theme,
    styleUrl,
  })

  // ── Layer hooks ──────────────────────────────────────────────────────────
  useRegions({
    map,
    isLoaded,
    regions,
    getRegionStyle,
    isRegionSelected,
    onRegionClick,
  })

  // Marker ID → marker 조회용
  const markerById = useMemo(() => {
    const map = new Map<string, MapMarker>()
    markers.forEach((m) => map.set(m.id, m))
    return map
  }, [markers])

  const handleMarkerClick = useCallback(
    (id: string) => {
      const m = markerById.get(id)
      if (m) onMarkerClick?.(m)
    },
    [markerById, onMarkerClick],
  )

  const handleActiveChange = useCallback(
    (id: string | null) => {
      if (!isControlled) setInternalActiveId(id)
      onActiveMarkerChange?.(id)
    },
    [isControlled, onActiveMarkerChange],
  )

  const handlePopupOpen = useCallback((element: HTMLElement, data: { markerId: string }) => {
    setPopup({ element, markerId: data.markerId })
  }, [])

  const handlePopupClose = useCallback(() => {
    setPopup(null)
  }, [])

  const handleActiveMarkerMount = useCallback(
    (element: HTMLElement, data: { markerId: string }) => {
      setActiveMarkerPortal({ element, markerId: data.markerId })
    },
    [],
  )

  const handleActiveMarkerUnmount = useCallback(() => {
    setActiveMarkerPortal(null)
  }, [])

  useMarkers({
    map,
    markers,
    isLoaded,
    onMarkerClick: handleMarkerClick,
    onActiveMarkerChange: handleActiveChange,
    onPopupOpen: handlePopupOpen,
    onPopupClose: handlePopupClose,
    // 오버레이 슬롯(animateActiveMarker / renderActiveMarker)이 켜진 경우에만
    // markerLayers 내부의 "외부 렌더 경로"가 활성화된다.
    onActiveMarkerMount: usesActiveMarkerOverlay ? handleActiveMarkerMount : undefined,
    onActiveMarkerUnmount: usesActiveMarkerOverlay ? handleActiveMarkerUnmount : undefined,
    onMarkerHover,
    cluster,
  })

  useArrows({ map, arrows, markers, loops, isLoaded })

  // 중간 표시·구간·핀의 `tooltip` 을 가리킬 때만 띄운다. 문자열이 하나도 없으면 붙지 않는다.
  useStopHints({ map, arrows, loops, markers, isLoaded })

  useStopDrag({ map, isLoaded, onStopDrop, onStopDragStart, onStopDragCancel })

  useHoverGrow({ map, isLoaded, enabled: hoverGrow })

  const overlaySlots = useOverlays({ map, overlays, isLoaded })

  // ── Camera move 통지 ─────────────────────────────────────────────────────
  const latestCameraMove = useRef(onCameraMove)
  latestCameraMove.current = onCameraMove

  useEffect(() => {
    if (!map || !isLoaded || !onCameraMove) return
    const emit = () => {
      const c = map.getCenter()
      const b = map.getBounds()
      if (!b) return
      const sw = b.getSouthWest()
      const ne = b.getNorthEast()
      // 여백을 무시한 캔버스 네 귀퉁이 — 회전·기울임이 없는 지도라 두 귀퉁이로 충분하다
      const canvas = map.getCanvas()
      const csw = map.unproject([0, canvas.clientHeight])
      const cne = map.unproject([canvas.clientWidth, 0])
      latestCameraMove.current?.({
        center: { lng: c.lng, lat: c.lat },
        zoom: map.getZoom(),
        bounds: { sw: { lng: sw.lng, lat: sw.lat }, ne: { lng: ne.lng, lat: ne.lat } },
        canvasBounds: {
          sw: { lng: csw.lng, lat: csw.lat },
          ne: { lng: cne.lng, lat: cne.lat },
        },
      })
    }
    map.on('moveend', emit)
    emit()
    return () => {
      map.off('moveend', emit)
    }
    // onCameraMove는 ref로 최신화하므로 "주입 여부"만 의존성에 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded, onCameraMove != null])

  // ── Bounds adjustment ────────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded) return
    if (preserve) return

    const fitRegions = cam.fitRegions ?? (regions as GeoJSON.FeatureCollection[])

    if (cam.fitKey !== undefined) {
      // 맞출 대상이 아직 없으면 fitKey 를 소비하지 않는다 — 데이터가 늦게 도착해도
      // 그 키의 첫 fit 은 실행되어야 한다.
      const hasTargets =
        markers.length > 0 || fitRegions.some((fc) => (fc.features?.length ?? 0) > 0)
      if (!hasTargets) return
      if (lastFitKeyRef.current === cam.fitKey) return
      lastFitKeyRef.current = cam.fitKey
    }

    adjustMapBounds(map, {
      markers,
      regions: fitRegions,
      center,
      zoom,
      autoFit,
      padding: cam.padding,
    })
  }, [
    map,
    isLoaded,
    markers,
    regions,
    center,
    zoom,
    autoFit,
    cam.fitKey,
    cam.fitRegions,
    cam.padding,
    preserve,
  ])

  // ── Resize observation ───────────────────────────────────────────────────
  useEffect(() => {
    if (!map || !isLoaded || !containerRef.current) return

    const ro = new ResizeObserver(() => {
      if (isFirstResizeRef.current) {
        map.resize()
        isFirstResizeRef.current = false
        if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
        resizeTimeoutRef.current = setTimeout(() => {
          isFirstResizeRef.current = true
          resizeTimeoutRef.current = null
        }, 300)
        return
      }
      if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current)
      resizeTimeoutRef.current = setTimeout(() => {
        map.resize()
        isFirstResizeRef.current = true
        resizeTimeoutRef.current = null
      }, 300)
    })

    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
        resizeTimeoutRef.current = null
      }
      isFirstResizeRef.current = true
    }
  }, [map, isLoaded])

  // height/minHeight 변경 시 map.resize
  useEffect(() => {
    if (!map || !isLoaded) return
    const id = setTimeout(() => map.resize(), 0)
    return () => clearTimeout(id)
  }, [map, isLoaded, height, minHeight])

  // activeMarkerId (제어 모드) 동기화 훅은 향후 확장 포인트.
  // 현재는 내부 상태만 추적하고, 외부 activeMarkerId는 onActiveMarkerChange로만 통신.
  void currentActiveId

  const rootStyle = {
    width: '100%',
    height: typeof height === 'number' ? `${height}px` : height,
    minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
  } as const

  return (
    <div
      data-slot="mapbox-map-root"
      className={cn('relative overflow-hidden', className)}
      style={rootStyle}
    >
      <div
        ref={containerRef}
        data-slot="mapbox-map-viewport"
        role="region"
        aria-label={ariaLabel}
        className="size-full"
      />
      {popup && activePopupNode !== null ? (
        <div data-slot="mapbox-map-marker-popup">
          {createPortal(<>{activePopupNode}</>, popup.element)}
        </div>
      ) : null}
      {activeMarkerPortal && activeMarkerNode !== null ? (
        <div data-slot="mapbox-map-active-marker-overlay">
          {createPortal(<>{activeMarkerNode}</>, activeMarkerPortal.element)}
        </div>
      ) : null}
      {overlaySlots.length > 0 ? (
        <div data-slot="mapbox-map-overlays">
          {overlaySlots.map((slot) => {
            const overlay = overlays.find((o) => o.id === slot.id)
            if (!overlay) return null
            return <Fragment key={slot.id}>{createPortal(overlay.content, slot.element)}</Fragment>
          })}
        </div>
      ) : null}
    </div>
  )
}

MapboxMap.displayName = 'MapboxMap'
