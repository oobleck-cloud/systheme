'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Badge } from '@/components/Badge/Badge'
import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { Slider } from '@/components/Slider/Slider'
import { Switch } from '@/components/Switch/Switch'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

export type VideoPlayerProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onEnded' | 'children'
> & {
  /** 재생할 비디오 URL */
  src?: string
  /** 재생할 Blob (object URL 자동 생성) */
  blob?: Blob
  /** WebVTT 자막 파일 URL */
  captionsUrl?: string
  /** 마운트 시 자동 재생 */
  autoPlay?: boolean
  /** 로드 정책 — 'metadata' 면 첫 프레임까지만 받아 썸네일로 세운다 */
  preload?: 'none' | 'metadata' | 'auto'
  /** 반복 재생 */
  loop?: boolean
  /** 재생 완료 시 콜백 */
  onEnded?: () => void
  /** 첫 프레임을 그릴 수 있게 된 순간(loadeddata) — 썸네일 로딩 표시를 걷을 때 쓴다 */
  onReady?: () => void
  /** 뷰포트 위 오버레이 콘텐츠 */
  children?: React.ReactNode
  /** 뷰포트 비율 고정 — 세로 촬영본은 'portrait'. 기본은 비율을 잡지 않고 최소 높이만 준다 */
  aspect?: 'auto' | 'portrait' | 'video' | 'square'
  /**
   * 컨트롤 주체. 'native' 는 브라우저 기본 컨트롤(재생·일시정지·탐색·볼륨·전체화면·PiP)에 맡기고
   * DS 컨트롤 줄을 감춘다 — 좁은 자리에 끼우는 재생기는 이쪽이 낫다.
   */
  controls?: 'custom' | 'native'
  /** 'bare' 는 Surface 껍데기 없이 뷰포트만 — 카드 안에 끼워 넣는 썸네일/인라인 재생용 */
  frame?: 'surface' | 'bare'
}

const ASPECT_CLASS = {
  auto: 'min-h-48',
  portrait: 'aspect-[9/16]',
  video: 'aspect-video',
  square: 'aspect-square',
} as const

function fmt(t: number) {
  const s = Math.max(0, Math.floor(t))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

const VideoPlayer = forwardRef<HTMLDivElement, VideoPlayerProps>(
  (
    {
      className,
      src,
      blob,
      captionsUrl,
      autoPlay = false,
      preload,
      loop = false,
      onEnded,
      onReady,
      children,
      aspect = 'auto',
      controls = 'custom',
      frame = 'surface',
      ...props
    },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null)

    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [bufferedRatio, setBufferedRatio] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | undefined>()
    const [captionsOn, setCaptionsOn] = useState(false)
    const [objectUrl, setObjectUrl] = useState<string | null>(null)

    // ── Blob → object URL ────────────────────────────────────────
    useEffect(() => {
      if (!blob) {
        setObjectUrl(null)
        return
      }
      const url = URL.createObjectURL(blob)
      setObjectUrl(url)
      return () => URL.revokeObjectURL(url)
    }, [blob])

    const videoSrc = objectUrl ?? src

    // ── src 변경 시 상태 초기화 ───────────────────────────────────
    useEffect(() => {
      setCurrentTime(0)
      setDuration(0)
      setBufferedRatio(0)
      setIsPlaying(false)
      setErrorMessage(undefined)
    }, [videoSrc])

    // ── 자막 트랙 동기화 ─────────────────────────────────────────
    useEffect(() => {
      const el = videoRef.current
      if (!el) return
      const track = el.textTracks[0]
      if (track) {
        track.mode = captionsOn ? 'showing' : 'hidden'
      }
    }, [captionsOn])

    // ── 컨트롤 핸들러 ────────────────────────────────────────────
    const handlePlayToggle = useCallback((playing: boolean) => {
      const el = videoRef.current
      if (!el) return
      if (playing) el.play().catch(() => {})
      else el.pause()
    }, [])

    const handleSeek = useCallback((t: number) => {
      const el = videoRef.current
      if (!el) return
      el.currentTime = t
      setCurrentTime(t)
    }, [])

    const handleFullscreen = useCallback(() => {
      const el = videoRef.current
      if (!el) return
      el.requestFullscreen?.().catch(() => {})
    }, [])

    const handleViewportKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        const el = videoRef.current
        if (!el || !videoSrc) return

        if (e.key === ' ') {
          e.preventDefault()
          if (el.paused) el.play().catch(() => {})
          else el.pause()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          handleSeek(Math.max(0, el.currentTime - 5))
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          handleSeek(Math.min(el.duration || 0, el.currentTime + 5))
        }
      },
      [handleSeek, videoSrc],
    )

    const captionsAvailable = !!captionsUrl

    const viewport = (
      /* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- video viewport is a custom media widget; keyboard shortcuts require tabIndex */
      <div
        data-slot="video-player-viewport"
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={videoSrc ? 0 : undefined}
        aria-label="비디오 재생 영역"
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          ASPECT_CLASS[aspect],
        )}
        onKeyDown={handleViewportKeyDown}
      >
        {videoSrc ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- track은 captionsUrl prop으로 제공
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay={autoPlay}
            preload={preload}
            loop={loop}
            controls={controls === 'native'}
            playsInline
            className="max-h-full max-w-full object-contain"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false)
              onEnded?.()
            }}
            onLoadedData={() => onReady?.()}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              const dur = e.currentTarget.duration
              setDuration(Number.isFinite(dur) ? dur : 0)
              setErrorMessage(undefined)
            }}
            onProgress={(e) => {
              const vid = e.currentTarget
              const buf = vid.buffered
              if (buf.length > 0 && vid.duration > 0) {
                setBufferedRatio(buf.end(buf.length - 1) / vid.duration)
              }
            }}
            onError={() => setErrorMessage('동영상을 재생할 수 없습니다.')}
          >
            {captionsUrl && <track kind="subtitles" src={captionsUrl} default={captionsOn} />}
          </video>
        ) : (
          <p className="text-xs text-fg-muted">재생할 동영상이 없습니다.</p>
        )}
        {children}
        {frame === 'bare' && errorMessage && (
          <span
            data-slot="video-player-error"
            className="absolute inset-x-1 bottom-1 rounded-md bg-scrim px-1.5 py-0.5 text-xs text-fg-inverse"
          >
            {errorMessage}
          </span>
        )}
      </div>
    )

    // 껍데기 없이 뷰포트만 — 카드가 이미 자기 테두리를 갖고 있는 자리
    if (frame === 'bare') {
      return (
        <div
          ref={ref}
          data-slot="video-player-root"
          className={cn('min-w-0', className)}
          {...props}
        >
          {viewport}
        </div>
      )
    }

    return (
      <Surface
        ref={ref}
        kind="section"
        density="compact"
        data-slot="video-player-root"
        className={cn(
          '[&_[data-slot=surface-body]]:flex [&_[data-slot=surface-body]]:flex-col [&_[data-slot=surface-body]]:gap-2',
          className,
        )}
        {...props}
      >
        {viewport}

        {controls === 'custom' && (
          <>
            {/* Scrubber */}
            <div data-slot="video-player-scrubber">
              <Slider
                value={currentTime}
                min={0}
                max={Math.max(1, duration)}
                step={1}
                disabled={!videoSrc}
                label="탐색"
                onChange={handleSeek}
              />
            </div>

            {/* Controls */}
            <div data-slot="video-player-controls">
              <Stack direction="horizontal" align="center" gap={3} wrap>
                <span data-slot="video-player-play-toggle">
                  <Switch
                    checked={isPlaying}
                    disabled={!videoSrc}
                    aria-label="재생"
                    onCheckedChange={handlePlayToggle}
                  />
                </span>
                <span
                  data-slot="video-player-time-elapsed"
                  className="font-mono text-xs text-fg-muted tabular-nums"
                >
                  {fmt(currentTime)}
                </span>
                <span
                  data-slot="video-player-time-total"
                  className="font-mono text-xs text-fg-muted tabular-nums"
                >
                  {fmt(duration)}
                </span>
                <span data-slot="video-player-buffer-indicator">
                  <Badge variant="outline" size="sm">
                    {Math.round(bufferedRatio * 100)}% buf
                  </Badge>
                </span>
                <span data-slot="video-player-captions-toggle">
                  <Switch
                    checked={captionsOn}
                    disabled={!captionsAvailable}
                    aria-label="자막"
                    onCheckedChange={(v) => setCaptionsOn(v)}
                  />
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-slot="video-player-fullscreen"
                  disabled={!videoSrc}
                  onClick={handleFullscreen}
                >
                  Fullscreen
                </Button>
              </Stack>
            </div>
          </>
        )}

        {/* Error */}
        <p
          data-slot="video-player-error"
          className={cn('text-xs', errorMessage ? 'text-error-text' : 'text-fg-muted')}
        >
          {errorMessage || '\u00A0'}
        </p>
      </Surface>
    )
  },
)

VideoPlayer.displayName = 'VideoPlayer'

export { VideoPlayer }
