/**
 * getUserMedia 다중 폴백.
 *
 * 1. HTTPS/localhost 보안 컨텍스트 확인
 * 2. modern `navigator.mediaDevices.getUserMedia`
 * 3. 실패 시 advanced constraints(zoom 등) 제거 후 재시도
 * 4. legacy webkit/moz/ms getUserMedia 콜백 API
 */

function isSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

type LegacyGetUserMedia = (
  constraints: MediaStreamConstraints,
  success: (s: MediaStream) => void,
  error: (e: unknown) => void,
) => void

function getLegacyGetUserMedia(): LegacyGetUserMedia | null {
  if (typeof navigator === 'undefined') return null
  const nav = navigator as Navigator & {
    webkitGetUserMedia?: LegacyGetUserMedia
    mozGetUserMedia?: LegacyGetUserMedia
    msGetUserMedia?: LegacyGetUserMedia
  }
  return nav.webkitGetUserMedia ?? nav.mozGetUserMedia ?? nav.msGetUserMedia ?? null
}

/** videoStabilization, zoom 등 일부 브라우저에서 거부되는 고급 제약을 제거. */
function simplifyConstraints(constraints: MediaStreamConstraints): MediaStreamConstraints {
  if (!constraints.video || typeof constraints.video === 'boolean') return constraints

  const video = constraints.video as MediaTrackConstraints
  const simplified: MediaTrackConstraints = {}

  if ('facingMode' in video) simplified.facingMode = video.facingMode
  if ('deviceId' in video) simplified.deviceId = video.deviceId
  if ('width' in video) simplified.width = video.width
  if ('height' in video) simplified.height = video.height

  return { ...constraints, video: simplified }
}

export async function getUserMediaWithFallback(
  constraints: MediaStreamConstraints,
): Promise<MediaStream> {
  if (!isSecureContext()) {
    throw new Error('getUserMedia는 HTTPS 또는 localhost에서만 사용할 수 있습니다.')
  }

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      const simplified = simplifyConstraints(constraints)
      try {
        return await navigator.mediaDevices.getUserMedia(simplified)
      } catch {
        // legacy 경로로 떨어짐
      }
      throw err
    }
  }

  const legacyFn = getLegacyGetUserMedia()
  if (legacyFn) {
    return new Promise<MediaStream>((resolve, reject) => {
      legacyFn.call(navigator, constraints, resolve, reject)
    })
  }

  throw new Error('이 브라우저는 카메라 접근을 지원하지 않습니다.')
}

/** getUserMedia 후에 호출해야 label이 채워진다. */
export async function enumerateVideoDevices(): Promise<MediaDeviceInfo[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices.filter((d) => d.kind === 'videoinput')
}
