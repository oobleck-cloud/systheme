'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  CameraDevice,
  PermissionState,
  RecordingState,
  UseVideoRecorderOptions,
  UseVideoRecorderResult,
} from '@/utils/camera/types'

import { getPreferredMimeType } from '@/utils/camera/browserDetect'
import { toCameraDevices, pickUltraWideDeviceId } from '@/utils/camera/cameraUtils'
import { getUserMediaWithFallback, enumerateVideoDevices } from '@/utils/camera/getMediaAccess'
import { createMediaRecorder } from '@/utils/camera/mediaRecorder'

/**
 * 헤드리스 비디오 레코더 컨트롤러.
 *
 * 사용 예:
 * ```tsx
 * const r = useVideoRecorder()
 * await r.requestPermission()
 * <video ref={el => { if (el) el.srcObject = r.stream }} autoPlay playsInline muted />
 * ```
 */
export function useVideoRecorder(options: UseVideoRecorderOptions = {}): UseVideoRecorderResult {
  const { preferUltraWide = true, defaultFacingMode = 'environment', resetKey } = options

  const [permissionState, setPermissionState] = useState<PermissionState>('idle')
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive')
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedMimeType, setRecordedMimeType] = useState(getPreferredMimeType())
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [currentResetKey, setCurrentResetKey] = useState(resetKey)

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const pausedTimeRef = useRef<number>(0)
  // MediaRecorder.onstop 시점에 최신 mimeType을 참조하기 위한 ref
  const mimeTypeRef = useRef<string>(getPreferredMimeType())

  // resetKey 변경 시 동기 초기화 (렌더 중 setState → 즉시 재렌더, 잔상 방지)
  if (currentResetKey !== resetKey) {
    setCurrentResetKey(resetKey)
    setRecordedBlob(null)
    setRecordingTime(0)
    pausedTimeRef.current = 0
    chunksRef.current = []
  }

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
          audio: true,
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
        audio: true,
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

  // ── 타이머 ───────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedTimeRef.current
    timerRef.current = setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
      pausedTimeRef.current = Date.now() - startTimeRef.current
    }
  }, [])

  // ── 녹화 컨트롤 ──────────────────────────────────────────────

  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError('카메라 스트림이 준비되지 않았습니다.')
      return
    }
    if (recordingState !== 'inactive') return

    setError(null)
    chunksRef.current = []
    pausedTimeRef.current = 0
    setRecordingTime(0)
    setRecordedBlob(null)

    const mimeType = getPreferredMimeType()
    mimeTypeRef.current = mimeType
    setRecordedMimeType(mimeType)

    const recorder = createMediaRecorder(
      streamRef.current,
      (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data)
      },
      () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
        setRecordedBlob(blob)
        chunksRef.current = []
        stopTimer()
      },
      () => {
        setError('녹화 중 오류가 발생했습니다.')
        setRecordingState('inactive')
        stopTimer()
      },
    )

    recorder.start(1000)
    mediaRecorderRef.current = recorder
    setRecordingState('recording')
    startTimer()
  }, [recordingState, startTimer, stopTimer])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setRecordingState('paused')
      pauseTimer()
    }
  }, [pauseTimer])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setRecordingState('recording')
      startTimer()
    }
  }, [startTimer])

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
      setRecordingState('inactive')
      stopTimer()
    }
  }, [stopTimer])

  const clearRecording = useCallback(() => {
    setRecordedBlob(null)
    setRecordingTime(0)
    pausedTimeRef.current = 0
    chunksRef.current = []
  }, [])

  // ── 언마운트 정리 ────────────────────────────────────────────

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      stopTimer()
    }
  }, [stopTimer])

  return {
    permissionState,
    cameras,
    currentDeviceId,
    stream,
    recordingState,
    recordingTime,
    recordedBlob,
    recordedMimeType,
    error,
    isLoading,
    requestPermission,
    selectCamera,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
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
