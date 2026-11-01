/**
 * 캔버스 라벨 레이어(`MapboxMap labels`).
 *
 * 라벨을 그림 한 장으로 구워 심볼 레이어로 세운다. DOM 오버레이와 달리 캔버스 안에 있으므로
 * 레이어 순서를 고를 수 있다 — 구역 면 위, **마커·동선·중간 표시 아래**.
 *
 * 순서는 "라벨보다 위에 와야 하는 레이어" 중 지금 가장 아래에 있는 것 바로 밑에 끼워서 맞춘다.
 * 그 레이어들은 나중에 붙어도 맨 위(또는 마커 바로 밑)로 가므로 라벨 위에 남는다. 구역 면만
 * 예외라 `useRegions` 가 라벨 아래로 끼운다.
 */
import { STOP_HANDLE_LAYER_IDS } from './arrows'
import { MARKER_SPRITE_LAYER_ID } from './markerLayers'

import type { MapLabel, MapLabelRun } from '../types/mapbox.types'
import type mapboxgl from 'mapbox-gl'

export const LABEL_SOURCE_ID = 'labels-source'
export const LABEL_LAYER_ID = 'labels-sprite'

/** 라벨보다 위에 그려야 하는 레이어 — 핀·동선·중간 표시·끌기 미리보기·힌트 */
const ABOVE_LABEL_PREFIXES = [
  'markers-',
  'arrows-',
  'arrow-stops',
  'route-loops-',
  'stop-drag-',
  'stop-hint-',
]

/** 굽는 배율 — 고밀도 화면에서 흐려지지 않게 2배로 굽고 `pixelRatio: 2` 로 올린다 */
const SCALE = 2
const RUN_GAP = 6
const LINE_GAP = 1
const LINE_HEIGHT = 1.25
const SHADOW_BLUR = 6
const SHADOW_OFFSET_Y = 1
const DEFAULT_PADDING: [number, number] = [8, 2]

// ── 순수 계산 ────────────────────────────────────────────────────────────────

export interface LabelBox {
  /** 테두리 상자 크기(px, 배율 전) */
  width: number
  height: number
  /** 줄마다 [가로 폭, 높이] */
  lines: { width: number; height: number }[]
}

/**
 * 라벨 상자를 잰다. 글자 폭은 `measure` 로 받는다 — 시험에서 캔버스 없이 돌리려고.
 */
export function measureLabel(
  label: Pick<MapLabel, 'lines' | 'padding'>,
  measure: (run: MapLabelRun) => number,
): LabelBox {
  const [padX, padY] = label.padding ?? DEFAULT_PADDING
  const lines = label.lines.map((runs) => {
    const width = runs.reduce(
      (sum, run, index) => sum + measure(run) + (index > 0 ? RUN_GAP : 0),
      0,
    )
    const height = Math.max(0, ...runs.map((run) => run.size)) * LINE_HEIGHT
    return { width, height }
  })
  const contentWidth = Math.max(0, ...lines.map((line) => line.width))
  const contentHeight =
    lines.reduce((sum, line) => sum + line.height, 0) + LINE_GAP * Math.max(0, lines.length - 1)
  // 테두리 1px 을 양쪽에 더한다
  return { width: contentWidth + padX * 2 + 2, height: contentHeight + padY * 2 + 2, lines }
}

/** 그림 이름 — 보이는 모습이 같으면 같은 그림을 쓴다 */
export function labelImageId(label: MapLabel, font: string): string {
  const key = JSON.stringify([
    label.lines,
    label.background,
    label.backgroundOpacity ?? 1,
    label.borderColor,
    label.shape ?? 'pill',
    label.shadow ?? false,
    label.padding ?? DEFAULT_PADDING,
    font,
  ])
  let hash = 5381
  for (let i = 0; i < key.length; i += 1) hash = ((hash << 5) + hash + key.charCodeAt(i)) | 0
  return `label-${(hash >>> 0).toString(36)}`
}

/**
 * 맨 앞 "라벨보다 위" 레이어 — 라벨을 이 바로 밑에 끼운다. 없으면 맨 위로 둔다.
 */
export function labelBeforeId(layerIds: readonly string[]): string | undefined {
  return layerIds.find(
    (id) => id !== LABEL_LAYER_ID && ABOVE_LABEL_PREFIXES.some((prefix) => id.startsWith(prefix)),
  )
}

// ── 굽기 ─────────────────────────────────────────────────────────────────────

const VAR_PATTERN = /^var\(\s*(--[^,\s)]+)\s*(?:,\s*(.+))?\)$/

/** `var(--token)` 을 지도 컨테이너에서 계산된 값으로 푼다. 못 풀면 대체값·검정 */
function resolveColor(style: CSSStyleDeclaration | null, value: string): string {
  const match = VAR_PATTERN.exec(value.trim())
  if (!match) return value
  const resolved = style?.getPropertyValue(match[1]).trim()
  if (resolved) return resolveColor(style, resolved)
  return match[2] ? resolveColor(style, match[2]) : '#000'
}

function fontOf(run: MapLabelRun, family: string, scale: number): string {
  return `${run.weight ?? 400} ${run.size * scale}px ${family}`
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

interface BakedLabel {
  width: number
  height: number
  data: Uint8ClampedArray
}

function bakeLabel(
  label: MapLabel,
  family: string,
  style: CSSStyleDeclaration | null,
): BakedLabel | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const box = measureLabel(label, (run) => {
    ctx.font = fontOf(run, family, 1)
    return ctx.measureText(run.text).width
  })
  // 그림자가 잘리지 않게 사방으로 여백을 둔다
  const margin = label.shadow ? SHADOW_BLUR + SHADOW_OFFSET_Y : 1
  canvas.width = Math.ceil((box.width + margin * 2) * SCALE)
  canvas.height = Math.ceil((box.height + margin * 2) * SCALE)
  ctx.scale(SCALE, SCALE)

  const x = margin + 0.5
  const y = margin + 0.5
  const width = box.width - 1
  const height = box.height - 1
  const radius = (label.shape ?? 'pill') === 'pill' ? height / 2 : 8

  // 배경 — 반투명이어도 그림자는 진하게 남도록 그림자부터 따로 깐다
  if (label.shadow) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.12)'
    ctx.shadowBlur = SHADOW_BLUR
    ctx.shadowOffsetY = SHADOW_OFFSET_Y
    roundedRect(ctx, x, y, width, height, radius)
    ctx.fillStyle = 'rgba(0,0,0,0.01)'
    ctx.fill()
    ctx.restore()
  }
  ctx.save()
  ctx.globalAlpha = label.backgroundOpacity ?? 1
  roundedRect(ctx, x, y, width, height, radius)
  ctx.fillStyle = resolveColor(style, label.background)
  ctx.fill()
  ctx.restore()
  roundedRect(ctx, x, y, width, height, radius)
  ctx.lineWidth = 1
  ctx.strokeStyle = resolveColor(style, label.borderColor)
  ctx.stroke()

  // 글자 — 줄은 가운데 정렬, 한 줄 안의 조각은 바닥선을 맞춘다
  const [, padY] = label.padding ?? DEFAULT_PADDING
  let lineTop = margin + 1 + padY
  ctx.textBaseline = 'alphabetic'
  label.lines.forEach((runs, index) => {
    const line = box.lines[index]
    const maxSize = Math.max(0, ...runs.map((run) => run.size))
    // 줄 상자 안에서 가장 큰 글자를 세로 가운데에 둔다
    const baseline = lineTop + (line.height - maxSize) / 2 + maxSize * 0.86
    let cursor = margin + (box.width - line.width) / 2
    runs.forEach((run, runIndex) => {
      if (runIndex > 0) cursor += RUN_GAP
      ctx.font = fontOf(run, family, 1)
      ctx.fillStyle = resolveColor(style, run.color)
      ctx.fillText(run.text, cursor, baseline)
      cursor += ctx.measureText(run.text).width
    })
    lineTop += line.height + LINE_GAP
  })

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  return { width: canvas.width, height: canvas.height, data: image.data }
}

// ── 런타임 ───────────────────────────────────────────────────────────────────

/** map 별로 이 레이어가 올린 그림 — 남의 그림을 걷지 않으려고 */
const ownedImages = new WeakMap<mapboxgl.Map, Set<string>>()

function containerStyle(map: mapboxgl.Map): CSSStyleDeclaration | null {
  try {
    return getComputedStyle(map.getContainer())
  } catch {
    return null
  }
}

/** 라벨 레이어를 "라벨보다 위" 레이어들 밑으로 맞춘다 */
export function placeLabelLayer(map: mapboxgl.Map): void {
  if (!map.getLayer(LABEL_LAYER_ID)) return
  const layerIds = (map.getStyle()?.layers ?? []).map((layer) => layer.id)
  const before = labelBeforeId(layerIds)
  if (!before) return
  const labelIndex = layerIds.indexOf(LABEL_LAYER_ID)
  if (labelIndex >= 0 && labelIndex < layerIds.indexOf(before)) return
  map.moveLayer(LABEL_LAYER_ID, before)
}

/**
 * 라벨을 map 에 맞춘다. 비어 있으면 걷는다.
 *
 * 글꼴이 늦게 도착하면 대체 글꼴로 구워진다 — 굽기 전에 `document.fonts.ready` 를 기다린다.
 * `isStale` 이 그때 참이면 더 새 갱신이 이미 맞춘 것이라 아무것도 하지 않는다.
 */
export async function syncLabelLayer(
  map: mapboxgl.Map,
  labels: readonly MapLabel[],
  isStale: () => boolean,
): Promise<void> {
  if (labels.length === 0) {
    removeLabelLayer(map)
    return
  }
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await document.fonts.ready
  }
  if (isStale()) return

  const style = containerStyle(map)
  const family = style?.fontFamily || 'sans-serif'
  const owned = ownedImages.get(map) ?? new Set<string>()
  ownedImages.set(map, owned)

  const used = new Set<string>()
  const features: GeoJSON.Feature[] = []
  labels.forEach((label, index) => {
    const imageId = labelImageId(label, family)
    if (!used.has(imageId) && !map.hasImage(imageId)) {
      const baked = bakeLabel(label, family, style)
      if (!baked) return
      map.addImage(
        imageId,
        { width: baked.width, height: baked.height, data: baked.data },
        { pixelRatio: SCALE },
      )
    }
    used.add(imageId)
    owned.add(imageId)
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [label.position.lng, label.position.lat] },
      properties: { id: label.id, imageId, sortKey: index, title: label.title ?? '' },
    })
  })

  const data: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features }
  const source = map.getSource(LABEL_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
  if (source) source.setData(data)
  else map.addSource(LABEL_SOURCE_ID, { type: 'geojson', data })

  if (!map.getLayer(LABEL_LAYER_ID)) {
    const layerIds = (map.getStyle()?.layers ?? []).map((layer) => layer.id)
    map.addLayer(
      {
        id: LABEL_LAYER_ID,
        type: 'symbol',
        source: LABEL_SOURCE_ID,
        layout: {
          'icon-image': ['get', 'imageId'],
          'icon-anchor': 'center',
          // 라벨끼리·핀과 겹쳐도 지우지 않는다 — 순서로 가린다. 바탕 지도의 글자는 비켜 준다.
          'icon-allow-overlap': true,
          'symbol-sort-key': ['get', 'sortKey'],
        },
      },
      labelBeforeId(layerIds),
    )
  } else {
    placeLabelLayer(map)
  }

  // 새 데이터가 들어간 뒤에 안 쓰는 그림만 걷는다
  for (const id of [...owned]) {
    if (used.has(id)) continue
    if (map.hasImage(id)) map.removeImage(id)
    owned.delete(id)
  }
}

export function removeLabelLayer(map: mapboxgl.Map): void {
  try {
    if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID)
    if (map.getSource(LABEL_SOURCE_ID)) map.removeSource(LABEL_SOURCE_ID)
    const owned = ownedImages.get(map)
    if (owned) {
      for (const id of owned) if (map.hasImage(id)) map.removeImage(id)
      owned.clear()
    }
  } catch {
    // map 이 이미 제거된 경우
  }
}

/** 이 점에 라벨보다 위에 있는 눌리는 것(마커·중간 표시)이 있는가 */
function hitsAboveLabel(map: mapboxgl.Map, point: mapboxgl.Point): boolean {
  const layers = [MARKER_SPRITE_LAYER_ID, ...STOP_HANDLE_LAYER_IDS].filter((id) => map.getLayer(id))
  if (layers.length === 0) return false
  try {
    return map.queryRenderedFeatures(point, { layers }).length > 0
  } catch {
    return false
  }
}

/** 이 점에 라벨이 있는가 — 구역 클릭이 라벨 클릭과 겹쳐 두 번 해석되지 않게 묻는다 */
export function hitsLabel(map: mapboxgl.Map, point: mapboxgl.Point): boolean {
  if (!map.getLayer(LABEL_LAYER_ID)) return false
  try {
    return map.queryRenderedFeatures(point, { layers: [LABEL_LAYER_ID] }).length > 0
  } catch {
    return false
  }
}

/**
 * 라벨 클릭·커서를 붙인다. 위에 마커·중간 표시가 있으면 그쪽이 이긴다.
 * 반환된 함수로 걷는다.
 */
export function bindLabelInteractions(
  map: mapboxgl.Map,
  onClick: (labelId: string) => void,
): () => void {
  const handleClick = (event: mapboxgl.MapLayerMouseEvent) => {
    if (hitsAboveLabel(map, event.point)) return
    // 겹친 라벨 중 위에 그려진 것 — sortKey 가 큰 쪽
    const top = [...(event.features ?? [])].sort(
      (a, b) => Number(b.properties?.sortKey ?? 0) - Number(a.properties?.sortKey ?? 0),
    )[0]
    const id = top?.properties?.id
    if (typeof id === 'string') onClick(id)
  }
  const handleEnter = (event: mapboxgl.MapLayerMouseEvent) => {
    if (hitsAboveLabel(map, event.point)) return
    map.getCanvas().style.cursor = 'pointer'
    const title = event.features?.[0]?.properties?.title
    map.getCanvas().title = typeof title === 'string' ? title : ''
  }
  const handleLeave = () => {
    map.getCanvas().style.cursor = ''
    map.getCanvas().title = ''
  }

  map.on('click', LABEL_LAYER_ID, handleClick)
  map.on('mouseenter', LABEL_LAYER_ID, handleEnter)
  map.on('mouseleave', LABEL_LAYER_ID, handleLeave)
  return () => {
    map.off('click', LABEL_LAYER_ID, handleClick)
    map.off('mouseenter', LABEL_LAYER_ID, handleEnter)
    map.off('mouseleave', LABEL_LAYER_ID, handleLeave)
  }
}
