'use client'

import mapboxgl from 'mapbox-gl'
import { useEffect, useRef, useState } from 'react'

import 'mapbox-gl/dist/mapbox-gl.css'
import { validateLngLat } from '../lib/validation'
import { resolveStyleUrl, useMapConfig } from '../MapProvider'

import type { LngLat, MapTheme } from '../types/mapbox.types'
import type React from 'react'

interface UseMapboxMapOptions {
  container: React.RefObject<HTMLDivElement | null>
  center: LngLat | undefined
  zoom: number
  /**
   * 호출부가 **명시적으로 지정한** 카메라 위치(`camera.center`). 이것이 바뀌면 그 자리로 날아간다.
   *
   * `center` 와 갈라 둔 이유가 이 훅의 존재 이유다. `center` 는 호출부가 좌표를 안 주면
   * `markers[0]` 로 떨어지는 **초기값**이라, 그것을 따라 날면 데이터가 갱신될 때마다
   * (실시간 목록에서 첫 마커가 바뀔 때마다) 카메라가 명령받은 적 없는 이동을 한다.
   */
  followCenter?: LngLat
  theme?: MapTheme
  /** 테마별 기본 style URL을 덮어쓸 때 사용 */
  styleUrl?: string
}

/**
 * Mapbox 지도 인스턴스 초기화 hook.
 *
 * - accessToken은 `MapProvider`에서 가져온다. Provider가 없으면 console.error.
 * - theme/styleUrl 이 바뀌면 map 인스턴스를 새로 만든다.
 * - `center`/`zoom` 은 **초기값**이다 — 값이 바뀌어도 지도를 다시 만들지 않는다.
 *   center 는 마커 데이터에서 파생되곤 하는데, 그때마다 재생성하면 줌 도중 지도가
 *   초기화될 뿐 아니라 같은 커밋의 레이어 훅들이 이미 제거된 인스턴스를 만져
 *   크래시한다. 이후 카메라 이동은 소비자의 fit 로직(`adjustMapBounds`)이 책임진다.
 */
export function useMapboxMap({
  container,
  center,
  zoom,
  followCenter,
  theme = 'light',
  styleUrl,
}: UseMapboxMapOptions) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const config = useMapConfig()

  // 초기값 전용 — effect 가 (재)실행되는 순간의 최신 값만 읽는다.
  const initialViewRef = useRef({ center, zoom })
  initialViewRef.current = { center, zoom }

  // 좌표가 무효→유효로 바뀌는 순간에는 재시도해야 하므로 유효성만 의존성에 둔다.
  const centerValid = validateLngLat(center)

  /**
   * 마운트 뒤에도 카메라는 **명령을 따라온다** — 명령일 때만.
   *
   * 예전에는 초기값만 읽어서, 보는 지점이 바뀌려면 지도를 통째로 다시 만들어야 했다 —
   * 화면이 깜빡이고 타일을 처음부터 다시 받는다. 그래서 값이 바뀌면 날아가게 했는데,
   * 그때 따라간 값이 `center` 였다. `center` 는 호출부가 좌표를 안 주면 `markers[0]` 로
   * 떨어진다. 상담지도처럼 목록이 실시간으로 갱신되는 화면에서는 첫 마커가 수시로 바뀌므로,
   * **사용자가 확대해 둔 지도가 갱신될 때마다 초기 배율로 되돌아갔다**(2026-09-17 보고).
   *
   * 그래서 따라가는 대상은 호출부가 실제로 지정한 `followCenter` 뿐이다. 지정이 없는 화면은
   * 이 효과가 아무 일도 하지 않고, 카메라는 fit 로직(`adjustMapBounds`)만 움직인다.
   * 첫 마운트에는 이미 그 자리에 있으므로 아무 일도 하지 않는다(아래 skip).
   */
  const lastView = useRef<{ lng: number; lat: number; zoom: number } | null>(null)
  useEffect(() => {
    if (map == null || !validateLngLat(followCenter)) {
      lastView.current = null
      return
    }
    const next = { lng: followCenter!.lng, lat: followCenter!.lat, zoom }
    const prev = lastView.current
    lastView.current = next
    if (prev == null) return
    if (prev.lng === next.lng && prev.lat === next.lat && prev.zoom === next.zoom) return
    map.flyTo({ center: [next.lng, next.lat], zoom: next.zoom, duration: 600, essential: true })
  }, [map, followCenter, zoom])

  useEffect(() => {
    if (!config.accessToken) {
      console.error(
        '[MapboxMap] accessToken이 설정되지 않았습니다. <MapProvider accessToken={...}>로 감싸주세요.',
      )
      return
    }
    mapboxgl.accessToken = config.accessToken

    if (!container.current) return

    const initial = initialViewRef.current
    if (!validateLngLat(initial.center)) {
      console.error('[MapboxMap] 유효하지 않은 좌표:', initial.center)
      return
    }

    const instance = new mapboxgl.Map({
      container: container.current,
      style: resolveStyleUrl(theme, config, styleUrl),
      center: [initial.center!.lng, initial.center!.lat],
      zoom: initial.zoom,
    })

    // 탭(Dockview) 안에서 컨테이너가 아직 레이아웃/페인트되기 전 지도가 초기화되면
    // 첫 프레임이 빈(회색) 캔버스로 그려지고 다시 그려지지 않는 Mapbox 특성이 있다.
    // load 직후 다음 프레임과 짧은 지연 후 resize 를 강제해 최종 컨테이너 크기로 재도색한다.
    const forceResize = () => instance.resize()
    let rafId = 0
    const resizeTimer = setTimeout(forceResize, 200)
    instance.on('load', () => {
      setIsLoaded(true)
      rafId = requestAnimationFrame(forceResize)
    })

    setMap(instance)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(resizeTimer)
      instance.remove()
      setMap(null)
      setIsLoaded(false)
    }
  }, [container, centerValid, theme, styleUrl, config])

  return {
    map,
    isLoaded,
  }
}
