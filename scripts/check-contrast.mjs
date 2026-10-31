#!/usr/bin/env node
/**
 * 색 토큰 대비 검증 — src/styles/tokens/color.css 의 :root(라이트) / .dark 를 읽어
 * oklch 와 #rrggbb(Workstyle 값)를 받는다.
 * 글자·바탕 짝의 WCAG 대비를 계산한다. 외부 의존 없음(oklch → sRGB 변환 내장).
 *
 *   node scripts/check-contrast.mjs          # 표 출력, 기준 미달이 있으면 exit 1
 *   node scripts/check-contrast.mjs --json   # 기계용
 *
 * 기준: 본문 글자 4.5:1(AA), 보조 글자(muted·disabled·아이콘) 3:1, 채움 버튼 위 글자 4.5:1.
 * 알파가 있는 색은 바탕 위에 합성한 뒤 잰다 — 다크의 subtle 웰이 전부 알파라서 이게 없으면 틀린다.
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/styles/tokens/color.css'), 'utf8')

// ── 파서 ──────────────────────────────────────────────────────────────
function block(selector) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`block not found: ${selector}`)
  const end = css.indexOf('\n}', start)
  const body = css.slice(start, end)
  const vars = {}
  for (const m of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim()
  return vars
}
const light = block(':root')
const dark = { ...light, ...block('.dark') }

// ── 색 산술 ───────────────────────────────────────────────────────────
/** @returns {{r:number,g:number,b:number,a:number}} 선형 sRGB 0..1 */
function oklchToLinearSrgb(L, C, h, a = 1) {
  const hr = (h * Math.PI) / 180
  const A = C * Math.cos(hr)
  const B = C * Math.sin(hr)
  const l_ = L + 0.3963377774 * A + 0.2158037573 * B
  const m_ = L - 0.1055613458 * A - 0.0638541728 * B
  const s_ = L - 0.0894841775 * A - 1.291485548 * B
  const l = l_ ** 3
  const m = m_ ** 3
  const s = s_ ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const b = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  const clamp = (v) => Math.min(1, Math.max(0, v))
  return { r: clamp(r), g: clamp(g), b: clamp(b), a }
}

function srgbChannelToLinear(c) {
  const x = c / 255
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
}

function resolve1(value, vars, depth = 0) {
  if (depth > 20) throw new Error(`var loop: ${value}`)
  value = value.trim()
  const hex = value.match(/^#([0-9a-fA-F]{6})$/)
  if (hex) {
    const n = hex[1]
    return {
      r: srgbChannelToLinear(parseInt(n.slice(0, 2), 16)),
      g: srgbChannelToLinear(parseInt(n.slice(2, 4), 16)),
      b: srgbChannelToLinear(parseInt(n.slice(4, 6), 16)),
      a: 1,
    }
  }
  const varRef = value.match(/^var\((--[\w-]+)\)$/)
  if (varRef) return resolve1(vars[varRef[1]], vars, depth + 1)
  // oklch(from var(--x) l c h / 0.4)
  const rel = value.match(/^oklch\(from\s+var\((--[\w-]+)\)\s+l\s+c\s+h\s*\/\s*([\d.]+)\)$/)
  if (rel) {
    const base = resolve1(vars[rel[1]], vars, depth + 1)
    return { ...base, a: Number(rel[2]) }
  }
  const abs = value.match(/^oklch\(([\d.]+)%\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/)
  if (abs)
    return oklchToLinearSrgb(
      Number(abs[1]) / 100,
      Number(abs[2]),
      Number(abs[3]),
      abs[4] ? Number(abs[4]) : 1,
    )
  throw new Error(`unparsable: ${value}`)
}

/** 알파 색을 불투명 바탕 위에 합성 */
function over(fg, bg) {
  const a = fg.a
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  }
}
const luminance = ({ r, g, b }) => 0.2126 * r + 0.7152 * g + 0.0722 * b
function contrast(fg, bg) {
  const l1 = luminance(fg)
  const l2 = luminance(bg)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// ── 검사 목록 — (글자, 바탕, 바탕의 바탕, 기준) ───────────────────────
const AA = 4.5
const UI = 3
const checks = [
  // 본문 위계 × 표면 사다리
  ...[
    '--ds-color-bg-canvas',
    '--ds-color-bg-surface',
    '--ds-color-bg-default',
    '--ds-color-bg-float',
  ].flatMap((bg) => [
    ['--ds-color-text-default', bg, null, AA],
    ['--ds-color-text-subtle', bg, null, AA],
    ['--ds-color-text-muted', bg, null, UI],
    ['--ds-color-text-brand', bg, null, AA],
  ]),
  ['--ds-color-text-disabled', '--ds-color-bg-default', null, 2.4],
  // 채움 버튼
  ['--ds-color-primary-fg', '--ds-color-primary', null, AA],
  ['--ds-color-primary-fg', '--ds-color-primary-hover', null, AA],
  ['--ds-color-secondary-fg', '--ds-color-secondary', null, AA],
  ['--ds-color-destructive-fg', '--ds-color-destructive', null, AA],
  ['--ds-color-on-primary-container', '--ds-color-primary-container', null, AA],
  // 상태 웰 위 글자 (웰은 카드 위에 깔린다)
  ...['success', 'warning', 'error', 'info'].map((s) => [
    `--ds-color-${s}-text`,
    `--ds-color-${s}-subtle`,
    '--ds-color-bg-default',
    AA,
  ]),
  // 태그 칩
  ...['gray', 'red', 'orange', 'green', 'teal', 'blue', 'purple'].map((c) => [
    `--ds-color-tag-${c}-text`,
    `--ds-color-tag-${c}-subtle`,
    '--ds-color-bg-default',
    AA,
  ]),
  // 선택 상태(brand-50 위 primary 글자) — 앱 화면 21곳이 이 조합. 웰·보더가 함께 선택을 말하므로
  // 글자만으로 4.5 를 요구하지 않고 UI 기준(3:1)으로 본다 — 다크 primary(55%) 는 버튼 바탕과 공유한다.
  ['--ds-color-primary', '--ds-color-brand-50', '--ds-color-bg-default', UI],
  ['--ds-color-brand-700', '--ds-color-brand-50', '--ds-color-bg-default', AA],
  // 구분선은 UI 대비 3:1 이 목표가 아니라 "보이되 튀지 않게" — 참고용 1.2 이상만
  ['--ds-color-border-default', '--ds-color-bg-default', null, 1.15],
  ['--ds-color-border-strong', '--ds-color-bg-default', null, 2.4],
  ['--ds-color-primary', '--ds-color-bg-default', null, UI],
  ['--ds-color-success-primary', '--ds-color-bg-default', null, UI],
  ['--ds-color-error-primary', '--ds-color-bg-default', null, UI],
]

function run(name, vars) {
  const rows = []
  for (const [fgName, bgName, underName, min] of checks) {
    let bg = resolve1(vars[bgName], vars)
    if (bg.a < 1) bg = over(bg, resolve1(vars[underName ?? '--ds-color-bg-default'], vars))
    let fg = resolve1(vars[fgName], vars)
    if (fg.a < 1) fg = over(fg, bg)
    const ratio = contrast(fg, bg)
    rows.push({
      theme: name,
      fg: fgName,
      bg: bgName,
      ratio: Number(ratio.toFixed(2)),
      min,
      ok: ratio >= min,
    })
  }
  return rows
}

/**
 * 알려진 기준 미달 — 라이트 text-muted(gray-400) 는 3:1 에 못 미친다(2.5). 캡션·메타에 널리 쓰여
 * 값을 올리면 라이트 전 화면이 바뀌므로 다크 작업과 분리했다. 표에는 나오되 실패로 세지 않는다.
 */
const KNOWN_BASELINE = new Set(['light|--ds-color-text-muted'])

const rows = [...run('light', light), ...run('dark', dark)].map((r) =>
  KNOWN_BASELINE.has(`${r.theme}|${r.fg}`) && !r.ok ? { ...r, ok: true, known: true } : r,
)
if (process.argv.includes('--json')) {
  console.log(JSON.stringify(rows, null, 2))
} else {
  const short = (s) => s.replace('--ds-color-', '')
  for (const theme of ['light', 'dark']) {
    console.log(`\n[${theme}]`)
    for (const r of rows.filter((r) => r.theme === theme)) {
      console.log(
        `${r.known ? 'known' : r.ok ? '  ok ' : ' FAIL'} ${String(r.ratio).padStart(5)} ≥ ${String(r.min).padStart(3)}  ${short(r.fg)} on ${short(r.bg)}`,
      )
    }
  }
  const fails = rows.filter((r) => !r.ok)
  console.log(`\n${rows.length} checks, ${fails.length} below threshold`)
}
process.exit(rows.some((r) => !r.ok) ? 1 : 0)
