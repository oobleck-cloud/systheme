'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useVideoRecorder } from './useVideoRecorder'

import type { RecordedVideoInfo } from '@/utils/camera/types'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { useDismissOnEscape, useFocusTrap } from '@/primitives/anchorPopover'
import { Surface } from '@/primitives/surface'
import { formatDuration } from '@/utils/camera/formatDuration'
import { cn } from '@/utils/cn'

export type VideoRecorderProps = {
  /** 마운트 시 자동으로 카메라 권한 요청 (기본 true) */
  autoRequestPermission?: boolean
  /** 0.5x 광각 카메라 자동 선택 (기본 true) */
  preferUltraWide?: boolean
  /** 기본 facingMode (기본 'environment') */
  defaultFacingMode?: 'user' | 'environment'
  /** 값이 바뀌면 결과 blob/타이머를 동기 초기화 */
  resetKey?: string
  /** 비디오 영역 aspect 비율 (예: 9/16) */
  aspectRatio?: number
  /** 결과 영상 정보가 채워지거나 지워질 때 호출 */
  onChange?: (value: RecordedVideoInfo | null) => void
  /** 검토 화면 "사용" 버튼 클릭 시 호출 */
  onUseVideo?: (value: RecordedVideoInfo) => void
  /** 비동기 업로드 중 표기 */
  isUploading?: boolean
  /** 모드 전환 알림 */
  onModeChange?: (mode: 'idle' | 'recording' | 'paused' | 'completed') => void
  className?: string
}

export function VideoRecorder({
  autoRequestPermission = true,
  preferUltraWide = true,
  defaultFacingMode = 'environment',
  resetKey,
  aspectRatio,
  onChange,
  onUseVideo,
  isUploading,
  onModeChange,
  className,
}: VideoRecorderProps) {
  const r = useVideoRecorder({ preferUltraWide, defaultFacingMode, resetKey })

  const liveRef = useRef<HTMLVideoElement>(null)
  const playbackRef = useRef<HTMLVideoElement>(null)
  const permissionRef = useRef<HTMLDivElement>(null)

  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [playbackDuration, setPlaybackDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [permissionLayerVisible, setPermissionLayerVisible] = useState(false)

  // ── 자동 권한 요청 ───────────────────────────────────────────
  const triedRef = useRef(false)
  useEffect(() => {
    if (!autoRequestPermission) return
    if (triedRef.current) return
    if (r.permissionState !== 'idle') return
    triedRef.current = true
    void r.requestPermission()
  }, [autoRequestPermission, r])

  // ── 권한 거부 시 permission-layer 표시 ────────────────────────
  useEffect(() => {
    if (r.permissionState === 'denied') setPermissionLayerVisible(true)
  }, [r.permissionState])

  // ── live preview에 stream 연결 ───────────────────────────────
  useEffect(() => {
    const el = liveRef.current
    if (!el) return
    if (r.stream) {
      el.srcObject = r.stream
      el.play().catch(() => {})
    } else {
      el.srcObject = null
    }
    // r.recordedBlob을 포함: clearRecording 후 재마운트된 <video>에 srcObject 재연결
  }, [r.stream, r.recordedBlob])

  // ── Blob → object URL ────────────────────────────────────────
  useEffect(() => {
    if (!r.recordedBlob) {
      setRecordedUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setPlaybackDuration(0)
      setPlaybackTime(0)
      return
    }
    const url = URL.createObjectURL(r.recordedBlob)
    setRecordedUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [r.recordedBlob])

  // ── 결과 영상 자동 재생 ──────────────────────────────────────
  useEffect(() => {
    const el = playbackRef.current
    if (!el || !recordedUrl) return
    el.play().catch(() => {})
  }, [recordedUrl])

  // ── onChange 통지 ────────────────────────────────────────────
  const lastBlobRef = useRef<Blob | null>(null)
  useEffect(() => {
    if (lastBlobRef.current === r.recordedBlob) return
    lastBlobRef.current = r.recordedBlob
    if (!r.recordedBlob) {
      onChange?.(null)
      return
    }
    onChange?.({
      blob: r.recordedBlob,
      mimeType: r.recordedMimeType,
      durationSeconds: r.recordingTime,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.recordedBlob])

  // ── 모드 계산 ────────────────────────────────────────────────
  const mode = useMemo<'idle' | 'recording' | 'paused' | 'completed'>(() => {
    if (r.recordedBlob) return 'completed'
    if (r.recordingState === 'recording') return 'recording'
    if (r.recordingState === 'paused') return 'paused'
    return 'idle'
  }, [r.recordedBlob, r.recordingState])

  useEffect(() => {
    onModeChange?.(mode)
  }, [mode, onModeChange])

  // ── 핸들러 ───────────────────────────────────────────────────
  const handleStart = useCallback(() => r.startRecording(), [r])
  const handleStop = useCallback(() => r.stopRecording(), [r])
  const handleDiscard = useCallback(() => {
    r.clearRecording()
    setIsMuted(true)
  }, [r])
  const handleUseVideo = useCallback(() => {
    if (!r.recordedBlob) return
    onUseVideo?.({
      blob: r.recordedBlob,
      mimeType: r.recordedMimeType,
      durationSeconds: r.recordingTime,
    })
  }, [r.recordedBlob, r.recordedMimeType, r.recordingTime, onUseVideo])

  const showLive = mode !== 'completed'
  const showPlaceholder = showLive && (!r.stream || r.permissionState !== 'granted')

  const previewStyle = aspectRatio ? { '--vr-aspect': String(aspectRatio) } : undefined

  useFocusTrap(permissionRef, permissionLayerVisible)
  useDismissOnEscape(permissionLayerVisible, () => setPermissionLayerVisible(false))

  return (
    <Surface
      kind="section"
      density="compact"
      data-slot="video-recorder-root"
      className={cn(
        'relative [&_[data-slot=surface-body]]:flex [&_[data-slot=surface-body]]:flex-col [&_[data-slot=surface-body]]:gap-2',
        className,
      )}
    >
      {/* Permission layer — 권한 거부/재요청 시 표시 */}
      {permissionLayerVisible && (
        <div
          ref={permissionRef}
          data-slot="video-recorder-permission-layer"
          className="absolute inset-0 z-10 flex flex-col gap-2 rounded-lg bg-background/95 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="카메라 권한 요청"
        >
          <p data-slot="video-recorder-permission-message" className="text-sm text-fg">
            {r.error ?? '카메라와 마이크 접근 권한이 필요합니다.'}
          </p>
          <Stack direction="horizontal" gap={2} wrap>
            <Button
              type="button"
              size="sm"
              variant="primary"
              data-slot="video-recorder-retry-permission"
              onClick={() => {
                setPermissionLayerVisible(false)
                void r.requestPermission()
              }}
            >
              권한 재요청
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              data-slot="video-recorder-open-settings"
              onClick={() => {
                // 브라우저마다 설정 열기 방법이 다르므로 안내 메시지를 보여준다
                window.alert(
                  '브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭하여 카메라 권한을 허용해주세요.',
                )
              }}
            >
              설정 열기
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              data-slot="video-recorder-dismiss-permission"
              onClick={() => setPermissionLayerVisible(false)}
            >
              닫기
            </Button>
          </Stack>
        </div>
      )}

      {/* Preview area */}
      <div
        data-slot="video-recorder-preview"
        className="relative flex min-h-48 flex-1 items-center justify-center overflow-hidden rounded-md bg-muted"
        style={previewStyle as React.CSSProperties}
      >
        {/* Live camera feed */}
        {showLive && (
          <video
            ref={liveRef}
            playsInline
            muted
            autoPlay
            className={cn('h-full w-full object-cover', showPlaceholder && 'opacity-0')}
          />
        )}

        {/* Recorded playback */}
        {!showLive && recordedUrl && (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- 녹화된 클립은 외부 자막 없음
          <video
            ref={playbackRef}
            src={recordedUrl}
            playsInline
            autoPlay
            loop
            muted={isMuted}
            className="h-full w-full object-cover"
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration
              setPlaybackDuration(Number.isFinite(dur) ? dur : r.recordingTime)
            }}
            onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
          />
        )}

        {/* Camera loading / permission placeholder */}
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
                  onClick={() => setPermissionLayerVisible(true)}
                >
                  권한 설정
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

        {/* REC 배지 — recording 모드만 */}
        {mode === 'recording' && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-error-primary px-2 py-1">
            <span className="block size-2 rounded-full bg-fg-inverse" aria-hidden />
            <span className="text-xs font-semibold text-fg-inverse">REC</span>
          </div>
        )}

        {/* 음소거 토글 — completed 모드만 */}
        {mode === 'completed' && (
          <button
            type="button"
            aria-label={isMuted ? '소리 켜기' : '소리 끄기'}
            onClick={() => setIsMuted((v) => !v)}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-inverse/50 text-fg-inverse backdrop-blur-sm transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isMuted ? <MutedIcon /> : <UnmutedIcon />}
          </button>
        )}

        {/* 타임라인 — completed 모드만 */}
        {mode === 'completed' && playbackDuration > 0 && (
          <div className="absolute inset-x-6 top-4">
            <div className="relative h-1.5 cursor-pointer rounded-full bg-fg-inverse/20">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-fg-inverse/60"
                style={{ width: `${(playbackTime / playbackDuration) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between text-xs text-fg-inverse/80 tabular-nums">
              <span>{formatDuration(Math.floor(playbackTime))}</span>
              <span>{formatDuration(Math.floor(playbackDuration))}</span>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div data-slot="video-recorder-toolbar" className="px-2 pb-2">
        <Stack direction="horizontal" align="center" gap={2} wrap>
          <span
            data-slot="video-recorder-elapsed"
            className={cn(
              'font-mono text-sm tabular-nums',
              mode === 'recording' ? 'text-error-text' : 'text-fg-muted',
            )}
            aria-live="polite"
            aria-label={
              mode === 'recording' || mode === 'paused'
                ? `녹화 시간: ${formatDuration(r.recordingTime)}`
                : '녹화 대기 중'
            }
          >
            {mode === 'recording' || mode === 'paused' ? formatDuration(r.recordingTime) : '—'}
          </span>

          <Button
            type="button"
            size="sm"
            variant="primary"
            data-slot="video-recorder-start"
            disabled={mode !== 'idle' || !r.stream || r.permissionState !== 'granted'}
            onClick={handleStart}
          >
            녹화
          </Button>

          {/* 일시정지/재개 — 슬롯 없는 내부 전용 버튼 */}
          {(mode === 'recording' || mode === 'paused') && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={mode === 'recording' ? r.pauseRecording : r.resumeRecording}
            >
              {mode === 'recording' ? '일시정지' : '재개'}
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant={mode === 'completed' ? 'primary' : 'outline'}
            data-slot="video-recorder-stop"
            disabled={mode === 'idle'}
            onClick={mode === 'completed' ? handleUseVideo : handleStop}
          >
            {mode === 'completed' ? (isUploading ? '처리 중…' : '사용') : '중지'}
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="video-recorder-discard"
            onClick={handleDiscard}
          >
            {mode === 'completed' ? '다시찍기' : '삭제'}
          </Button>
        </Stack>
      </div>

      {/* Error banner */}
      <p
        data-slot="video-recorder-error-banner"
        className={cn('px-2 pb-2 text-xs', r.error ? 'text-error-text' : 'text-fg-muted')}
      >
        {r.error || '\u00A0'}
      </p>
    </Surface>
  )
}

VideoRecorder.displayName = 'VideoRecorder'

// ── 아이콘 ────────────────────────────────────────────────────

function MutedIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable={false}
    >
      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z" />
    </svg>
  )
}

function UnmutedIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable={false}
    >
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
    </svg>
  )
}
