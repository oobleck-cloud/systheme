export type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied'

export type RecordingState = 'inactive' | 'recording' | 'paused'

export interface CameraDevice {
  deviceId: string
  label: string
  facingMode?: 'user' | 'environment'
  zoomLevel?: number
}

export interface RecordedVideoInfo {
  blob: Blob
  mimeType: string
  durationSeconds: number
}

export interface UseVideoRecorderOptions {
  preferUltraWide?: boolean
  defaultFacingMode?: 'user' | 'environment'
  resetKey?: string
}

export interface UseVideoRecorderResult {
  permissionState: PermissionState
  cameras: CameraDevice[]
  currentDeviceId: string | null
  stream: MediaStream | null
  recordingState: RecordingState
  recordingTime: number
  recordedBlob: Blob | null
  recordedMimeType: string
  error: string | null
  isLoading: boolean
  requestPermission: () => Promise<void>
  selectCamera: (deviceId: string) => Promise<void>
  startRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => void
  clearRecording: () => void
}

export interface UseCameraCaptureOptions {
  preferUltraWide?: boolean
  defaultFacingMode?: 'user' | 'environment'
}

export interface UseCameraCaptureResult {
  permissionState: PermissionState
  cameras: CameraDevice[]
  currentDeviceId: string | null
  stream: MediaStream | null
  error: string | null
  isLoading: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  requestPermission: () => Promise<void>
  selectCamera: (deviceId: string) => Promise<void>
  capture: (format?: 'jpeg' | 'png' | 'webp', quality?: number) => Promise<Blob | null>
}
