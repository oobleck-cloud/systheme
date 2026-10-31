/**
 * 12시간 시계판 위의 칸 — 각도·호·경로 계산.
 *
 * 마커 둘레에 "몇 시부터 몇 시까지"를 시계 바늘이 가리키는 자리 그대로 칠한다. 사람은 시계를
 * 각도로 읽는 데 익숙해서, 숫자를 적지 않아도 "위쪽이면 점심 무렵"이 바로 읽힌다.
 *
 * 그림(캔버스 스프라이트·SVG)은 모두 여기서 만든 숫자와 경로 문자열만 쓴다. 각도 계산이 두 벌이면
 * 지도 위 마커와 목록의 작은 시계가 서로 다른 시각을 가리키게 된다.
 *
 * 좌표계: 각도는 **12시 방향이 0°, 시계 방향**. 화면 좌표는 y 가 아래로 자란다.
 */

/** 시계판 칸 하나의 칠 — 의미는 소비자가 정하고 디자인시스템은 농도만 안다 */
export type MarkerDialTone = 'base' | 'soft' | 'strong' | 'warn'

/**
 * 마커 둘레에 두르는 시계판.
 *
 * 칸은 `startHour` 부터 `cellMinutes` 씩 시계 방향으로 이어진다. 12시간 시계라 8시와 20시는
 * 같은 자리다 — 08~20시를 30분 칸 24개로 주면 원 한 바퀴가 정확히 찬다.
 */
export interface MarkerDial {
  /** 첫 칸이 시작하는 시각(시, 0~24) */
  startHour: number
  /** 칸 하나의 길이(분) */
  cellMinutes: number
  /** 칸별 칠. 배열 길이가 칸 수다 */
  cells: readonly MarkerDialTone[]
}

/** 원 위 한 점 `[x, y]` (화면 좌표, y 아래로) */
export type DialPoint = readonly [number, number]

/** 시각(시, 소수 허용) → 시계 각도(°). 12시 = 0°, 3시 = 90°. 8시와 20시는 같은 240° */
export function clockAngle(hour: number): number {
  const onFace = ((hour % 12) + 12) % 12
  return (onFace / 12) * 360
}

/** 분 → 시계판 위 각도 폭(°). 30분 = 15° */
export function clockSweep(minutes: number): number {
  return (minutes / 720) * 360
}

/** 중심 `(cx, cy)` 에서 `angleDeg` 방향으로 `radius` 떨어진 점 */
export function polarPoint(cx: number, cy: number, radius: number, angleDeg: number): DialPoint {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)]
}

export interface DialCellArc {
  /** 칸이 칠해지기 시작하는 각도(°) — 틈 절반만큼 안쪽 */
  startDeg: number
  /** 칸이 끝나는 각도(°). `startDeg` 보다 크다(360 을 넘을 수 있다) */
  endDeg: number
}

/**
 * `index` 번째 칸의 호.
 *
 * 칸 사이에 `gapDeg` 만큼 틈을 둔다 — 양쪽 칸이 절반씩 내어 준다. 틈이 칸보다 넓으면 칸이
 * 사라지므로 칸 폭의 절반까지만 받는다.
 */
export function dialCellArc(
  dial: Pick<MarkerDial, 'startHour' | 'cellMinutes'>,
  index: number,
  gapDeg = 0,
): DialCellArc {
  const width = clockSweep(dial.cellMinutes)
  const gap = Math.min(Math.max(gapDeg, 0), width / 2)
  const start = clockAngle(dial.startHour + (index * dial.cellMinutes) / 60)
  return { startDeg: start + gap / 2, endDeg: start + width - gap / 2 }
}

function fmt(value: number): string {
  // 경로 문자열이 길어지지 않게 소수 둘째 자리까지. -0 은 0 으로.
  const rounded = Math.round(value * 100) / 100
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

/**
 * 고리 조각(도넛의 한 칸) SVG 경로.
 *
 * `innerR` 이 0 이면 중심에서 뻗는 부채꼴이 된다. 캔버스는 `new Path2D(path)` 로 같은 문자열을
 * 그대로 그린다 — 경로를 두 벌로 만들지 않는다.
 */
export function annularSectorPath(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const sweep = endDeg - startDeg
  if (!(sweep > 0) || !(outerR > innerR)) return ''
  // 한 바퀴를 통째로 그리면 시작점과 끝점이 같아 호가 사라진다 — 살짝 덜 돈다.
  const end = sweep >= 360 ? startDeg + 359.99 : endDeg
  const large = end - startDeg > 180 ? 1 : 0
  const [ox0, oy0] = polarPoint(cx, cy, outerR, startDeg)
  const [ox1, oy1] = polarPoint(cx, cy, outerR, end)
  const outer = `M${fmt(ox0)} ${fmt(oy0)}A${fmt(outerR)} ${fmt(outerR)} 0 ${large} 1 ${fmt(ox1)} ${fmt(oy1)}`
  if (innerR <= 0) return `${outer}L${fmt(cx)} ${fmt(cy)}Z`
  const [ix1, iy1] = polarPoint(cx, cy, innerR, end)
  const [ix0, iy0] = polarPoint(cx, cy, innerR, startDeg)
  return `${outer}L${fmt(ix1)} ${fmt(iy1)}A${fmt(innerR)} ${fmt(innerR)} 0 ${large} 0 ${fmt(ix0)} ${fmt(iy0)}Z`
}

export interface DialSegment {
  index: number
  tone: MarkerDialTone
  path: string
}

/** 시계판 전체를 칸별 경로로 편다. 그리는 쪽은 톤만 색으로 바꾸면 된다 */
export function dialSegments(
  dial: MarkerDial,
  geometry: { cx: number; cy: number; innerR: number; outerR: number; gapDeg?: number },
): DialSegment[] {
  const { cx, cy, innerR, outerR, gapDeg = 0 } = geometry
  return dial.cells.map((tone, index) => {
    const arc = dialCellArc(dial, index, gapDeg)
    return {
      index,
      tone,
      path: annularSectorPath(cx, cy, innerR, outerR, arc.startDeg, arc.endDeg),
    }
  })
}

/** 스프라이트 캐시 키용 짧은 표기 — 같은 시계판이면 같은 문자열 */
export function dialKey(dial: MarkerDial | undefined): string {
  if (!dial) return ''
  const code: Record<MarkerDialTone, string> = { base: '.', soft: 'o', strong: '#', warn: '!' }
  return `${dial.startHour}/${dial.cellMinutes}/${dial.cells.map((tone) => code[tone]).join('')}`
}

/**
 * 시계판 칠. 캔버스 스프라이트는 oklch 토큰을 못 읽어 hex 로 둔다.
 * 바탕 회색은 zinc-200, 경고는 플래너 팔레트의 주황 두 색과 갈라지도록 한 단 밝은 주황.
 */
const DIAL_BASE_FILL = '#e4e4e7'
const DIAL_WARN_FILL = '#f08a24'
/** 연한 칸 = 같은 색을 흰 바탕 위에 이만큼만 */
const DIAL_SOFT_ALPHA = 0.3

/**
 * 톤 → 칠할 색과 불투명도. 마커 색(`color`)의 농도로 칠하고, 경고만 고정 주황이다.
 *
 * 지도 밖(목록의 가로 막대 등)에서 같은 시계판을 펴 그릴 때도 이 함수를 쓴다 — 색 규칙이
 * 두 벌이면 마커와 목록이 같은 칸을 다른 색으로 칠한다.
 */
export function dialToneStyle(
  tone: MarkerDialTone,
  color: string,
): { fill: string; alpha: number } {
  if (tone === 'strong') return { fill: color, alpha: 1 }
  if (tone === 'soft') return { fill: color, alpha: DIAL_SOFT_ALPHA }
  if (tone === 'warn') return { fill: DIAL_WARN_FILL, alpha: 1 }
  return { fill: DIAL_BASE_FILL, alpha: 1 }
}
