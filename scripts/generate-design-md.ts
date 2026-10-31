/**
 * AI 가 읽는 디자인시스템 문서(DESIGN.generated.md)를 **생성**한다.
 *
 * 손으로 따로 쓰지 않는다 — 맥락(contexts.md)·원칙(principles.md)은 그대로 싣고,
 * 컴포넌트 절은 각 anatomy.json(state·events·usage)에서 뽑는다. 내용이 바뀌면 원천을 고치고
 * 다시 생성한다. 형식은 마지막이다: 내용이 모호하면 여기서도 모호하다.
 *
 *   pnpm --filter @oobleck/systheme gen:design-md
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fg from 'fast-glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../..')
const DOCS = path.join(REPO_ROOT, 'docs/design-system')
const COMPONENTS_DIR = path.join(PACKAGE_ROOT, 'src/components')
const OUT = path.join(DOCS, 'DESIGN.generated.md')

type Usage = {
  when: string[]
  avoid?: string[]
  limits?: {
    perRegion?: number | Record<string, number>
    label?: string
    items?: string
    width?: string
  }
  states?: Record<string, string>
  placement?: string[]
  examples?: string[]
}
type Anatomy = {
  id: string
  state?: Record<string, string>
  events?: string[]
  usage?: Usage
}

function stripFrontNote(md: string): string {
  // 문서 상단의 "> ..." 안내 블록은 사람용이므로 뺀다. 본문 인용(>)은 첫 제목 뒤부터라 영향 없다.
  const lines = md.split('\n')
  const out: string[] = []
  let pastHead = false
  for (const line of lines) {
    if (!pastHead && line.startsWith('# ')) {
      pastHead = true
      continue
    }
    if (pastHead && !out.length && line.startsWith('>')) continue
    if (pastHead && !out.length && line.trim() === '') continue
    if (pastHead) out.push(line)
  }
  return out.join('\n').trim()
}

function limitsText(l: NonNullable<Usage['limits']>): string[] {
  const out: string[] = []
  if (l.perRegion != null) {
    out.push(
      typeof l.perRegion === 'number'
        ? `한 영역에 최대 ${l.perRegion}개`
        : Object.entries(l.perRegion)
            .map(([k, v]) => `${k} 최대 ${v}개`)
            .join(', '),
    )
  }
  if (l.label) out.push(`라벨: ${l.label}`)
  if (l.items) out.push(`항목: ${l.items}`)
  if (l.width) out.push(`폭: ${l.width}`)
  return out
}

function componentSection(name: string, a: Anatomy): string {
  const lines = [`### ${name}`, '']
  if (a.state && Object.keys(a.state).length) {
    lines.push(
      `- 상태(props): ${Object.entries(a.state)
        .map(([k, v]) => `\`${k}: ${v}\``)
        .join(' · ')}`,
    )
  }
  if (a.events?.length) lines.push(`- 이벤트: ${a.events.map((e) => `\`${e}\``).join(' · ')}`)
  const u = a.usage
  if (!u) {
    lines.push('- 사용 계약: **미작성** (validate:ds WARN)', '')
    return lines.join('\n')
  }
  lines.push('- 쓴다:', ...u.when.map((s) => `  - ${s}`))
  if (u.avoid?.length) lines.push('- 쓰지 않는다:', ...u.avoid.map((s) => `  - ${s}`))
  if (u.limits) {
    const t = limitsText(u.limits)
    if (t.length) lines.push('- 상한:', ...t.map((s) => `  - ${s}`))
  }
  if (u.states && Object.keys(u.states).length) {
    lines.push('- 상태:', ...Object.entries(u.states).map(([k, v]) => `  - ${k}: ${v}`))
  }
  if (u.placement?.length) lines.push('- 배치:', ...u.placement.map((s) => `  - ${s}`))
  if (u.examples?.length) lines.push(`- 정본: ${u.examples.map((e) => `\`${e}\``).join(' · ')}`)
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const contexts = await readFile(path.join(DOCS, 'contexts.md'), 'utf-8')
  const principles = await readFile(path.join(DOCS, 'principles.md'), 'utf-8')

  const files = (await fg('**/*.anatomy.json', { cwd: COMPONENTS_DIR, absolute: true }))
    // 컴포넌트 루트만 — 하위 부품은 부모 계약을 따른다(validate-anatomy 와 같은 규칙).
    .filter(
      (f) =>
        path.basename(f, '.anatomy.json') === path.basename(path.dirname(f)) &&
        path.dirname(path.relative(COMPONENTS_DIR, path.dirname(f))) === '.',
    )
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)))

  const sections: string[] = []
  let withUsage = 0
  for (const f of files) {
    const a = JSON.parse(await readFile(f, 'utf-8')) as Anatomy
    if (a.usage) withUsage += 1
    sections.push(componentSection(path.basename(f, '.anatomy.json'), a))
  }

  const md = [
    '# MVOS 디자인시스템 — 문법과 용법 (생성본)',
    '',
    `> \`pnpm --filter @oobleck/systheme gen:design-md\` 가 생성한다. **손으로 고치지 않는다.**`,
    '> 원천: docs/design-system/contexts.md · principles.md · 각 컴포넌트의 anatomy.json(usage).',
    `> 컴포넌트 ${files.length}개 중 사용 계약 ${withUsage}개. 토큰 값은 packages/design-system/src/styles/tokens/*.css 가 정본이다.`,
    '',
    '읽는 순서: 1) 어느 맥락의 화면인지 고른다 → 2) 원칙을 지킨다 → 3) 컴포넌트는 사용 계약대로만 쓴다. 계약에 없는 상황이면 지어내지 말고 컴포넌트를 DS 에 먼저 올린다.',
    '',
    '## 1. 맥락 — 어느 화면이 어느 문법을 쓰는가',
    '',
    stripFrontNote(contexts),
    '',
    '## 2. 원칙',
    '',
    stripFrontNote(principles).replace(/^## /gm, '### '),
    '',
    '## 3. 컴포넌트 사용 계약',
    '',
    ...sections,
  ].join('\n')

  await writeFile(OUT, md)
  console.log(`DESIGN.generated.md — 컴포넌트 ${files.length}, 사용 계약 ${withUsage}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
