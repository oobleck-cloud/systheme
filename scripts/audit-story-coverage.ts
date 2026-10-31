/**
 * 상태·예외 커버리지 감사 — 컴포넌트마다 로딩·빈·오류·비활성·긴 텍스트 스토리가 있는지,
 * 그리고 anatomy `usage.states` 가 약속한 상태를 스토리가 실제로 보여주는지 표로 만든다.
 *
 *   pnpm --filter @oobleck/systheme audit:coverage          # docs/design-system/coverage.md 갱신
 *   pnpm --filter @oobleck/systheme audit:coverage -- --json
 *
 * 판정은 스토리 export 이름의 키워드로만 한다(정적 분석). 이름이 상태를 말하지 않으면 없는 것으로
 * 센다 — 그게 이 감사의 요점이다: 사람도 AI 도 이름으로 찾는다.
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import fg from 'fast-glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(__dirname, '..')
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../..')
const COMPONENTS_DIR = path.join(PACKAGE_ROOT, 'src/components')
const OUT = path.join(REPO_ROOT, 'docs/design-system/coverage.md')

type StateKey = 'loading' | 'empty' | 'error' | 'disabled' | 'overflow'

const STATE_PATTERNS: Record<StateKey, RegExp> = {
  loading: /loading|skeleton|pending|busy/i,
  empty: /empty|no[-_]?(results?|options?|items?|data)/i,
  error: /error|invalid|danger|fail/i,
  disabled: /disabled|read[-_]?only|locked/i,
  overflow: /long|overflow|truncat|wrap|many|dense|narrow/i,
}
const STATE_KEYS = Object.keys(STATE_PATTERNS) as StateKey[]

type Row = {
  name: string
  stories: number
  has: Record<StateKey, boolean>
  promised: StateKey[]
  gaps: StateKey[]
}

async function storyExports(file: string): Promise<string[]> {
  const src = await readFile(file, 'utf-8')
  return [...src.matchAll(/^export const ([A-Za-z0-9_]+)\s*[:=]/gm)].map((m) => m[1])
}

async function main() {
  const json = process.argv.includes('--json')
  const anatomyFiles = await fg('**/*.anatomy.json', { cwd: COMPONENTS_DIR, absolute: true })
  const rows: Row[] = []

  for (const anatomyPath of anatomyFiles.sort()) {
    const dir = path.dirname(anatomyPath)
    const name = path.basename(anatomyPath, '.anatomy.json')
    // 컴포넌트 루트만 — 행·셀처럼 패밀리 안의 하위 부품(components/X/Y/…)은 부모 계약을 따른다.
    if (name !== path.basename(dir)) continue
    if (path.dirname(path.relative(COMPONENTS_DIR, dir)) !== '.') continue

    const storyFiles = await fg('*.stories.tsx', { cwd: dir, absolute: true })
    const names = (await Promise.all(storyFiles.map(storyExports))).flat()
    const has = Object.fromEntries(
      STATE_KEYS.map((k) => [k, names.some((n) => STATE_PATTERNS[k].test(n))]),
    ) as Record<StateKey, boolean>

    const doc = JSON.parse(await readFile(anatomyPath, 'utf-8')) as {
      usage?: { states?: Partial<Record<StateKey | 'forbidden', string>> }
    }
    const promised = Object.keys(doc.usage?.states ?? {}).filter((k): k is StateKey =>
      STATE_KEYS.includes(k as StateKey),
    )
    const gaps = promised.filter((k) => !has[k])
    rows.push({ name, stories: names.length, has, promised, gaps })
  }

  if (json) {
    console.log(JSON.stringify(rows, null, 2))
    return
  }

  const mark = (row: Row, k: StateKey) =>
    row.has[k] ? '✓' : row.promised.includes(k) ? '**✗**' : '–'
  const withGaps = rows.filter((r) => r.gaps.length > 0)
  const lines = [
    '# 상태·예외 커버리지',
    '',
    '> `pnpm --filter @oobleck/systheme audit:coverage` 가 생성한다. 손으로 고치지 않는다.',
    '> ✓ = 그 상태를 이름으로 말하는 스토리가 있다 · – = 없고 약속도 없다 · **✗** = anatomy `usage.states` 가 약속했는데 스토리가 없다(채워야 할 빈칸).',
    `> 판정은 스토리 export 이름 키워드(loading/empty/error/disabled/long…)로만 한다. ${new Date().toISOString().slice(0, 10)} 기준 컴포넌트 ${rows.length}개, 빈칸 ${withGaps.length}개.`,
    '',
    '## 채워야 할 빈칸',
    '',
    withGaps.length === 0
      ? '없음.'
      : withGaps.map((r) => `- **${r.name}** — ${r.gaps.join(', ')}`).join('\n'),
    '',
    '## 전체',
    '',
    '| 컴포넌트 | 스토리 | loading | empty | error | disabled | overflow |',
    '| --- | ---: | :-: | :-: | :-: | :-: | :-: |',
    ...rows.map(
      (r) => `| ${r.name} | ${r.stories} | ${STATE_KEYS.map((k) => mark(r, k)).join(' | ')} |`,
    ),
    '',
  ]
  await writeFile(OUT, lines.join('\n'))
  console.log(
    `coverage.md 갱신 — 컴포넌트 ${rows.length}, 빈칸 ${withGaps.length}: ${withGaps.map((r) => r.name).join(', ') || '없음'}`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
