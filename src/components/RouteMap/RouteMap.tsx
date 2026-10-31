'use client'

import { useEffect, useRef } from 'react'

import { cn } from '@/utils/cn'

/**
 * 지리 좌표를 나타내는 DTO.
 * `address`는 스크린리더 접근성 레이블 등에 활용합니다.
 */
export type GeoPoint = {
  lat: number
  lng: number
  /** 사람이 읽을 수 있는 주소 (aria-label 등에 활용) */
  address?: string
}

/**
 * `RouteMap` 컴포넌트 props.
 *
 * Mapbox를 사용하는 경우 `@oobleck/systheme`의 `MapboxMap`을 대신 사용하세요.
 * `RouteMap`은 특정 지도 SDK에 종속되지 않는 범용 경로 시각화 쉘입니다.
 */
export type RouteMapProps = {
  /** 출발지 좌표 */
  origin: GeoPoint
  /** 목적지 좌표 */
  destination: GeoPoint
  /**
   * 경로 거리 표시 문자열 (예: "32 km").
   * 외부에서 계산해 전달하거나 생략하면 거리 배지를 숨긴다.
   */
  distance?: string | null
  className?: string
  /**
   * map-canvas `div`가 DOM에 마운트될 때 호출됩니다.
   * 카카오맵·네이버지도·Google Maps 등 임의의 지도 SDK 초기화 코드를 여기서 실행하세요.
   * 반환 함수는 언마운트 시 정리(cleanup)에 사용됩니다.
   *
   * @param container - SDK를 마운트할 `HTMLDivElement`
   * @returns 선택적 cleanup 함수 (지도 인스턴스 소멸·이벤트 해제 등)
   *
   * @example
   * ```tsx
   * <RouteMap
   *   origin={{ lat: 37.56, lng: 126.97 }}
   *   destination={{ lat: 37.49, lng: 127.01 }}
   *   onMount={(el) => {
   *     const map = new kakao.maps.Map(el, { ... })
   *     // 경로 폴리라인, 마커 등 SDK 오버레이를 직접 제어
   *     return () => map.destroy?.()
   *   }}
   * />
   * ```
   */
  onMount?: (container: HTMLDivElement) => (() => void) | void
}

/**
 * 두 지점 사이의 경로를 시각화하는 지도 컴포넌트 쉘.
 *
 * `map-canvas`(`ref={canvasRef}`) 에 카카오맵/네이버지도/Google Maps 등의 SDK를
 * 마운트하여 실제 지도·경로 렌더링을 수행한다. SDK 초기화는 `onMount` 콜백에서 처리하며,
 * origin-marker / route-overlay / destination-marker 는 SDK 오버레이로 구현된다.
 *
 * data-slot 구조:
 *   route-map-root            → 전체 컨테이너
 *   route-map-map-canvas      → SDK mount div
 *   route-map-origin-marker   → 출발지 시맨틱 마커 (SDK 오버레이용 앵커)
 *   route-map-destination-marker → 목적지 시맨틱 마커
 *   route-map-route-overlay   → 경로 폴리라인 앵커
 *   route-map-distance-badge  → 거리 텍스트 오버레이
 */
function RouteMap({ origin, destination, distance, className, onMount }: RouteMapProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const cleanup = onMount?.(canvasRef.current)
    return () => {
      cleanup?.()
    }
  }, [onMount])

  return (
    <div data-slot="route-map-root" className={cn('relative overflow-hidden', className)}>
      {/* SDK 마운트 대상 — 지도 렌더링을 담당하는 서드파티 SDK가 채운다 */}
      <div ref={canvasRef} data-slot="route-map-map-canvas" className="h-full w-full" />

      {/*
       * 아래 세 요소는 DOM anchor 역할만 한다.
       * 실제 핀/폴리라인은 SDK 오버레이(onMount 콜백)로 렌더한다.
       * sr-only 처리로 스크린리더에 위치 정보를 전달한다.
       */}
      <span
        data-slot="route-map-origin-marker"
        aria-label={origin.address ?? '출발지'}
        className="sr-only"
      />
      <span
        data-slot="route-map-destination-marker"
        aria-label={destination.address ?? '목적지'}
        className="sr-only"
      />
      <span
        data-slot="route-map-route-overlay"
        aria-hidden
        className="pointer-events-none absolute inset-0"
      />

      {distance != null && (
        <div
          data-slot="route-map-distance-badge"
          className={cn(
            'absolute bottom-3 left-1/2 -translate-x-1/2',
            'rounded-full border border-border bg-background px-2.5 py-0.5',
            'text-xs font-medium text-fg shadow-sm',
          )}
        >
          {distance}
        </div>
      )}
    </div>
  )
}

export { RouteMap }
