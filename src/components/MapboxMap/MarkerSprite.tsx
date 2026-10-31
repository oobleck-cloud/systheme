'use client'

/**
 * MarkerSprite — MapboxMap 스프라이트와 동일한 모양·폰트로 마커 아이콘을
 * React 컴포넌트로 렌더하는 얇은 래퍼.
 *
 * 지도 레이어가 아닌 DOM 위치(예: 플로팅 카드, 리스트 아이템 preview, 선택된
 * 마커를 React portal로 띄울 때)에서 "같은 생김새의 마커 뱃지"가 필요할 때
 * 사용한다. 내부적으로는 `createMarkerIconDataUrl`의 결과를 `<img>`로 렌더.
 *
 * ## 사용 예
 *
 * ```tsx
 * <MarkerSprite marker={m} />
 * ```
 *
 * ## 선택 마커 bounce (MapboxMap)
 *
 * ```tsx
 * <MapboxMap animateActiveMarker markers={markers} />
 * ```
 *
 * 커스텀 오버레이와 함께 쓸 때:
 *
 * ```tsx
 * <MapboxMap
 *   animateActiveMarker
 *   renderActiveMarker={(m) => <MarkerSprite marker={m} />}
 * />
 * ```
 */
import React, { useEffect, useState } from 'react'

import { createMarkerIconDataUrl, createMarkerIconDataUrlSync } from './lib/markerIcon'

import type { MapMarker } from './types/mapbox.types'

const DEFAULT_COLOR = '#055cf5'

export interface MarkerSpriteProps {
  /** 렌더할 마커 데이터. `badge` 우선, 없으면 `fallbackBadge` 또는 공백. */
  marker: Pick<MapMarker, 'badge' | 'label' | 'color' | 'variant' | 'active'>
  /** `marker.badge` 가 없을 때 표시할 문자열. 기본 '-'. */
  fallbackBadge?: string
  /** 아이콘 스케일(해상도 배수). 기본 2 (Retina). */
  scale?: number
  /** img 엘리먼트에 적용할 추가 style. */
  style?: React.CSSProperties
  className?: string
  'aria-label'?: string
}

interface IconState {
  dataUrl: string
  displayWidth: number
  displayHeight: number
}

/**
 * MapboxMap 마커 스프라이트와 100% 동일한 모양의 React 마커 아이콘.
 *
 * - **첫 렌더부터 `<img>` 를 내보낸다.** `createMarkerIconDataUrlSync`로 캐시된
 *   data URL을 `useState` lazy init에 즉시 넣어, 폰트 비동기 대기 없이 동기 렌더.
 * - 동기 렌더 당시 폰트가 아직 로드되기 전이면 fallback 폰트로 그려질 수 있으므로,
 *   `useEffect`에서 정식 경로(`createMarkerIconDataUrl`)로 한 번 재동기화한다.
 * - 이후 선택이 바뀌면 캐시 hit으로 역시 동기 갱신.
 */
export function MarkerSprite({
  marker,
  fallbackBadge = '-',
  scale = 2,
  style,
  className,
  'aria-label': ariaLabel,
}: MarkerSpriteProps) {
  const badge = marker.badge ?? fallbackBadge
  const color = marker.color ?? DEFAULT_COLOR
  const label = marker.label
  const variant = marker.variant
  const active = marker.active

  // 첫 렌더부터 이미지를 보이게 한다. canvas 그리기 + 캐시는 매우 빠르다 (sub-ms).
  const [icon, setIcon] = useState<IconState>(() => {
    const res = createMarkerIconDataUrlSync({ number: badge, label, color, variant, active }, scale)
    return {
      dataUrl: res.dataUrl,
      displayWidth: res.displayWidth,
      displayHeight: res.displayHeight,
    }
  })

  // marker가 바뀌면 캐시에서 즉시 꺼내 동기 업데이트.
  // 동일 값이면 setIcon이 얕은 비교로 no-op (동일 객체 참조 유지).
  useEffect(() => {
    const sync = createMarkerIconDataUrlSync(
      { number: badge, label, color, variant, active },
      scale,
    )
    setIcon((prev) =>
      prev.dataUrl === sync.dataUrl
        ? prev
        : {
            dataUrl: sync.dataUrl,
            displayWidth: sync.displayWidth,
            displayHeight: sync.displayHeight,
          },
    )

    // 폰트 로드 전 동기 렌더된 경우를 대비해, 정식 경로로 한 번 재동기화.
    let cancelled = false
    createMarkerIconDataUrl({ number: badge, label, color, variant, active }, scale).then((res) => {
      if (cancelled) return
      setIcon((prev) =>
        prev.dataUrl === res.dataUrl
          ? prev
          : {
              dataUrl: res.dataUrl,
              displayWidth: res.displayWidth,
              displayHeight: res.displayHeight,
            },
      )
    })
    return () => {
      cancelled = true
    }
  }, [badge, label, color, scale, variant, active])

  return (
    <img
      src={icon.dataUrl}
      width={icon.displayWidth}
      height={icon.displayHeight}
      alt={ariaLabel ?? `marker ${badge}`}
      className={className}
      style={{
        display: 'block',
        width: icon.displayWidth,
        height: icon.displayHeight,
        pointerEvents: 'none',
        userSelect: 'none',
        ...style,
      }}
      draggable={false}
    />
  )
}

MarkerSprite.displayName = 'MarkerSprite'
