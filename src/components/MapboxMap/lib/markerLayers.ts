import mapboxgl from 'mapbox-gl'

import {
  loadMarkerIconAsImage,
  createMarkerIconDataUrl,
  isCenterAnchored,
  markerFootprint,
  markerImageId,
  type MarkerIconOptions,
} from './markerIcon'

import type { MapClusterOptions, MapMarker } from '../types/mapbox.types'

const SOURCE_ID = 'markers-source'
/**
 * 마커 스프라이트 레이어.
 *
 * 선·중간표시를 이 아래로 내리고(arrows), 드롭 대상 판정도 이 레이어에 질의한다 —
 * "마커가 어느 레이어에 있는가"를 파일마다 따로 적어 두면 한쪽만 바뀔 때 조용히 어긋난다.
 */
export const MARKER_SPRITE_LAYER_ID = 'markers-sprite'
const SPRITE_LAYER_ID = MARKER_SPRITE_LAYER_ID
const CLUSTER_CIRCLE_LAYER_ID = 'markers-cluster'
const CLUSTER_COUNT_LAYER_ID = 'markers-cluster-count'
const DEFAULT_COLOR = '#055cf5'
/** 스프라이트는 2배 크기로 구워 절반으로 그린다 — 고밀도 화면에서 흐려지지 않게 */
const ICON_SIZE = 0.5

/**
 * 커서가 가까이 간 노드를 키우는 배율(`hoverGrow`). 큰 노드(마커)·작은 노드(중간 표시)가 같은
 * 값을 쓴다 — 크기가 달라도 "가리켰다"는 같은 말이어야 한다. 1.2 아래로 내리면 지름 11px 인
 * 중간 표시가 2px 남짓 커져 눈에 띄지 않는다.
 */
export const HOVER_GROW_SCALE = 1.2

/** 맨 위로 올릴 정렬 키 — 마커 순번(index)이 넘볼 수 없는 값 */
const HOVER_SORT_KEY = 1e9

/**
 * 마커 하나를 키우는 레이아웃. `null` 이면 원래 값이다 — 레이어를 만들 때도 이 값을 쓴다.
 *
 * `icon-size` 는 레이아웃 속성이라 feature-state 를 받지 못한다(style-spec 이 거절한다). 그래서
 * 가리킨 id 를 표현식에 직접 박아 바꿔 끼운다. 바꿀 때마다 이 소스를 다시 배치하지만, 가리킨
 * 노드가 **바뀔 때만** 부르므로 커서가 움직일 때마다 도는 일은 없다.
 *
 * `icon-offset` 도 같이 바꾸는 이유: 오프셋은 `icon-size` 가 곱해진 뒤 픽셀이 되므로, 그대로
 * 두면 원 둘레에 앉힌 마커(`pixelOffset`)가 커지면서 바깥으로 밀려난다.
 */
export function markerGrowLayout(markerId: string | null): Record<string, unknown> {
  if (markerId == null) {
    return {
      'icon-size': ICON_SIZE,
      'icon-offset': ['get', 'iconOffset'],
      'symbol-sort-key': ['get', 'symbolSortKey'],
    }
  }
  const hovered = ['==', ['get', 'id'], markerId]
  return {
    'icon-size': ['case', hovered, ICON_SIZE * HOVER_GROW_SCALE, ICON_SIZE],
    'icon-offset': ['case', hovered, ['get', 'grownIconOffset'], ['get', 'iconOffset']],
    // 커진 노드가 겹친 이웃 아래에 깔리면 키운 보람이 없다.
    'symbol-sort-key': ['case', hovered, HOVER_SORT_KEY, ['get', 'symbolSortKey']],
  }
}

/** `badge` 우선, 없으면 1-based 인덱스 */
function resolveBadge(m: MapMarker, index: number): string {
  return m.badge ?? String(index + 1)
}

function iconOptions(m: MapMarker, index: number): MarkerIconOptions {
  return {
    number: resolveBadge(m, index),
    label: m.label,
    color: m.color ?? DEFAULT_COLOR,
    variant: m.variant,
    active: m.active,
    ...(m.dial ? { dial: m.dial } : {}),
  }
}

/**
 * 마커 배열을 GeoJSON FeatureCollection으로 변환.
 * properties에는 도메인 필드를 절대 넣지 않는다 — `id`로만 조회 가능.
 */
function markersToGeoJSON(markers: MapMarker[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: markers.map((m, index) => {
      const offsetX = m.pixelOffset?.[0] ?? 0
      const offsetY = m.pixelOffset?.[1] ?? 0
      const footprint = markerFootprint(m)
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [m.position.lng, m.position.lat],
        },
        properties: {
          id: m.id,
          imageId: markerImageId(iconOptions(m, index)),
          color: m.color ?? DEFAULT_COLOR,
          // 호버 힌트가 읽어 가는 한 줄. 도메인 필드가 아니라 표시 문자열이므로 실어 보낸다 —
          // 커서가 지나갈 때마다 소비자에게 되묻지 않으려면 지도가 들고 있어야 한다.
          tooltip: m.tooltip ?? '',
          // 꼬리 있는 핀은 뾰족한 끝이, 역 원은 원의 중심이 좌표다.
          iconAnchor: isCenterAnchored(m.variant, m.dial) ? 'center' : 'bottom',
          /** 겹칠 때 렌더 순서: 값이 클수록 위 (나중 마커가 위) */
          symbolSortKey: index,
          // icon-offset 은 icon-size 가 곱해진 뒤 픽셀이 된다. 소비자가 픽셀로 말하게 하려고
          // 여기서 나눠 둔다 (ICON_SIZE 0.5 → 2배).
          iconOffset: [offsetX / ICON_SIZE, offsetY / ICON_SIZE],
          grownIconOffset: [
            offsetX / (ICON_SIZE * HOVER_GROW_SCALE),
            offsetY / (ICON_SIZE * HOVER_GROW_SCALE),
          ],
          // 커서와의 거리를 재는 원(`hoverGrow`). 질의 결과로 되돌아와야 하므로 스칼라로 싣는다.
          offsetX,
          offsetY,
          footprintRadius: footprint.radius,
          footprintLift: footprint.lift,
        },
      }
    }),
  }
}

/** 마커 레이어 이벤트 콜백 — 도메인 필드 없음 */
export interface MarkerLayerHandlers {
  onMarkerClick?: (markerId: string) => void
  onActiveMarkerChange?: (markerId: string | null) => void
  /**
   * 팝업이 열릴 때 호출. 소비자가 `element`에 React portal로 임의의
   * `ReactNode`를 렌더한다.
   */
  onPopupOpen?: (element: HTMLElement, data: { markerId: string }) => void
  onPopupClose?: () => void
  /**
   * 커서가 마커 위에 올라오거나(id) 벗어날 때(null). 같은 마커 위에서 움직이는 동안에는
   * 다시 부르지 않는다 — 목록의 같은 행을 강조하는 데 쓰므로 바뀔 때만 알리면 된다.
   */
  onMarkerHover?: (markerId: string | null) => void

  /**
   * 선택된 마커 위치에 "외부 DOM 오버레이"가 마운트되었을 때 호출.
   *
   * 팝업과 독립적으로, 소비자가 이 `element`에 React portal로 강조
   * 그래픽(벌룬 애니메이션 마커 등)을 렌더할 수 있다. 기본 sprite는
   * 해당 id만 필터로 가려지므로, portal 컨텐츠가 그대로 그 자리를 대체한다.
   *
   * 이 콜백이 주입되면 popup 유무와 무관하게 float marker DOM이 뜬다.
   */
  onActiveMarkerMount?: (element: HTMLElement, data: { markerId: string }) => void
  /** 선택된 마커가 바뀌거나 선택이 해제되어 float 오버레이가 제거될 때 호출. */
  onActiveMarkerUnmount?: () => void
}

/**
 * 스프라이트 기반 마커 레이어를 map에 추가한다.
 * 반환된 cleanup을 호출하면 이벤트·레이어·이미지까지 안전하게 정리.
 *
 * `isStale` 이 그림을 다 구운 시점에 참이면 지도에 아무것도 반영하지 않는다 — 더 새 갱신이
 * 이미 지도를 맞춘 뒤 늦게 끝난 호출이 낡은 핀을 다시 올리지 않게(2026-10-23 상담지도:
 * 집계 배율로 마커 0개가 된 뒤 취소된 47개 갱신이 끝나 핀이 남았다).
 */
export function addMarkerLayers(
  map: mapboxgl.Map,
  markers: MapMarker[],
  handlers: MarkerLayerHandlers = {},
  cluster?: MapClusterOptions,
  isStale?: () => boolean,
): Promise<() => void> {
  if (markers.length === 0) {
    removeMarkerLayers(map, [])
    return Promise.resolve(() => {})
  }

  const imageIds: string[] = []

  // 시각적으로 같은 마커는 스프라이트를 공유한다 — 200건 화면에서 canvas 재사용.
  const uniqueIcons = new Map<string, MarkerIconOptions>()
  markers.forEach((m, index) => {
    const options = iconOptions(m, index)
    const id = markerImageId(options)
    if (!uniqueIcons.has(id)) uniqueIcons.set(id, options)
  })

  return Promise.all(
    [...uniqueIcons].map(([imageId, options]) =>
      loadMarkerIconAsImage(options).then((img) => ({ imageId, img })),
    ),
  ).then((loaded) => {
    if (isStale?.()) return () => {}
    const owned = ownedImagesOf(map)
    loaded.forEach(({ imageId, img }) => {
      if (!map.hasImage(imageId)) {
        map.addImage(imageId, img)
        imageIds.push(imageId)
      }
      owned.add(imageId)
    })

    const geo = markersToGeoJSON(markers)
    // 클러스터 설정은 소스 생성 시점에만 반영되므로, 켜짐/꺼짐이 바뀌면 소스를 다시 만든다.
    const existing = map.getSource(SOURCE_ID) as
      | (mapboxgl.GeoJSONSource & { _data?: unknown })
      | undefined
    const wantsCluster = cluster != null
    const hasCluster = clusterSourceEnabled.get(map) ?? false
    if (existing && wantsCluster === hasCluster) {
      existing.setData(geo)
    } else {
      // 클러스터 설정이 바뀌어 소스를 다시 만든다 — 방금 올린 그림은 그대로 둔다
      removeLayersAndSource(map)
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geo,
        ...(wantsCluster
          ? {
              cluster: true,
              clusterRadius: cluster.radius ?? 48,
              clusterMaxZoom: cluster.maxZoom ?? 15,
            }
          : {}),
      })
    }
    clusterSourceEnabled.set(map, wantsCluster)

    // 레이어가 이미 있으면 그대로 둔다 — 지웠다 다시 얹으면 그 사이 프레임에 핀이 사라진다.
    if (map.getLayer(SPRITE_LAYER_ID)) {
      map.setFilter(SPRITE_LAYER_ID, baseSpriteFilter(wantsCluster))
    } else
      map.addLayer({
        id: SPRITE_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': ['get', 'imageId'],
          'icon-anchor': ['get', 'iconAnchor'],
          'icon-allow-overlap': true,
          ...markerGrowLayout(null),
        },
        filter: baseSpriteFilter(wantsCluster),
      })

    if (wantsCluster) addClusterLayers(map, cluster)

    // 새 데이터가 들어간 **뒤에** 더는 안 쓰는 그림만 걷는다. 매번 전부 지웠다 다시 얹으면
    // (예전 동작) Mapbox 의 아이콘 아틀라스가 흔들려 스타일 아이콘(도로 번호·공항)이 검은 네모로
    // 그려졌다(2026-09-28 상담지도).
    for (const id of [...owned]) {
      if (uniqueIcons.has(id)) continue
      if (map.hasImage(id)) map.removeImage(id)
      owned.delete(id)
    }

    return bindInteractions(map, markers, handlers, cluster)
  })
}

/** map 인스턴스별 "현재 소스가 클러스터 모드인가" — 소스 재생성 판단용 */
const clusterSourceEnabled = new WeakMap<mapboxgl.Map, boolean>()

/** map 인스턴스별 마커가 올린 그림 — 레이어를 걷을 때 같이 걷고, 갱신 때는 안 쓰는 것만 걷는다 */
const ownedImages = new WeakMap<mapboxgl.Map, Set<string>>()

function ownedImagesOf(map: mapboxgl.Map): Set<string> {
  let owned = ownedImages.get(map)
  if (!owned) {
    owned = new Set()
    ownedImages.set(map, owned)
  }
  return owned
}

function baseSpriteFilter(clustered: boolean): mapboxgl.Expression {
  const hasImage: mapboxgl.Expression = ['!=', ['get', 'imageId'], '']
  if (!clustered) return hasImage
  return ['all', hasImage, ['!', ['has', 'point_count']]]
}

function addClusterLayers(map: mapboxgl.Map, cluster: MapClusterOptions): void {
  const color = cluster.color ?? DEFAULT_COLOR
  if (map.getLayer(CLUSTER_CIRCLE_LAYER_ID)) map.removeLayer(CLUSTER_CIRCLE_LAYER_ID)
  if (map.getLayer(CLUSTER_COUNT_LAYER_ID)) map.removeLayer(CLUSTER_COUNT_LAYER_ID)

  map.addLayer({
    id: CLUSTER_CIRCLE_LAYER_ID,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': color,
      'circle-opacity': 0.92,
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      // 건수에 따라 원 크기를 키운다 (10건 미만 16 → 100건 이상 30)
      'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 16, 10, 21, 100, 30],
    },
  })

  map.addLayer({
    id: CLUSTER_COUNT_LAYER_ID,
    type: 'symbol',
    source: SOURCE_ID,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 13,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': '#ffffff' },
  })
}

function bindInteractions(
  map: mapboxgl.Map,
  markers: MapMarker[],
  handlers: MarkerLayerHandlers,
  cluster?: MapClusterOptions,
): () => void {
  // useMarkers가 전달하는 handlers는 stable wrapper이므로
  // 구조분해해도 스테일 클로저가 발생하지 않는다. (useMarkers.ts 주석 참고)
  const {
    onMarkerClick,
    onActiveMarkerChange,
    onPopupOpen,
    onPopupClose,
    onActiveMarkerMount,
    onActiveMarkerUnmount,
    onMarkerHover,
  } = handlers
  let disposed = false
  let hoveredId: string | null = null

  // popup이 필요한 마커가 하나라도 있을 때만 Mapbox Popup 객체를 생성한다.
  // 모두 popup이 없으면(예: 외부에서 별도 플로팅 UI로 처리) 빈 popup DOM이 깜빡이는 현상을 방지.
  const popupsEnabled = markers.some((m) => m.popup != null)

  // 외부에서 "선택된 마커 위치"에 React portal로 그래픽을 붙이고 싶을 때 주입하는 hook.
  // (예: FloatingBounce로 감싼 마커 아이콘)
  const hasExternalActiveRender = onActiveMarkerMount != null

  // float marker(DOM 오버레이) 자체는 popup 탐이 필요한 경우 또는
  // 외부 렌더 슬롯이 제공된 경우 모두에서 필요하다.
  const floatMarkerEnabled = popupsEnabled || hasExternalActiveRender

  const baseFilter = baseSpriteFilter(cluster != null)
  const setSpriteFilter = (excludeId: string | null) => {
    if (disposed) return
    try {
      const layer = map.getLayer(SPRITE_LAYER_ID)
      if (layer && layer.type === 'symbol') {
        map.setFilter(
          SPRITE_LAYER_ID,
          excludeId ? ['all', baseFilter, ['!=', ['get', 'id'], excludeId]] : baseFilter,
        )
        // setFilter는 mapbox 내부 render loop에서 "다음 프레임"에 반영되므로,
        // 즉시 repaint를 요청해 스프라이트 숨김 타이밍을
        // FloatingBounce(외부 DOM) 마운트 프레임과 정렬한다.
        map.triggerRepaint()
      }
    } catch {
      // 레이어 제거 후 호출될 때 무시 (race condition)
    }
  }

  let popup: mapboxgl.Popup | null = null
  let floatMarker: mapboxgl.Marker | null = null
  let lastClickRevision = 0
  let isReplacingPopup = false

  const cleanupFloatMarker = () => {
    if (floatMarker) {
      floatMarker.remove()
      floatMarker = null
      if (hasExternalActiveRender) onActiveMarkerUnmount?.()
    }
  }

  const clearSelection = () => {
    if (popup) popup.remove()
    popup = null
    cleanupFloatMarker()
    setSpriteFilter(null)
  }

  const handleClick = (e: mapboxgl.MapMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, { layers: [SPRITE_LAYER_ID] })
    if (features.length === 0) {
      clearSelection()
      onActiveMarkerChange?.(null)
      return
    }
    const feat = features[0]
    const id = feat?.properties?.id as string
    const [lng, lat] = (feat?.geometry as GeoJSON.Point).coordinates

    // Popup 처리 — popup 컨텐츠가 있는 마커 집합에서만 생성 (빈 popup DOM 깜빡임 방지)
    if (popupsEnabled) {
      const placeholder = document.createElement('div')
      placeholder.className = 'mapbox-popup-inner'

      isReplacingPopup = true
      if (popup) popup.remove()
      isReplacingPopup = false

      const markerPoint = map.project([lng, lat])
      const containerWidth = map.getContainer().clientWidth
      const isNearRightEdge = markerPoint.x > containerWidth * 0.6
      const anchor = isNearRightEdge ? 'right' : 'left'
      const offset: [number, number] = isNearRightEdge ? [-20, 0] : [20, 0]

      popup = new mapboxgl.Popup({
        closeButton: false,
        anchor,
        offset,
        maxWidth: 'none',
        className: 'mapbox-popup-default',
      })
        .setLngLat([lng, lat])
        .setDOMContent(placeholder)

      if (onPopupOpen) {
        popup.once('open', () => onPopupOpen(placeholder, { markerId: id }))
      }

      const thisPopup = popup
      thisPopup.once('close', () => {
        if (isReplacingPopup) return
        if (popup === thisPopup) popup = null
        cleanupFloatMarker()
        setSpriteFilter(null)
        onPopupClose?.()
        onActiveMarkerChange?.(null)
      })

      popup.addTo(map)
    }

    // popup이 있거나 외부 renderActiveMarker 슬롯이 주입된 경우에만
    // sprite filter + float marker 스왑을 수행한다.
    // popup도 없고 외부 렌더도 없으면 sprite 위치가 그대로 유지되어
    // 외부 UI(예: 플로팅 카드)가 부드럽게 연동된다.
    if (floatMarkerEnabled) {
      const marker = markers.find((m) => m.id === id)
      if (marker) {
        const clickRevision = ++lastClickRevision

        if (hasExternalActiveRender) {
          // 외부(React portal) 렌더 경로: Canvas 이미지 없이 빈 컨테이너만 띄우고
          // onActiveMarkerMount 콜백으로 element를 소비자에게 넘긴다.
          if (disposed || clickRevision !== lastClickRevision) return
          const el = document.createElement('div')
          el.style.pointerEvents = 'none'

          const newFloat = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(map)

          // 이전 float 마커 정리 (unmount 콜백 포함)
          if (floatMarker) {
            floatMarker.remove()
            floatMarker = null
            onActiveMarkerUnmount?.()
          }
          floatMarker = newFloat
          setSpriteFilter(id)
          onActiveMarkerMount?.(el, { markerId: id })
        } else {
          // 기본(popup) 경로: Canvas 이미지로 float 마커를 만들고 CSS float 애니메이션.
          const badge = resolveBadge(
            marker,
            markers.findIndex((x) => x.id === id),
          )
          createMarkerIconDataUrl({
            number: badge,
            label: marker.label,
            color: marker.color ?? DEFAULT_COLOR,
            variant: marker.variant,
            active: marker.active,
            ...(marker.dial ? { dial: marker.dial } : {}),
          }).then(({ dataUrl, displayWidth, displayHeight }) => {
            if (disposed || clickRevision !== lastClickRevision) return
            const img = document.createElement('img')
            img.src = dataUrl
            img.style.width = `${displayWidth}px`
            img.style.height = `${displayHeight}px`
            img.style.display = 'block'
            img.style.pointerEvents = 'none'
            img.classList.add('mapbox-marker-float')
            const el = document.createElement('div')
            el.appendChild(img)
            el.style.pointerEvents = 'none'

            const newFloat = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([lng, lat])
              .addTo(map)

            if (floatMarker) floatMarker.remove()
            floatMarker = newFloat
            setSpriteFilter(id)
          })
        }
      }
    }

    onMarkerClick?.(id)
    onActiveMarkerChange?.(id)
  }

  const handleMouseEnter = () => {
    map.getCanvas().style.cursor = 'pointer'
  }
  const handleMouseLeave = () => {
    map.getCanvas().style.cursor = ''
  }
  const handleHoverMove = (
    e: mapboxgl.MapMouseEvent & { features?: mapboxgl.GeoJSONFeature[] },
  ) => {
    const id = (e.features?.[0]?.properties?.id as string | undefined) ?? null
    if (id === hoveredId) return
    hoveredId = id
    onMarkerHover?.(id)
  }
  const handleHoverLeave = () => {
    if (hoveredId == null) return
    hoveredId = null
    onMarkerHover?.(null)
  }

  /** 클러스터 클릭 → 그 클러스터가 풀리는 줌까지 확대 */
  const handleClusterClick = (e: mapboxgl.MapMouseEvent) => {
    const feature = map.queryRenderedFeatures(e.point, {
      layers: [CLUSTER_CIRCLE_LAYER_ID],
    })[0]
    const clusterId = feature?.properties?.cluster_id
    if (clusterId == null) return
    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
    source.getClusterExpansionZoom(Number(clusterId), (err, zoom) => {
      if (err || disposed || zoom == null) return
      map.easeTo({
        center: (feature.geometry as GeoJSON.Point).coordinates as [number, number],
        zoom,
        duration: 400,
      })
    })
  }

  map.on('click', SPRITE_LAYER_ID, handleClick)
  map.on('mouseenter', SPRITE_LAYER_ID, handleMouseEnter)
  map.on('mouseleave', SPRITE_LAYER_ID, handleMouseLeave)
  map.on('mousemove', SPRITE_LAYER_ID, handleHoverMove)
  map.on('mouseleave', SPRITE_LAYER_ID, handleHoverLeave)

  const clusterEnabled = cluster != null
  const zoomOnClusterClick = cluster?.zoomOnClick ?? true
  if (clusterEnabled) {
    map.on('mouseenter', CLUSTER_CIRCLE_LAYER_ID, handleMouseEnter)
    map.on('mouseleave', CLUSTER_CIRCLE_LAYER_ID, handleMouseLeave)
    if (zoomOnClusterClick) map.on('click', CLUSTER_CIRCLE_LAYER_ID, handleClusterClick)
  }

  return () => {
    disposed = true
    map.off('click', SPRITE_LAYER_ID, handleClick)
    map.off('mouseenter', SPRITE_LAYER_ID, handleMouseEnter)
    map.off('mouseleave', SPRITE_LAYER_ID, handleMouseLeave)
    map.off('mousemove', SPRITE_LAYER_ID, handleHoverMove)
    map.off('mouseleave', SPRITE_LAYER_ID, handleHoverLeave)
    if (clusterEnabled) {
      map.off('mouseenter', CLUSTER_CIRCLE_LAYER_ID, handleMouseEnter)
      map.off('mouseleave', CLUSTER_CIRCLE_LAYER_ID, handleMouseLeave)
      if (zoomOnClusterClick) map.off('click', CLUSTER_CIRCLE_LAYER_ID, handleClusterClick)
    }
    if (popup) popup.remove()
    if (floatMarker) {
      floatMarker.remove()
      floatMarker = null
      if (hasExternalActiveRender) onActiveMarkerUnmount?.()
    }
    // 레이어·그림은 여기서 걷지 않는다 — 다음 갱신이 제자리에서 바꾼다. 다 걷는 것은
    // 마커가 없어지거나 지도가 내려갈 때의 removeMarkerLayers 몫이다.
  }
}

export function removeMarkerLayers(map: mapboxgl.Map, imageIds: string[] = []): void {
  try {
    removeLayersAndSource(map)
    const owned = ownedImages.get(map)
    new Set([...imageIds, ...(owned ?? [])]).forEach((id) => {
      if (map.hasImage(id)) map.removeImage(id)
    })
    ownedImages.delete(map)
  } catch {
    // map이 이미 제거된 경우 무시
  }
}

function removeLayersAndSource(map: mapboxgl.Map): void {
  ;[CLUSTER_COUNT_LAYER_ID, CLUSTER_CIRCLE_LAYER_ID, SPRITE_LAYER_ID].forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  })
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
  clusterSourceEnabled.delete(map)
}
