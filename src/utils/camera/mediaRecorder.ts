import { getPreferredMimeType, isIOS } from './browserDetect'

interface RecorderOptions {
  mimeType?: string
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
}

function getRecorderOptions(): RecorderOptions {
  const mimeType = getPreferredMimeType()

  if (isIOS()) {
    return { mimeType }
  }

  return {
    mimeType,
    videoBitsPerSecond: 2_500_000,
    audioBitsPerSecond: 128_000,
  }
}

/**
 * MediaRecorder 인스턴스 생성.
 * 옵션 적용 실패 시 옵션 없이 재시도해 호환성을 보장한다.
 */
export function createMediaRecorder(
  stream: MediaStream,
  onDataAvailable: (event: BlobEvent) => void,
  onStop?: () => void,
  onError?: (event: Event) => void,
): MediaRecorder {
  const options = getRecorderOptions()

  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, options)
  } catch {
    recorder = new MediaRecorder(stream)
  }

  recorder.ondataavailable = onDataAvailable
  if (onStop) recorder.onstop = onStop
  if (onError) recorder.onerror = onError

  return recorder
}
