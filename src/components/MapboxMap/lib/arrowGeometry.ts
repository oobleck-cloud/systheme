/**
 * 동선 도형을 화면 좌표(px)에서 만든다.
 *
 * 경위도만으로는 두 가지를 표현할 수 없다.
 * - **픽셀 오프셋**: 같은 좌표에 겹친 마커를 `pixelOffset` 으로 비켜 놓아도 선은 원래 좌표로 간다.
 * - **루프**: 한 좌표를 공유하는 방문들을 둘러앉히는 원. 반지름이 화면 px 라 줌과 무관하다.
 *
 * 둘 다 "화면에서 몇 px" 이라는 성질이라, project → 계산 → unproject 로 도형을 만든다.
 * 대신 줌이 바뀌면 결과가 달라지므로 그때마다 다시 만들어야 한다.
 */

/** 화면 좌표 한 점 */
export interface PixelPoint {
  x: number
  y: number
}

/** 원을 몇 조각으로 쪼개 근사할지 */
const CIRCLE_SEGMENTS = 64

/** 원 위 한 점. 각도는 deg, 0 = 오른쪽, 화면 기준 시계 방향 */
export function pointOnCircle(center: PixelPoint, radius: number, angleDeg: number): PixelPoint {
  const rad = (angleDeg * Math.PI) / 180
  return { x: center.x + radius * Math.cos(rad), y: center.y + radius * Math.sin(rad) }
}

/**
 * 닫힌 원의 둘레.
 *
 * 첫 점과 끝 점이 같아 선으로 그리면 이음매 없이 닫힌다.
 */
export function circlePath(center: PixelPoint, radius: number): PixelPoint[] {
  const points: PixelPoint[] = []
  for (let i = 0; i <= CIRCLE_SEGMENTS; i += 1) {
    points.push(pointOnCircle(center, radius, (360 * i) / CIRCLE_SEGMENTS))
  }
  return points
}

/** 두 끝점을 잇는 직선 경로 */
export function pixelPath(a: PixelPoint, b: PixelPoint): PixelPoint[] {
  return [a, b]
}

/**
 * 경로를 길이로 `count + 1` 등분한 내부 지점들.
 *
 * 끝점은 이미 역(마커)이 차지하므로 사이만 돌려준다 — 빈 슬롯 3개면 1/4, 2/4, 3/4 지점이다.
 */
export function pointsAlong(path: PixelPoint[], count: number): PixelPoint[] {
  if (count <= 0 || path.length < 2) return []

  const lengths: number[] = []
  let total = 0
  for (let i = 1; i < path.length; i += 1) {
    const prev = path[i - 1]!
    const cur = path[i]!
    const len = Math.hypot(cur.x - prev.x, cur.y - prev.y)
    lengths.push(len)
    total += len
  }
  if (total === 0) return []

  const out: PixelPoint[] = []
  for (let n = 1; n <= count; n += 1) {
    let remaining = (total * n) / (count + 1)
    for (let i = 0; i < lengths.length; i += 1) {
      const segment = lengths[i]!
      if (remaining > segment && i < lengths.length - 1) {
        remaining -= segment
        continue
      }
      const t = segment === 0 ? 0 : Math.min(remaining / segment, 1)
      const prev = path[i]!
      const cur = path[i + 1]!
      out.push({ x: prev.x + (cur.x - prev.x) * t, y: prev.y + (cur.y - prev.y) * t })
      break
    }
  }
  return out
}
