/**
 * validate-anatomy.ts
 *
 * 디자인시스템의 anatomy 무결성을 검증한다. CI에서 `pnpm validate:ds`로 실행되며
 * 다음 4종 검증을 수행한다:
 *
 *  1. JSON Schema 검증 — anatomy-schema.json 규약 준수
 *  2. Intent 사전 정합 — 모든 part.intent가 intent-dictionary.json에 등재됨
 *  3. Coverage  — 컴포넌트 .tsx ↔ .anatomy.json ↔ .stories.tsx 삼각 정합
 *  4. data-slot 정합 — 컴포넌트 코드의 data-slot 속성과 anatomy part 트리 일치
 *
 * 옵션
 *   --strict   warn-level 항목도 exit 1 로 처리(CI 권장)
 *   --json     머신리더블 리포트 stdout 출력
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import Ajv2020 from 'ajv'
import addFormats from 'ajv-formats'
import fg from 'fast-glob'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PACKAGE_ROOT = path.resolve(__dirname, '..')
const PRIMITIVES_DIR = path.join(PACKAGE_ROOT, 'src/primitives')
const COMPONENTS_DIR = path.join(PACKAGE_ROOT, 'src/components')
const DICTIONARY_PATH = path.join(PACKAGE_ROOT, 'src/intent-dictionary.json')
const SCHEMA_PATH = path.join(__dirname, 'anatomy-schema.json')

type Severity = 'error' | 'warn'
type Issue = { severity: Severity; file: string; rule: string; message: string }

type Part = {
  id: string
  intent: string
  binding?: string
  writes?: string | string[]
  emits?: string | string[]
  iterates?: string
  as?: string
  traversal?: { axis: 'inline' | 'block' | 'both' }
  slot?: boolean
  child?: Part
  children?: Part[]
}

type AnatomyDoc = {
  id: string
  state?: Record<string, string>
  events?: string[]
  anatomy: Part
  /** 사용 계약 — docs/design-system/usage-contract.md. 형식은 스키마가, 유무는 아래 WARN 이 본다 */
  usage?: { when: string[] }
}

type Dictionary = {
  command: Record<string, { examples?: string[] }>
  information: Record<string, { examples?: string[] }>
}

async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, 'utf-8')) as T
}

function flattenParts(part: Part, parentPath: string[] = []): Array<{ path: string; part: Part }> {
  const path = [...parentPath, part.id]
  const out: Array<{ path: string; part: Part }> = [{ path: path.join('.'), part }]
  if (part.child) out.push(...flattenParts(part.child, path))
  if (part.children) for (const c of part.children) out.push(...flattenParts(c, path))
  return out
}

function relTo(file: string): string {
  return path.relative(process.cwd(), file)
}

async function main() {
  const args = new Set(process.argv.slice(2))
  const strict = args.has('--strict')
  const jsonOut = args.has('--json')

  const issues: Issue[] = []

  const schema = await readJson<object>(SCHEMA_PATH)
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  addFormats(ajv)
  const validate = ajv.compile(schema)

  const dict = await readJson<Dictionary>(DICTIONARY_PATH)
  const knownIntents = new Set([
    ...Object.keys(dict.command ?? {}),
    ...Object.keys(dict.information ?? {}),
  ])

  const anatomyFiles = await fg(['**/*.anatomy.json'], { cwd: PACKAGE_ROOT, absolute: true })
  const anatomyById = new Map<string, { file: string; doc: AnatomyDoc }>()

  // ── (1) Schema + (2) intent-dictionary 정합 ──────────────────────────────────
  for (const file of anatomyFiles) {
    let doc: AnatomyDoc
    try {
      doc = await readJson<AnatomyDoc>(file)
    } catch (e) {
      issues.push({
        severity: 'error',
        file: relTo(file),
        rule: 'anatomy/parse',
        message: `JSON 파싱 실패: ${(e as Error).message}`,
      })
      continue
    }

    const ok = validate(doc)
    // 사용 계약은 컴포넌트 루트 anatomy 에만 요구한다 — 행·셀처럼 패밀리 안의 하위 부품(components/X/Y/…)은
    // 부모 계약을 따른다. 판정: 파일명 == 디렉터리명 이고, 그 디렉터리가 components/ 바로 아래에 있을 것.
    const dir = path.dirname(file)
    const isRootAnatomy =
      path.basename(file, '.anatomy.json') === path.basename(dir) &&
      path.dirname(path.relative(COMPONENTS_DIR, dir)) === '.'
    if (isRootAnatomy && !doc.usage) {
      issues.push({
        severity: 'warn',
        file: relTo(file),
        rule: 'anatomy/usage-missing',
        message: 'usage(언제 쓰고·안 쓰고·어디까지) 없음 — docs/design-system/usage-contract.md',
      })
    }
    if (!ok && validate.errors) {
      for (const err of validate.errors) {
        issues.push({
          severity: 'error',
          file: relTo(file),
          rule: 'anatomy/schema',
          message: `${err.instancePath || '/'} ${err.message ?? ''}`,
        })
      }
    }

    anatomyById.set(doc.id, { file, doc })

    for (const { path: p, part } of flattenParts(doc.anatomy)) {
      if (!part.intent) continue
      if (!knownIntents.has(part.intent)) {
        issues.push({
          severity: 'error',
          file: relTo(file),
          rule: 'anatomy/intent-unknown',
          message: `part "${p}"의 intent "${part.intent}"가 intent-dictionary에 등재되지 않음`,
        })
      }

      // command part는 writes 또는 emits 중 하나는 있어야 한다.
      // slot:true 인 part는 외부에서 행동을 위임받으므로 면제(자체 writes/emits 없는 게 정상).
      const isCommandIntent = Object.prototype.hasOwnProperty.call(dict.command ?? {}, part.intent)
      if (isCommandIntent && !part.writes && !part.emits && !part.slot) {
        issues.push({
          severity: 'warn',
          file: relTo(file),
          rule: 'anatomy/command-no-effect',
          message: `command part "${p}" (intent=${part.intent})에 writes/emits 둘 다 없음`,
        })
      }
    }

    if (doc.anatomy.id !== 'root' && doc.anatomy.id !== doc.id) {
      issues.push({
        severity: 'warn',
        file: relTo(file),
        rule: 'anatomy/root-id',
        message: `최상위 part id는 "root" 또는 컴포넌트 id("${doc.id}")여야 합니다 (현재: "${doc.anatomy.id}")`,
      })
    }
  }

  // ── (3) Component ↔ anatomy ↔ stories 삼각 커버리지 ─────────────────────────
  const componentFiles = await fg(
    ['components/**/*.tsx', 'primitives/**/*.tsx', '!**/*.stories.tsx'],
    { cwd: path.join(PACKAGE_ROOT, 'src'), absolute: true },
  )

  // 무시 목록(internal context, 헬퍼 등)
  const SKIP_RE = /(?:Context\.tsx|context\.tsx|-context\.tsx|README\.md)$/

  for (const file of componentFiles) {
    if (SKIP_RE.test(file)) continue
    const dir = path.dirname(file)
    const base = path.basename(file, '.tsx')
    // anatomy는 같은 디렉토리에 있거나, 같은 이름의 폴더 내에 있음(예: TimetableShell/TimetableShell.anatomy.json)
    const anatomyCandidates = [
      path.join(dir, `${base}.anatomy.json`),
      path.join(dir, base, `${base}.anatomy.json`),
    ]
    let anatomyFile: string | null = null
    for (const c of anatomyCandidates) {
      if (anatomyFiles.includes(c)) {
        anatomyFile = c
        break
      }
    }
    if (!anatomyFile) {
      // Composition wrappers (RadioGroup 등)는 형제 anatomy 공유 — 해당 디렉토리에 anatomy가 하나라도 있으면 통과
      const dirHasAnatomy = anatomyFiles.some((f) => path.dirname(f) === dir)
      if (!dirHasAnatomy) {
        issues.push({
          severity: 'warn',
          file: relTo(file),
          rule: 'coverage/anatomy-missing',
          message: `대응되는 .anatomy.json이 없습니다`,
        })
      }
    }

    const storyCandidates = [
      path.join(dir, `${base}.stories.tsx`),
      path.join(dir, base, `${base}.stories.tsx`),
    ]
    const hasStory = storyCandidates.some((c) => fg.sync(c).length > 0)
    if (!hasStory) {
      // 같은 디렉토리에 다른 *.stories.tsx가 있으면 그룹/L3 wrapper로 간주 — warn만
      const dirHasStory = fg.sync(path.join(dir, '**/*.stories.tsx')).length > 0
      issues.push({
        severity: dirHasStory ? 'warn' : 'warn',
        file: relTo(file),
        rule: 'coverage/story-missing',
        message: `대응되는 .stories.tsx가 없습니다 (${dirHasStory ? '같은 디렉토리에 다른 스토리 존재' : '디렉토리에 스토리 없음'})`,
      })
    }
  }

  // ── (4a) anatomy.events ↔ 컴포넌트 prop 정합 ─────────────────────────────────
  // anatomy.events 의 각 이벤트 이름이 같은 디렉토리의 컴포넌트 .tsx 파일
  // 안에 prop 시그니처(`onFoo?:` / `onFoo:` / `, onFoo,` / `onFoo =`)로
  // 등장하는지 검사. 다음 케이스는 면제(컴포넌트가 native 속성을 spread):
  //
  //   1. 이벤트 이름이 React HTMLAttributes/InputHTMLAttributes 등의 native
  //      이벤트(onClick, onChange, onSubmit, onKeyDown 등)이면서 컴포넌트가
  //      `...props` / `...inputProps` / `extends ...HTMLAttributes` 패턴을
  //      쓰는 경우 — 그 이벤트는 native attribute 로 자동 노출됨.
  const NATIVE_EVENTS = new Set([
    'onClick',
    'onChange',
    'onSubmit',
    'onKeyDown',
    'onKeyUp',
    'onKeyPress',
    'onFocus',
    'onBlur',
    'onMouseEnter',
    'onMouseLeave',
    'onMouseDown',
    'onMouseUp',
    'onMouseMove',
    'onPointerDown',
    'onPointerUp',
    'onPointerMove',
    'onTouchStart',
    'onTouchEnd',
    'onTouchMove',
    'onCopy',
    'onPaste',
    'onCut',
    'onScroll',
    'onWheel',
    'onDragStart',
    'onDragEnd',
    'onDrop',
    'onDragOver',
    'onInput',
  ])
  for (const [, { file, doc }] of anatomyById) {
    if (!doc.events || doc.events.length === 0) continue
    const dir = path.dirname(file)
    const candidates = await fg(['*.tsx'], { cwd: dir, absolute: true, ignore: ['*.stories.tsx'] })
    if (candidates.length === 0) continue
    let merged = ''
    for (const c of candidates) {
      try {
        merged += '\n' + (await readFile(c, 'utf-8'))
      } catch {
        // ignore unreadable
      }
    }
    const hasHTMLSpread =
      /HTMLAttributes\s*<|InputHTMLAttributes\s*<|ButtonHTMLAttributes\s*<|AnchorHTMLAttributes\s*<|TextareaHTMLAttributes\s*</i.test(
        merged,
      )
    for (const event of doc.events) {
      // 명시적 prop 등장
      const re = new RegExp(`\\b${event}\\b\\s*(\\??\\s*[:=,)}]|\\?\\.)`)
      if (re.test(merged)) continue
      // native 이벤트 + HTMLAttributes spread 라면 자동 노출되므로 면제
      if (NATIVE_EVENTS.has(event) && hasHTMLSpread) continue
      issues.push({
        severity: 'warn',
        file: relTo(file),
        rule: 'anatomy/event-not-in-component',
        message: `anatomy.events에 "${event}"가 있으나 같은 디렉토리 컴포넌트들 어디에도 prop으로 등장하지 않음`,
      })
    }
  }

  // ── (4b) part.writes / part.binding ↔ anatomy.state 내부 정합 ─────────────────
  // anatomy 자체 안에서 writes 와 binding 의 참조 대상이 state 블록에 선언되어
  // 있는지 검증. iterate 변수(`item.foo`, `avatars[i]` 등)와 정적 참조(`@`)는
  // 면제. 세그먼트(`.`/`[]`)의 첫 토큰만 검사한다.
  for (const [, { file, doc }] of anatomyById) {
    const stateKeys = new Set(Object.keys(doc.state ?? {}))
    if (stateKeys.size === 0) continue
    const iterAliases = new Set<string>()
    function visit(part: Part) {
      if (part.iterates && part.as) iterAliases.add(part.as)
      if (part.child) visit(part.child)
      if (part.children) for (const c of part.children) visit(c)
    }
    visit(doc.anatomy)

    function checkStateRef(part: Part, value: string | string[] | undefined, kind: string) {
      if (!value) return
      const refs = Array.isArray(value) ? value : [value]
      for (const ref of refs) {
        if (!ref || typeof ref !== 'string') continue
        if (ref.startsWith('@')) continue // 정적 참조
        if (/none|single-event|navigation-event|submission-event/.test(ref)) continue
        // first segment
        const head = ref.split(/[.[(\s]/)[0]
        if (!head) continue
        if (iterAliases.has(head)) continue // iterate 변수
        if (stateKeys.has(head)) continue
        issues.push({
          severity: 'warn',
          file: relTo(file),
          rule: 'anatomy/state-ref-undeclared',
          message: `${kind}="${ref}"의 첫 세그먼트 "${head}"가 anatomy.state 에 선언되지 않음`,
        })
      }
    }

    function visitChecks(part: Part) {
      checkStateRef(part, part.writes, 'writes')
      checkStateRef(part, part.binding, 'binding')
      if (part.child) visitChecks(part.child)
      if (part.children) for (const c of part.children) visitChecks(c)
    }
    visitChecks(doc.anatomy)
  }

  // ── (4) data-slot ↔ anatomy 정합 ─────────────────────────────────────────────
  // 컴포넌트 파일에서 data-slot="..." 속성을 추출, anatomy의 part id 경로(`{rootId}-{partId}` 형태)와 비교한다.
  const SLOT_RE = /data-slot=["']([^"']+)["']/g
  const allComponentFiles = await fg(['**/*.tsx', '!**/*.stories.tsx'], {
    cwd: path.join(PACKAGE_ROOT, 'src'),
    absolute: true,
  })

  // anatomy id → 가능한 slot 이름 set.
  //
  // data-slot 명명 컨벤션은 다음 4종을 모두 인정한다:
  //   1. `${doc.id}-${part.id}`        — 표준 (예: tooltip-trigger)
  //   2. `${part.id}` 그대로            — 짧은 컴포넌트의 자기-prefix 자식 (예: accordion-item, file-input-list)
  //   3. `${doc.id}` (root part 단독)   — 흔치 않지만 root에 한해
  //   4. doc.id가 이미 part.id에 prefix로 포함된 경우 그대로 인정 (예: doc=accordion, part=accordion-item)
  const anatomySlotsById = new Map<string, Set<string>>()
  for (const { doc } of anatomyById.values()) {
    const slots = new Set<string>()
    for (const { part } of flattenParts(doc.anatomy)) {
      slots.add(`${doc.id}-${part.id}`) // 표준 namespace
      slots.add(part.id) // bare part id (같은 anatomy 안에서 짧은 형태 허용)
      if (part.id === 'root') slots.add(doc.id)
      // 'avatar-group' 같은 doc.id가 part.id에 이미 들어가 있으면 그대로
      if (part.id.startsWith(`${doc.id}-`)) slots.add(part.id)
    }
    anatomySlotsById.set(doc.id.toLowerCase(), slots)
  }

  for (const file of allComponentFiles) {
    if (SKIP_RE.test(file)) continue
    const text = await readFile(file, 'utf-8')
    const slots = [...text.matchAll(SLOT_RE)].map((m) => m[1])
    if (slots.length === 0) continue

    // 파일 이름에서 anatomy id 추측 (kebab-case): TimetableGrid.tsx → timetablegrid
    const base = path.basename(file, '.tsx').toLowerCase()
    const anatomyKey = [...anatomySlotsById.keys()].find(
      (k) => base === k.replace(/-/g, '') || base === k,
    )
    if (!anatomyKey) continue

    const known = anatomySlotsById.get(anatomyKey)!
    for (const s of slots) {
      // unknown slot — 파일 자체의 prefix(컴포넌트 namespace)와 일치하면 통과
      if (known.has(s)) continue
      // s가 다른 anatomy의 slot일 수도 있으니(예: Tooltip 내부의 자식 anatomy) — 알려진 slot 어디에도 없으면 warn
      const elsewhere = [...anatomySlotsById.values()].some((set) => set.has(s))
      if (!elsewhere) {
        issues.push({
          severity: 'warn',
          file: relTo(file),
          rule: 'anatomy/data-slot-orphan',
          message: `data-slot="${s}"이 anatomy 어디에도 정의되지 않음`,
        })
      }
    }
  }

  // ── 리포트 ──────────────────────────────────────────────────────────────────
  const errors = issues.filter((i) => i.severity === 'error')
  const warns = issues.filter((i) => i.severity === 'warn')

  if (jsonOut) {
    console.log(
      JSON.stringify({ issues, summary: { errors: errors.length, warns: warns.length } }, null, 2),
    )
  } else {
    const groupedByRule = new Map<string, Issue[]>()
    for (const i of issues) {
      if (!groupedByRule.has(i.rule)) groupedByRule.set(i.rule, [])
      groupedByRule.get(i.rule)!.push(i)
    }
    for (const [rule, list] of [...groupedByRule.entries()].sort()) {
      console.log(`\n[${rule}] ${list.length}건`)
      for (const i of list.slice(0, 50)) {
        console.log(`  ${i.severity.toUpperCase()} ${i.file}: ${i.message}`)
      }
      if (list.length > 50) console.log(`  ... 외 ${list.length - 50}건`)
    }
    console.log(
      `\n요약: ${errors.length} errors, ${warns.length} warns (${anatomyFiles.length} anatomy 파일 검사)`,
    )
    void PRIMITIVES_DIR
  }

  if (errors.length > 0 || (strict && warns.length > 0)) {
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
