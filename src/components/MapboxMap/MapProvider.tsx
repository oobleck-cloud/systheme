'use client'

/**
 * MapProvider — MapboxMap 전역 설정 주입.
 *
 * Mapbox access token이나 style URL 같은 "앱 단위" 설정을 컴포넌트 외부로
 * 끌어올려, `<MapboxMap />`을 프롭 없이도 사용할 수 있게 한다.
 *
 * @example
 * ```tsx
 * <MapProvider accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}>
 *   <App />
 * </MapProvider>
 * ```
 */
import React from 'react'

export interface MapConfig {
  /** Mapbox access token. 필수. */
  accessToken: string
  /**
   * 테마별 기본 style URL을 오버라이드. 지정하지 않으면 `mapbox://styles/mapbox/streets-v12`(light)
   * 와 `mapbox://styles/mapbox/dark-v11`(dark)이 사용된다.
   */
  styleUrls?: {
    light: string
    dark: string
  }
}

const DEFAULT_STYLE_URLS = {
  light: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
} as const

const MapConfigContext = React.createContext<MapConfig | null>(null)

export interface MapProviderProps extends MapConfig {
  children: React.ReactNode
}

export function MapProvider({ accessToken, styleUrls, children }: MapProviderProps) {
  const value = React.useMemo<MapConfig>(
    () => ({ accessToken, styleUrls }),
    [accessToken, styleUrls?.light, styleUrls?.dark],
  )
  return <MapConfigContext.Provider value={value}>{children}</MapConfigContext.Provider>
}

/**
 * `MapProvider` 범위 안에서 주입된 설정을 읽는다.
 * Provider가 없으면 빈 accessToken으로 돌아와, 개별 소비자가 fallback을
 * 감지해 경고를 띄울 수 있다.
 */
export function useMapConfig(): MapConfig {
  return React.useContext(MapConfigContext) ?? { accessToken: '' }
}

/** 현재 테마에 맞는 style URL을 반환 (컴포넌트 prop이 우선). */
export function resolveStyleUrl(
  theme: 'light' | 'dark',
  config: MapConfig,
  override?: string,
): string {
  if (override) return override
  return config.styleUrls?.[theme] ?? DEFAULT_STYLE_URLS[theme]
}
