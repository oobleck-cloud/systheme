import type { CameraDevice } from './types'

/** 디바이스 라벨에서 줌 레벨 추론. 0.5 = 광각, 1 = 메인, 2 = 망원. */
export function inferZoomFromLabel(label: string): number | undefined {
  const lower = label.toLowerCase()
  if (lower.includes('ultra') || lower.includes('광각') || lower.includes('0.5')) return 0.5
  if (
    lower.includes('telephoto') ||
    lower.includes('망원') ||
    lower.includes('2x') ||
    lower.includes('tele')
  ) {
    return 2
  }
  if (
    (lower.includes('wide') && !lower.includes('ultra')) ||
    lower.includes('main') ||
    lower.includes('back') ||
    lower.includes('rear') ||
    lower.includes('후면')
  ) {
    return 1
  }
  return undefined
}

export function inferFacingModeFromLabel(label: string): 'user' | 'environment' | undefined {
  const lower = label.toLowerCase()
  if (lower.includes('front') || lower.includes('전면')) return 'user'
  if (lower.includes('back') || lower.includes('rear') || lower.includes('후면')) {
    return 'environment'
  }
  return undefined
}

export function toCameraDevices(devices: MediaDeviceInfo[]): CameraDevice[] {
  return devices.map((d, i) => {
    const label = d.label || `카메라 ${i + 1}`
    return {
      deviceId: d.deviceId,
      label,
      facingMode: inferFacingModeFromLabel(label),
      zoomLevel: inferZoomFromLabel(label),
    }
  })
}

/** 0.5x 광각 카메라 deviceId 반환. 없으면 null. */
export function pickUltraWideDeviceId(cameras: CameraDevice[]): string | null {
  return cameras.find((c) => c.zoomLevel === 0.5)?.deviceId ?? null
}

/** 카메라 라벨을 한국어 표시명으로 정규화. */
export function formatCameraLabelForDisplay(camera: CameraDevice): string {
  const parts: string[] = []
  if (camera.facingMode === 'user') parts.push('전면')
  else if (camera.facingMode === 'environment') parts.push('후면')
  if (camera.zoomLevel === 0.5) parts.push('광각')
  else if (camera.zoomLevel === 1) parts.push('메인')
  else if (camera.zoomLevel === 2) parts.push('망원')
  if (parts.length > 0) return parts.join(' ')

  let label = camera.label
  label = label.replace(/\bfront\b/gi, '전면')
  label = label.replace(/\bback\b|\brear\b/gi, '후면')
  label = label.replace(/\bultra\s*wide\b|ultra-wide/gi, '광각')
  label = label.replace(/\bwide\b/gi, '와이드')
  label = label.replace(/\bmain\b/gi, '메인')
  label = label.replace(/\btelephoto\b|\btele\b/gi, '망원')
  label = label.replace(/\bcamera\b/gi, '카메라')
  return label.trim() || '카메라'
}
