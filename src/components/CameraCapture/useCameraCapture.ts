'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  CameraDevice,
  PermissionState,
  UseCameraCaptureOptions,
  UseCameraCaptureResult,
} from '@/utils/camera/types'

import { toCameraDevices, pickUltraWideDeviceId } from '@/utils/camera/cameraUtils'
import { getUserMediaWithFallback, enumerateVideoDevices } from '@/utils/camera/getMediaAccess'

/**
 * 헤드리스 카메라 캡처 컨트롤러.
 *
 * 사용 예:
 * ```tsx
 * const r = useCameraCapture()
 * await r.requestPermission()
 * <video ref={r.videoRef} autoPlay playsInline muted />
 * <button onClick={async () => { const blob = await r.capture(); ... }}>촬영</button>
 * ```
 */
export function useCameraCapture(options: UseCameraCaptureOptions = {}): UseCameraCaptureResult {
  const { preferUltraWide = true, defaultFacingMode = 'environment' } = options

  const [permissionState, setPermissionState] = useState<PermissionState>('idle')
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // ── stream → video 연결 ─────────────────────────────────────

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    if (stream) {
      el.srcObject = stream
      el.play().catch(() => {})
    } else {
      el.srcObject = null
    }
  }, [stream])

  // ── 스트림 시작 ──────────────────────────────────────────────

  const startStream = useCallback(
    async (deviceId?: string | null): Promise<boolean> => {
      setIsLoading(true)
      setError(null)

      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null

      const videoConstraints: MediaTrackConstraints & Record<string, unknown> = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        videoStabilization: true,
      }

      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId }
      } else {
        videoConstraints.facingMode = { ideal: defaultFacingMode }
      }

      try {
        const mediaStream = await getUserMediaWithFallback({
          video: videoConstraints,
          audio: false,
        })

        streamRef.current = mediaStream
        setStream(mediaStream)

        const videoTrack = mediaStream.getVideoTracks()[0]
        const settings = videoTrack?.getSettings?.()
        if (settings?.deviceId) setCurrentDeviceId(settings.deviceId)
        return true
      } catch (err) {
        setError(resolveErrorMessage(err))
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [defaultFacingMode],
  )

  // ── 권한 요청 ────────────────────────────────────────────────

  const requestPermission = useCallback(async () => {
    if (permissionState === 'requesting') return
    setPermissionState('requesting')

    try {
      const tempStream = await getUserMediaWithFallback({
        video: { facingMode: { ideal: defaultFacingMode } },
        audio: false,
      })

      const rawDevices = await enumerateVideoDevices()
      const cameraList = toCameraDevices(rawDevices)
      setCameras(cameraList)

      const ultraWideId = preferUltraWide ? pickUltraWideDeviceId(cameraList) : null

      tempStream.getTracks().forEach((t) => t.stop())

      let streamOpened = false

      if (ultraWideId) {
        streamOpened = await startStream(ultraWideId)
      }

      if (!streamOpened) {
        streamOpened = await startStream(null)
      }

      setPermissionState('granted')
    } catch (err: unknown) {
      const name = err instanceof Error ? (err as DOMException).name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionState('denied')
      } else {
        setPermissionState('idle')
        setError(resolveErrorMessage(err))
      }
    }
  }, [permissionState, defaultFacingMode, preferUltraWide, startStream])

  // ── 카메라 선택 ──────────────────────────────────────────────

  const selectCamera = useCallback(
    async (deviceId: string) => {
      setCurrentDeviceId(deviceId)
      await startStream(deviceId)
    },
    [startStream],
  )

  // ── 캡처 ─────────────────────────────────────────────────────

  const capture = useCallback(
    async (format: 'jpeg' | 'png' | 'webp' = 'jpeg', quality = 0.92): Promise<Blob | null> => {
      const el = videoRef.current
      if (!el || !streamRef.current) return null

      const canvas = document.createElement('canvas')
      canvas.width = el.videoWidth || 640
      canvas.height = el.videoHeight || 480
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      ctx.drawImage(el, 0, 0)

      return new Promise((resolve) => {
        canvas.toBlob(resolve, `image/${format}`, quality)
      })
    },
    [],
  )

  // ── 언마운트 정리 ────────────────────────────────────────────

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return {
    permissionState,
    cameras,
    currentDeviceId,
    stream,
    error,
    isLoading,
    videoRef,
    requestPermission,
    selectCamera,
    capture,
  }
}

// ── 에러 메시지 변환 ─────────────────────────────────────────

function resolveErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return '알 수 없는 오류가 발생했습니다.'
  const name = (err as DOMException).name
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return '카메라 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return '카메라를 찾을 수 없습니다.'
    case 'NotReadableError':
    case 'TrackStartError':
      return '카메라가 다른 앱에서 사용 중입니다.'
    case 'OverconstrainedError':
      return '요청한 카메라 설정을 사용할 수 없습니다.'
    default:
      return err.message || '카메라에 접근할 수 없습니다.'
  }
}
