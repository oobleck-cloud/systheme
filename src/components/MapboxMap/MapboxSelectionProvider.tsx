/**
 * MapboxSelectionProvider — `<MapboxMap />`의 "선택된 마커" 상태를 공유한다.
 *
 * `<MapboxMap />`은 자기 안에 selection state를 갖지만, FloatingCard처럼
 * 지도 외부에서 선택 마커를 읽거나 프로그래매틱하게 선택을 해제하고 싶을 때는
 * 이 Provider로 감싸고 `useMapboxSelection()`을 호출한다.
 *
 * @example
 * ```tsx
 * <MapProvider accessToken={TOKEN}>
 *   <MapboxSelectionProvider>
 *     <MapboxMap markers={markers} />
 *     <SelectedMarkerCard />
 *   </MapboxSelectionProvider>
 * </MapProvider>
 *
 * function SelectedMarkerCard() {
 *   const { selectedMarker, unselect } = useMapboxSelection();
 *   if (!selectedMarker) return null;
 *   return <Card onClose={unselect}>{selectedMarker.id}</Card>;
 * }
 * ```
 *
 * ## 모드
 * - **uncontrolled**: 어떤 prop도 주지 않으면 Provider가 내부 state로 selection을 관리한다.
 * - **controlled**: `selectedMarkerId` + `onSelectionChange`로 부모가 선택값을 직접 소유한다.
 *
 * ## 자동 동작 (MapboxMap이 처리)
 * - `markers`가 바뀌어 기존 선택 id가 사라지면 자동으로 `null`로 unselect.
 * - 지도 빈 영역 클릭 시 자동으로 unselect (소비자의 `onMapClick`은 추가 부수효과로 호출됨).
 *
 * ## MapboxMap의 `activeMarkerId` prop과의 우선순위
 * Provider가 있어도 `<MapboxMap activeMarkerId={...} />`로 prop을 주면 prop이 이긴다(legacy).
 * Provider만 있는 경우(권장): `selectedMarkerId`/`onSelectionChange`는 이 Provider에 전달한다.
 */
'use client'

import React from 'react'

import type { MapMarker } from './types/mapbox.types'

interface MapboxSelectionContextValue {
  selectedMarkerId: string | null
  selectedMarker: MapMarker | null
  select: (id: string | null) => void
  unselect: () => void
  /** @internal — `<MapboxMap />`이 markers 데이터를 등록해 selectedMarker 해석을 가능하게 한다. */
  __registerMarkers: (markers: MapMarker[]) => void
}

const MapboxSelectionContext = React.createContext<MapboxSelectionContextValue | null>(null)

export interface MapboxSelectionProviderProps {
  children: React.ReactNode
  /**
   * controlled 모드: 부모가 선택 id를 소유.
   * 미지정(undefined) 시 Provider가 내부 state로 관리.
   */
  selectedMarkerId?: string | null
  /** controlled 모드에서 선택이 변경될 때 호출 */
  onSelectionChange?: (id: string | null) => void
}

export function MapboxSelectionProvider({
  children,
  selectedMarkerId: controlledId,
  onSelectionChange,
}: MapboxSelectionProviderProps) {
  const isControlled = controlledId !== undefined
  const [internalId, setInternalId] = React.useState<string | null>(null)
  const selectedMarkerId = isControlled ? (controlledId ?? null) : internalId

  const [markers, setMarkers] = React.useState<MapMarker[]>([])

  const onSelectionChangeRef = React.useRef(onSelectionChange)
  React.useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange
  }, [onSelectionChange])

  const select = React.useCallback(
    (id: string | null) => {
      if (!isControlled) setInternalId(id)
      onSelectionChangeRef.current?.(id)
    },
    [isControlled],
  )

  const unselect = React.useCallback(() => {
    select(null)
  }, [select])

  const selectedMarker = React.useMemo(
    () => markers.find((m) => m.id === selectedMarkerId) ?? null,
    [markers, selectedMarkerId],
  )

  const value = React.useMemo<MapboxSelectionContextValue>(
    () => ({
      selectedMarkerId,
      selectedMarker,
      select,
      unselect,
      __registerMarkers: setMarkers,
    }),
    [selectedMarkerId, selectedMarker, select, unselect],
  )

  return <MapboxSelectionContext.Provider value={value}>{children}</MapboxSelectionContext.Provider>
}

/**
 * `<MapboxSelectionProvider>` 범위 안에서 호출. 선택된 마커를 읽고 프로그래매틱하게 변경한다.
 *
 * @throws Provider 바깥에서 호출되면 에러.
 */
export function useMapboxSelection(): {
  selectedMarker: MapMarker | null
  selectedMarkerId: string | null
  select: (id: string | null) => void
  unselect: () => void
} {
  const ctx = React.useContext(MapboxSelectionContext)
  if (!ctx) {
    throw new Error('[useMapboxSelection] <MapboxSelectionProvider> 안에서만 호출할 수 있습니다.')
  }
  return {
    selectedMarker: ctx.selectedMarker,
    selectedMarkerId: ctx.selectedMarkerId,
    select: ctx.select,
    unselect: ctx.unselect,
  }
}

/**
 * @internal `<MapboxMap />`이 자체 동기화에 사용. context가 없을 수 있으므로 nullable.
 */
export function useMapboxSelectionInternal(): MapboxSelectionContextValue | null {
  return React.useContext(MapboxSelectionContext)
}
