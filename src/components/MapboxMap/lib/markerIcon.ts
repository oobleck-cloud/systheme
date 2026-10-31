/**
 * 스프라이트용 커스텀 마커 아이콘 생성 (Canvas 2D)
 * - 이름표 있음: 숫자 원 + 라벨 박스 + 꼬리 (배정된 경우)
 * - 이름표 없음: 숫자 원(지름 축소) + 꼬리만 (미배정)
 * - FontFace API로 Pretendard 로드 후 Canvas에 직접 그려 img src에서도 폰트 적용
 *   (SVG data URL 내 @font-face는 img 컨텍스트에서 브라우저가 무시함)
 */

import { PRETENDARD_BOLD_BASE64, PRETENDARD_REGULAR_BASE64 } from './markerIconFont'

// 이름표 있음 모드 (배정됨)
const W_WITH_LABEL = 56
const H_WITH_LABEL = 72
const CIRCLE_R_WITH_LABEL = 18
const BODY_W = 44
const BODY_H = 24

// 이름표 없음 모드 (미배정) - 흰 원 + 꼬리 (5점 폴리곤)
const W_NO_LABEL = 56
const H_NO_LABEL = 72

/**
 * 점(dot) 모드 (미배정 등) — 꼬리 없는 원.
 *
 * 7 이던 때는 지도 배경(도로·건물)에 묻혀 "회색 점이 안 보인다"는 보고가 났다(2026-09-23).
 * 모양은 그대로 두고 반지름만 키운다 — 점은 순번도 이름표도 없는 표현이라, 읽히게 만드는
 * 수단이 크기와 색 둘뿐이다.
 */
const DOT_R = 10

// 역(station) 모드 — 꼬리 없는 원. 좌표가 원의 중심이다.
const W_STATION = 56
const H_STATION = 56
const STATION_R = 15

/**
 * 핀 표현 변형.
 *
 * - `filled` — 기본. 색 채운 핀
 * - `hollow` — 흰 채움 + 색 테두리. "지금은 유효하지만 대체 예정인 원래 위치"
 * - `ghost` — 파선 테두리. "아직 저장되지 않은 새 위치"
 * - `dot` — 꼬리 없는 작은 원. 순번/이름표가 의미 없는 미배정 지점
 * - `station` — 꼬리 없는 원. 노선처럼 이어 그리는 화면에서 쓴다
 *
 * `station` 만 앵커가 원의 중심이다. 꼬리 있는 핀은 뾰족한 끝이 좌표를 가리키지만,
 * 선 위에 놓이는 역은 원의 중심이 좌표여야 선과 원이 어긋나지 않는다.
 */
export type MarkerVariant = 'filled' | 'hollow' | 'ghost' | 'dot' | 'station'

/** 이 변형은 좌표가 스프라이트의 중심인가 — 레이어 앵커 결정용 */
export function isCenterAnchored(variant: MarkerVariant | undefined): boolean {
  return variant === 'station'
}

export interface MarkerIconOptions {
  number: string
  label?: string
  color: string
  /** 기본값 `'filled'` */
  variant?: MarkerVariant
  /** 선택 상태 — 외곽 링을 덧그린다. `variant`와 조합 가능 */
  active?: boolean
}

interface Palette {
  bodyFill: string
  /** null이면 테두리 없음 (filled) */
  bodyStroke: string | null
  bodyDash: number[] | null
  badgeText: string
  labelText: string
}

function palette(variant: MarkerVariant, color: string): Palette {
  if (variant === 'hollow') {
    return {
      bodyFill: '#ffffff',
      bodyStroke: color,
      bodyDash: null,
      badgeText: color,
      labelText: color,
    }
  }
  if (variant === 'ghost') {
    return {
      bodyFill: '#ffffff',
      bodyStroke: color,
      bodyDash: [4, 3],
      badgeText: color,
      labelText: color,
    }
  }
  return {
    bodyFill: color,
    bodyStroke: null,
    bodyDash: null,
    badgeText: '#1a1a1a',
    labelText: '#ffffff',
  }
}

function hasLabel(label?: string): boolean {
  return (label ?? '').length > 0
}

function truncateLabel(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars - 1) + '…'
}

/** 뱃지/원 안 텍스트 폰트 사이즈: 2글자 이하 20, 3글자 이상 14 */
function getBadgeFontSize(text: string): number {
  return (text?.length ?? 0) <= 2 ? 20 : 14
}

/** 삼각형-사각형 겹침 픽셀 (틈 제거) */
const OVERLAP = 2

const FONT_FAMILY = 'Pretendard'

let fontLoadPromise: Promise<void> | null = null

function ensureFontsLoaded(): Promise<void> {
  if (fontLoadPromise) return fontLoadPromise
  if (typeof document === 'undefined') {
    fontLoadPromise = Promise.resolve()
    return fontLoadPromise
  }
  const boldUrl = `url(data:application/font-woff2;base64,${PRETENDARD_BOLD_BASE64}) format("woff2")`
  const regularUrl = `url(data:application/font-woff2;base64,${PRETENDARD_REGULAR_BASE64}) format("woff2")`
  const boldFont = new FontFace(FONT_FAMILY, boldUrl, { weight: '700' })
  const regularFont = new FontFace(FONT_FAMILY, regularUrl, { weight: '400' })
  fontLoadPromise = Promise.all([boldFont.load(), regularFont.load()]).then((fonts) => {
    // FontFaceSet.add()는 최신 DOM 타입에서 제공되므로 타입 단언으로 안전하게 호출
    fonts.forEach((f) => (document.fonts as FontFaceSet & { add(f: FontFace): void }).add(f))
  })
  return fontLoadPromise
}

/**
 * 선택 강조 링. 원 뒤에 반투명 링을 덧그린다.
 * 반경은 캔버스를 넘지 않도록 `+3px` 로 제한한다.
 */
function drawActiveRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  scale: number,
): void {
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, r + 3 * scale, 0, Math.PI * 2)
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 4 * scale
  ctx.stroke()
  ctx.restore()
}

/**
 * 이름표 핀의 외곽선을 한 경로로 그린다 (라벨 박스 + 꼬리 합집합).
 *
 * `hollow`/`ghost` 는 흰 채움 + 테두리라서, 박스와 꼬리를 따로 그리면
 * 이음선이 보인다. 합집합 경로로 그려야 테두리가 끊기지 않는다.
 */
function traceLabelPinOutline(
  ctx: CanvasRenderingContext2D,
  geom: {
    cx: number
    bodyLeft: number
    bodyRight: number
    bodyTop: number
    bodyBottom: number
    pointerBottom: number
    rx: number
    tailHalf: number
  },
): void {
  const { cx, bodyLeft, bodyRight, bodyTop, bodyBottom, pointerBottom, rx, tailHalf } = geom
  ctx.beginPath()
  ctx.moveTo(bodyLeft + rx, bodyTop)
  ctx.lineTo(bodyRight - rx, bodyTop)
  ctx.quadraticCurveTo(bodyRight, bodyTop, bodyRight, bodyTop + rx)
  ctx.lineTo(bodyRight, bodyBottom - rx)
  ctx.quadraticCurveTo(bodyRight, bodyBottom, bodyRight - rx, bodyBottom)
  ctx.lineTo(cx + tailHalf, bodyBottom)
  ctx.lineTo(cx, pointerBottom)
  ctx.lineTo(cx - tailHalf, bodyBottom)
  ctx.lineTo(bodyLeft + rx, bodyBottom)
  ctx.quadraticCurveTo(bodyLeft, bodyBottom, bodyLeft, bodyBottom - rx)
  ctx.lineTo(bodyLeft, bodyTop + rx)
  ctx.quadraticCurveTo(bodyLeft, bodyTop, bodyLeft + rx, bodyTop)
  ctx.closePath()
}

/**
 * 꼬리 없는 점 마커. 원의 아래쪽 끝이 캔버스 바닥(=좌표)에 닿는다.
 *
 * `icon-anchor: 'bottom'` 을 모든 variant가 공유하므로, 점도 좌표 위에
 * 접하도록 둔다. 줌 변화에 흔들리지 않는 대신 좌표에서 약 7px 위에 그려진다.
 */
function drawMarkerDot(
  ctx: CanvasRenderingContext2D,
  color: string,
  scale: number,
  active: boolean,
): void {
  const cx = (W_NO_LABEL / 2) * scale
  const r = DOT_R * scale
  const cy = H_NO_LABEL * scale - r - 1 * scale

  if (active) drawActiveRing(ctx, cx, cy, r, color, scale)

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2.5 * scale
  ctx.stroke()
}

/**
 * 역 원. 꼬리가 없고 캔버스 정중앙에 그린다 — 앵커가 `center` 이므로 원의 중심이 좌표다.
 *
 * 채움을 흰색으로 두고 테두리에 색을 싣는 것은 꼬리 있는 핀과 같은 규칙이다.
 * 색을 원 전체에 칠하면 배지 숫자의 대비가 색마다 달라져 순번을 읽기 어려워진다.
 */
function drawMarkerStation(
  ctx: CanvasRenderingContext2D,
  badge: string,
  color: string,
  scale: number,
  pal: Palette,
  active: boolean,
): void {
  const cx = (W_STATION / 2) * scale
  const cy = (H_STATION / 2) * scale
  const r = STATION_R * scale
  const badgeText = badge || '-'

  if (active) drawActiveRing(ctx, cx, cy, r, color, scale)

  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  if (pal.bodyDash) ctx.setLineDash(pal.bodyDash.map((d) => d * scale))
  ctx.strokeStyle = color
  ctx.lineWidth = 3 * scale
  ctx.stroke()
  ctx.setLineDash([])

  const badgeFontSize = getBadgeFontSize(badgeText) * scale
  ctx.font = `700 ${badgeFontSize}px ${FONT_FAMILY}, sans-serif`
  ctx.fillStyle = pal.badgeText
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badgeText, cx, cy)
}

/**
 * 이름표 있는 마커를 Canvas에 그림
 */
function drawMarkerWithLabel(
  ctx: CanvasRenderingContext2D,
  number: string,
  label: string,
  color: string,
  scale: number,
  pal: Palette,
  active: boolean,
): void {
  const cx = (W_WITH_LABEL / 2) * scale
  const circleY = (CIRCLE_R_WITH_LABEL + 2) * scale
  const circleR = (CIRCLE_R_WITH_LABEL - 2) * scale
  const bodyTop = circleY + (CIRCLE_R_WITH_LABEL - 2) * scale
  const bodyBottom = bodyTop + BODY_H * scale
  const pointerBottom = H_WITH_LABEL * scale
  const bodyLeft = (W_WITH_LABEL / 2 - BODY_W / 2) * scale
  const labelY = bodyTop + (BODY_H * scale) / 2
  const triangleTop = bodyBottom - OVERLAP * scale
  const rw = BODY_W * scale
  const rh = BODY_H * scale
  const rx = 6 * scale

  if (active) drawActiveRing(ctx, cx, circleY, circleR, color, scale)

  if (pal.bodyStroke) {
    // 흰 채움 + 테두리 — 박스와 꼬리를 합집합 경로로 그려 이음선을 없앤다.
    ctx.save()
    traceLabelPinOutline(ctx, {
      cx,
      bodyLeft,
      bodyRight: bodyLeft + rw,
      bodyTop,
      bodyBottom,
      pointerBottom: pointerBottom - 2 * scale,
      rx,
      tailHalf: 8 * scale,
    })
    ctx.fillStyle = pal.bodyFill
    ctx.fill()
    if (pal.bodyDash) ctx.setLineDash(pal.bodyDash.map((d) => d * scale))
    ctx.strokeStyle = pal.bodyStroke
    ctx.lineWidth = 2 * scale
    ctx.stroke()
    ctx.restore()
  } else {
    // 꼬리 (삼각형)
    ctx.beginPath()
    ctx.moveTo(cx - 8 * scale, triangleTop)
    ctx.lineTo(cx, pointerBottom - 2 * scale)
    ctx.lineTo(cx + 8 * scale, triangleTop)
    ctx.closePath()
    ctx.fillStyle = pal.bodyFill
    ctx.fill()

    // 라벨 박스 (둥근 모서리)
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(bodyLeft, bodyTop, rw, rh, rx)
    } else {
      ctx.rect(bodyLeft, bodyTop, rw, rh)
    }
    ctx.fillStyle = pal.bodyFill
    ctx.fill()
  }

  // 원 (뱃지)
  ctx.beginPath()
  ctx.arc(cx, circleY, circleR, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 3 * scale
  ctx.stroke()

  const numberFontSize = getBadgeFontSize(number) * scale
  ctx.font = `700 ${numberFontSize}px ${FONT_FAMILY}, sans-serif`
  ctx.fillStyle = pal.badgeText
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(number, cx, circleY)

  const truncated = truncateLabel(label, 5)
  ctx.font = `400 ${12 * scale}px ${FONT_FAMILY}, sans-serif`
  ctx.fillStyle = pal.labelText
  ctx.fillText(truncated, cx, labelY)
}

/**
 * 이름표 없는 마커를 Canvas에 그림
 */
function drawMarkerNoLabel(
  ctx: CanvasRenderingContext2D,
  badge: string,
  color: string,
  scale: number,
  pal: Palette,
  active: boolean,
): void {
  const cx = (W_NO_LABEL / 2) * scale
  const cy = 42 * scale
  const r = 16 * scale
  const badgeText = badge || '-'

  if (active) drawActiveRing(ctx, cx, cy, r, color, scale)

  // 5점 폴리곤 꼬리
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(28 * scale, 70 * scale)
  ctx.lineTo(36 * scale, 58 * scale)
  ctx.lineTo(38.79 * scale, 53.81 * scale)
  ctx.lineTo(17.21 * scale, 53.81 * scale)
  ctx.lineTo(20 * scale, 58 * scale)
  ctx.closePath()
  ctx.fillStyle = pal.bodyFill
  ctx.fill()
  if (pal.bodyStroke) {
    if (pal.bodyDash) ctx.setLineDash(pal.bodyDash.map((d) => d * scale))
    ctx.strokeStyle = pal.bodyStroke
    ctx.lineWidth = 2 * scale
    ctx.stroke()
  }
  ctx.restore()

  // 원
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.strokeStyle = color
  ctx.lineWidth = 3 * scale
  ctx.stroke()

  const badgeFontSize = getBadgeFontSize(badgeText) * scale
  ctx.font = `700 ${badgeFontSize}px ${FONT_FAMILY}, sans-serif`
  ctx.fillStyle = pal.badgeText
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(badgeText, cx, cy)
}

/**
 * Canvas에 마커를 그려 Data URL 반환
 */
function drawMarkerToDataUrl(
  options: MarkerIconOptions,
  scale: number,
): { dataUrl: string; width: number; height: number } {
  const variant = options.variant ?? 'filled'
  const isStation = variant === 'station'
  // 역 원은 이름표를 스프라이트에 굽지 않는다 — 이름은 선 위에 반복 표기한다.
  const withLabel = variant !== 'dot' && !isStation && hasLabel(options.label)
  const w = (withLabel ? W_WITH_LABEL : isStation ? W_STATION : W_NO_LABEL) * scale
  const h = (withLabel ? H_WITH_LABEL : isStation ? H_STATION : H_NO_LABEL) * scale

  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null
  if (!canvas) {
    return { dataUrl: '', width: w, height: h }
  }
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return { dataUrl: '', width: w, height: h }

  const pal = palette(variant, options.color)
  const active = options.active ?? false

  if (variant === 'dot') {
    drawMarkerDot(ctx, options.color, scale, active)
  } else if (isStation) {
    drawMarkerStation(ctx, options.number, options.color, scale, pal, active)
  } else if (withLabel) {
    drawMarkerWithLabel(ctx, options.number, options.label!, options.color, scale, pal, active)
  } else {
    drawMarkerNoLabel(ctx, options.number, options.color, scale, pal, active)
  }

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: w,
    height: h,
  }
}

// ── 캐시 ─────────────────────────────────────────────────────────────────────
// 같은 (number, label, color, scale) 조합은 한 번 그리면 재사용한다.
// 선택 변경 시마다 canvas로 다시 그리지 않아도 되므로
// `createMarkerIconDataUrl`/`createMarkerIconSvgDataUrl` 호출이 즉시 반환된다.

interface IconResult {
  dataUrl: string
  width: number
  height: number
  displayWidth: number
  displayHeight: number
}

const iconCache = new Map<string, IconResult>()

function iconCacheKey(options: MarkerIconOptions, scale: number): string {
  const variant = options.variant ?? 'filled'
  // 이름표를 굽지 않는 변형은 label 이 그림에 영향을 주지 않는다 — 키에 넣으면 같은 그림을
  // 플래너 수만큼 중복해서 굽게 된다.
  const drawsLabel = variant !== 'dot' && variant !== 'station'
  return [
    scale,
    variant,
    options.active ? 'a' : '',
    options.color,
    options.number,
    drawsLabel ? (options.label ?? '') : '',
  ].join('|')
}

/**
 * 동일한 그림이 되는 마커끼리 스프라이트를 공유하기 위한 키.
 *
 * 마커 id 단위로 이미지를 등록하면 200건 화면에서 canvas를 200번 그린다.
 * 시각적으로 같은 조합은 하나의 Mapbox 이미지로 합친다.
 */
export function markerImageId(options: MarkerIconOptions): string {
  return `marker:${iconCacheKey(options, 2)}`
}

function buildIconResult(options: MarkerIconOptions, scale: number): IconResult {
  const { dataUrl, width, height } = drawMarkerToDataUrl(options, scale)
  return {
    dataUrl,
    width,
    height,
    displayWidth: width / scale,
    displayHeight: height / scale,
  }
}

/** 폰트 로드 여부와 무관하게 캐시 조회(없으면 undefined). */
export function getCachedMarkerIcon(options: MarkerIconOptions, scale = 2): IconResult | undefined {
  return iconCache.get(iconCacheKey(options, scale))
}

/**
 * 폰트 로드를 기다리지 않고 "지금 당장" data URL을 돌려준다.
 *
 * - 폰트가 이미 로드되었거나 브라우저에 기본 Pretendard가 있으면 의도한 그대로 렌더.
 * - 폰트 로드 전 호출되면 fallback 폰트로 그려지므로, 호출자는 그 다음 tick에
 *   `createMarkerIconDataUrl`을 호출해 정확한 이미지로 재동기화하는 게 안전하다.
 * - 동일 키는 캐시에서 반환.
 */
export function createMarkerIconDataUrlSync(options: MarkerIconOptions, scale = 2): IconResult {
  const key = iconCacheKey(options, scale)
  const cached = iconCache.get(key)
  if (cached) return cached
  const result = buildIconResult(options, scale)
  iconCache.set(key, result)
  return result
}

/**
 * 마커 이미지 Data URL 생성 (Canvas 렌더링, 동기)
 * @param scale 스프라이트용 2배 해상도 시 2
 */
export function createMarkerIconSvgDataUrl(
  options: MarkerIconOptions,
  scale = 1,
): { dataUrl: string; width: number; height: number } {
  const cached = iconCache.get(iconCacheKey(options, scale))
  if (cached) {
    return { dataUrl: cached.dataUrl, width: cached.width, height: cached.height }
  }
  const result = buildIconResult(options, scale)
  iconCache.set(iconCacheKey(options, scale), result)
  return { dataUrl: result.dataUrl, width: result.width, height: result.height }
}

/**
 * Canvas로 마커를 그려 HTMLImageElement로 로드 (Mapbox addImage용)
 * FontFace API로 폰트 로드 후 Canvas에 그려 img에서도 Pretendard 적용
 */
export function loadMarkerIconAsImage(options: MarkerIconOptions): Promise<HTMLImageElement> {
  return ensureFontsLoaded().then(() => {
    const key = iconCacheKey(options, 2)
    const cached = iconCache.get(key)
    const { dataUrl, width, height } = cached
      ? { dataUrl: cached.dataUrl, width: cached.width, height: cached.height }
      : drawMarkerToDataUrl(options, 2)
    if (!cached) {
      iconCache.set(key, {
        dataUrl,
        width,
        height,
        displayWidth: width / 2,
        displayHeight: height / 2,
      })
    }
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = dataUrl
    })
  })
}

/**
 * Data URL 반환 (DOM 오버레이 마커용, 폰트 로드 이후 정확한 이미지 보장)
 *
 * 캐시된 결과가 있으면 그대로 반환. 없으면 폰트 로드 후 그려서 캐시에 저장.
 */
export function createMarkerIconDataUrl(
  options: MarkerIconOptions,
  scale = 2,
): Promise<IconResult> {
  const key = iconCacheKey(options, scale)
  const cached = iconCache.get(key)
  if (cached) return Promise.resolve(cached)
  return ensureFontsLoaded().then(() => {
    const existing = iconCache.get(key)
    if (existing) return existing
    const result = buildIconResult(options, scale)
    iconCache.set(key, result)
    return result
  })
}
