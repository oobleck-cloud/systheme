'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useCameraCapture } from './useCameraCapture'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { Surface } from '@/primitives/surface'
import { formatCameraLabelForDisplay } from '@/utils/camera/cameraUtils'
import { cn } from '@/utils/cn'

export type CameraCaptureProps = {
  /** 마운트 시 자동으로 카메라 권한 요청 (기본 true) */
  autoRequestPermission?: boolean
  /** 0.5x 광각 카메라 자동 선택 (기본 true) */
  preferUltraWide?: boolean
  /** 기본 facingMode (기본 'environment') */
  defaultFacingMode?: 'user' | 'environment'
  /** 캡처 이미지 포맷 (기본 'jpeg') */
  captureFormat?: 'jpeg' | 'png' | 'webp'
  /** 캡처 품질 0–1 (기본 0.92) */
  captureQuality?: number
  /** 촬영 완료 시 호출. blob과 mimeType을 전달. */
  onCapture?: (blob: Blob, mimeType: string) => void
  className?: string
}

export function CameraCapture({
  autoRequestPermission = true,
  preferUltraWide = true,
  defaultFacingMode = 'environment',
  captureFormat = 'jpeg',
  captureQuality = 0.92,
  onCapture,
  className,
}: CameraCaptureProps) {
  const r = useCameraCapture({ preferUltraWide, defaultFacingMode })

  const [burstCount, setBurstCount] = useState(0)
  const [isShutterBusy, setIsShutterBusy] = useState(false)

  // ── 자동 권한 요청 ───────────────────────────────────────────
  const triedRef = useRef(false)
  useEffect(() => {
    if (!autoRequestPermission) return
    if (triedRef.current) return
    if (r.permissionState !== 'idle') return
    triedRef.current = true
    void r.requestPermission()
  }, [autoRequestPermission, r])

  const showPlaceholder = !r.stream || r.permissionState !== 'granted'

  // ── 카메라 전환 — 다음 카메라로 순환 ────────────────────────
  const handleSwitchCamera = useCallback(async () => {
    if (r.cameras.length < 2) return
    const currentIdx = r.cameras.findIndex((c) => c.deviceId === r.currentDeviceId)
    const nextCamera = r.cameras[(currentIdx + 1) % r.cameras.length]
    if (nextCamera) await r.selectCamera(nextCamera.deviceId)
  }, [r])

  // ── 셔터 ─────────────────────────────────────────────────────
  const handleShutter = useCallback(async () => {
    if (isShutterBusy) return
    setIsShutterBusy(true)
    try {
      const blob = await r.capture(captureFormat, captureQuality)
      if (blob) {
        setBurstCount((n) => n + 1)
        onCapture?.(blob, `image/${captureFormat}`)
      }
    } finally {
      setIsShutterBusy(false)
    }
  }, [isShutterBusy, r, captureFormat, captureQuality, onCapture])

  const canSwitch = r.cameras.length > 1
  const nextCameraLabel = (() => {
    if (!canSwitch) return undefined
    const currentIdx = r.cameras.findIndex((c) => c.deviceId === r.currentDeviceId)
    const next = r.cameras[(currentIdx + 1) % r.cameras.length]
    return next ? formatCameraLabelForDisplay(next) : undefined
  })()

  return (
    <Surface
      kind="section"
      density="compact"
      data-slot="camera-capture-root"
      className={cn(
        '[&_[data-slot=surface-body]]:flex [&_[data-slot=surface-body]]:flex-col [&_[data-slot=surface-body]]:gap-2',
        className,
      )}
    >
      {/* Preview area */}
      <div
        data-slot="camera-capture-preview"
        className="relative flex min-h-48 items-center justify-center overflow-hidden rounded-md bg-muted"
        aria-label="카메라 미리보기"
      >
        <video
          ref={r.videoRef}
          playsInline
          muted
          autoPlay
          className={cn('h-full w-full object-cover', showPlaceholder && 'opacity-0')}
        />

        {/* Permission / loading placeholder */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            {r.isLoading || r.permissionState === 'requesting' ? (
              <>
                <span
                  className="block size-8 animate-spin rounded-full border-2 border-border border-t-fg"
                  aria-hidden
                />
                <p className="text-xs text-fg-muted">카메라 준비 중</p>
              </>
            ) : r.permissionState === 'denied' ? (
              <>
                <p className="text-xs text-fg-muted">카메라 권한이 거부되었습니다.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void r.requestPermission()}
                >
                  권한 재요청
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-fg-muted">카메라를 시작하려면 권한을 허용해주세요.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void r.requestPermission()}
                >
                  카메라 시작
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls toolbar */}
      <Stack direction="horizontal" align="center" gap={2} wrap>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-slot="camera-capture-switch-camera"
          disabled={!canSwitch}
          title={nextCameraLabel ? `${nextCameraLabel}으로 전환` : '카메라 전환'}
          onClick={handleSwitchCamera}
        >
          카메라 전환
        </Button>
        <Button
          type="button"
          size="sm"
          variant="primary"
          data-slot="camera-capture-shutter"
          disabled={showPlaceholder || isShutterBusy}
          aria-busy={isShutterBusy}
          onClick={handleShutter}
        >
          {isShutterBusy ? '촬영 중…' : '촬영'}
        </Button>
        <span data-slot="camera-capture-burst-count" className="text-sm text-fg-muted">
          연속 ×{burstCount}
        </span>
      </Stack>

      {/* Error */}
      <p
        data-slot="camera-capture-error"
        className={cn('text-xs', r.error ? 'text-error-text' : 'text-fg-muted')}
      >
        {r.error || '\u00A0'}
      </p>
    </Surface>
  )
}

CameraCapture.displayName = 'CameraCapture'
