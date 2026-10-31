export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
}

export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false
  return /android/.test(window.navigator.userAgent.toLowerCase())
}

/**
 * 브라우저별 최적 MIME 타입.
 * - iOS Safari: video/mp4 (네이티브 MP4 녹화 가능)
 * - 그 외: video/webm 계열 (vp9 → vp8 → h264 → bare webm 순)
 */
export function getPreferredMimeType(): string {
  if (typeof window === 'undefined') return 'video/webm'

  if (
    isIOS() &&
    typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('video/mp4')
  ) {
    return 'video/mp4'
  }

  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=h264,opus',
    'video/webm',
  ]

  for (const type of candidates) {
    try {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        return type
      }
    } catch {
      // 다음 후보 시도
    }
  }

  return 'video/webm'
}

/** MIME 타입에서 파일 확장자 추출. 알 수 없으면 'webm' */
export function getFileExtension(mimeType: string): string {
  if (mimeType.includes('mp4')) return 'mp4'
  if (mimeType.includes('webm')) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  return 'webm'
}
