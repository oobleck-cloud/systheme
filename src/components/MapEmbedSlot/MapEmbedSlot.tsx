'use client'

import { forwardRef } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

/**
 * 지도 SDK를 `children`으로 임베딩하는 범용 래퍼 컴포넌트.
 *
 * 상태 배지(`Ready` / `Loading` / `Error`), 오류 메시지, 재중심 버튼, 저작권 표시를
 * 하단 컨트롤 바에 자동으로 표시합니다.
 *
 * > **네이밍 참고**: `Slot`은 DS anatomy의 슬롯이 아니라 "지도 SDK를 담는 매립 공간"을 뜻합니다.
 * > 향후 버전에서 `MapContainer`로 이름이 변경될 예정입니다.
 *
 * @example
 * ```tsx
 * <MapEmbedSlot isMapReady={mapReady} attributionText="© Mapbox">
 *   <div ref={mapRef} className="h-full w-full" />
 * </MapEmbedSlot>
 * ```
 */
export type MapEmbedSlotProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** `true`이면 로딩 배지를 `Ready`(녹색)로 전환합니다. */
  isMapReady: boolean
  /** 오류 메시지가 있으면 `Error` 배지와 함께 하단 바에 표시됩니다. */
  errorMessage?: string
  /** 지도 SDK 제공자 저작권 문자열 (예: "© Mapbox"). */
  attributionText?: string
  /** 재중심 버튼 클릭 시 호출됩니다. 미제공 시 버튼이 비활성화됩니다. */
  onRecenterRequest?: () => void
  /** 재시도 버튼 클릭 시 호출됩니다. 미제공 시 버튼이 비활성화됩니다. */
  onRetryLoad?: () => void
  /** 지도 SDK를 마운트할 `div` 등. `children`으로 전달합니다. */
  children?: React.ReactNode
}

const MapEmbedSlot = forwardRef<HTMLDivElement, MapEmbedSlotProps>(
  (
    {
      className,
      isMapReady,
      errorMessage,
      attributionText,
      onRecenterRequest,
      onRetryLoad,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        data-slot="map-embed-slot-root"
        className={cn(
          'relative flex min-h-48 w-full flex-col overflow-hidden rounded-lg border border-border',
          className,
        )}
        {...props}
      >
        <div data-slot="map-embed-slot-native-map" className="relative min-h-48 flex-1 bg-muted">
          {children}
        </div>
        <Stack
          direction="horizontal"
          align="center"
          justify="between"
          gap={2}
          wrap
          className="border-t border-border bg-background p-2"
        >
          <span data-slot="map-embed-slot-loading">
            <Badge variant={errorMessage ? 'error' : isMapReady ? 'success' : 'warning'} size="sm">
              {errorMessage ? 'Error' : isMapReady ? 'Ready' : 'Loading'}
            </Badge>
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            data-slot="map-embed-slot-recenter"
            disabled={!onRecenterRequest}
            onClick={onRecenterRequest}
          >
            Recenter
          </Button>
          <p
            data-slot="map-embed-slot-error"
            className={cn('text-xs', errorMessage ? 'text-error-text' : 'text-fg-muted')}
          >
            {errorMessage || '\u00A0'}
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="map-embed-slot-retry-load"
            disabled={!onRetryLoad}
            onClick={onRetryLoad}
          >
            Retry
          </Button>
          <span data-slot="map-embed-slot-attribution" className="text-xs text-fg-muted">
            {attributionText || '\u00A0'}
          </span>
        </Stack>
      </div>
    )
  },
)

MapEmbedSlot.displayName = 'MapEmbedSlot'

export { MapEmbedSlot }
