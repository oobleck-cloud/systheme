/**
 * 선 위 빈 자리 표시의 "작은 시계" 스프라이트.
 *
 * 빈 자리 원 둘레에 그 칸의 시각 방향으로 쐐기(30분이면 15°)를 하나 내민다. 선 위에 점이 여럿
 * 늘어서도 쐐기 방향만 비교하면 어느 쪽이 이른지·몇 시쯤인지가 읽힌다 — 시각 글자를 상시로
 * 찍지 않고도 방문 마커의 시계판과 같은 말을 한다.
 *
 * 스프라이트는 **12시 방향(0°)에서 시작하는 쐐기**로 한 번만 굽고, 지도가 `icon-rotate` 로
 * 칸의 시작 각도만큼 돌린다. 그래서 그림 수는 (색 × 쐐기 폭)뿐이다.
 */
import { annularSectorPath, clockSweep } from './clockDial'

/** 빈 자리 원 반지름(px) — 시계가 없는 원과 같다 */
export const STOP_CLOCK_DOT_R = 5.5
/** 쐐기 바깥 반지름(px). 원 밖으로 6.5px 내민다 */
export const STOP_CLOCK_WEDGE_R = 12
/** 스프라이트 한 변(px). 쐐기 끝 + 여유 */
export const STOP_CLOCK_SIZE = 28
/** 2배로 구워 절반으로 그린다 */
const SCALE = 2

/** 같은 그림이면 같은 이미지 id — 지도 이미지 레지스트리에서 공유한다 */
export function stopClockImageId(color: string, minutes: number): string {
  return `stop-clock:${color}:${minutes}`
}

/** 스프라이트 좌표계(1배, 중심 기준)의 쐐기 경로. 12시에서 시계 방향으로 `minutes` 만큼 */
export function stopClockWedgePath(minutes: number): string {
  const c = STOP_CLOCK_SIZE / 2
  return annularSectorPath(c, c, 0, STOP_CLOCK_WEDGE_R, 0, clockSweep(minutes))
}

/**
 * 캔버스로 구운 스프라이트. `map.addImage(id, image, { pixelRatio: 2 })` 로 올린다.
 * 캔버스가 없는 환경(SSR·테스트)에서는 null.
 */
export function drawStopClockImage(color: string, minutes: number): ImageData | null {
  if (typeof document === 'undefined') return null
  const size = STOP_CLOCK_SIZE * SCALE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.scale(SCALE, SCALE)
  const c = STOP_CLOCK_SIZE / 2

  // 쐐기 — 흰 테두리를 둘러 지도 위 도로·선과 갈라 세운다.
  const wedge = new Path2D(stopClockWedgePath(minutes))
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke(wedge)
  ctx.fillStyle = color
  ctx.fill(wedge)

  // 빈 자리 원 — 흰 속 + 색 테두리. 시계 없는 표시와 같은 생김새다.
  ctx.beginPath()
  ctx.arc(c, c, STOP_CLOCK_DOT_R, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.stroke()

  return ctx.getImageData(0, 0, size, size)
}
