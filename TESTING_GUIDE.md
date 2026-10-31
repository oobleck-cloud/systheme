# Testing Guide — 컴포넌트 복잡도별 도구 매핑

본 디자인시스템은 [`EVALUATION.md`](./EVALUATION.md)의 5계층 도구 스택 위에 동작합니다. 다만 **모든 컴포넌트가 같은 도구로 검증되지 않습니다.** 컴포넌트의 계약 복잡도가 올라갈수록 추가 도구가 필요합니다. 이 문서는 그 매핑 가이드입니다.

> 현재 실제로 활성화된 도구: ESLint 9 + 자체 룰 / Storybook test-runner + axe-playwright / 자체 anatomy validator / size-limit / knip / publint.
> Chromatic은 **설정 파일만 있고 `CHROMATIC_PROJECT_TOKEN` 부재로 CI에서 자동 skip 중**(의도된 게이팅). Lost Pixel은 OSS fallback 설정만 존재.

---

## 컴포넌트 복잡도 등급과 도구 매핑

| 복잡도 등급                    | 정의                                                                                                                                                   | 적합한 도구 (현재 도구로 충분)                                     | 추가 도구 (현재로 부족)                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **L0 — 시각 단순**             | binding 없음, props로 렌더만 (Badge, Spinner, Skeleton, IconBox, TextBox, AccentStripe, Kbd)                                                           | Storybook play(자동 mount) + axe + 시각 회귀(Chromatic/Lost Pixel) | —                                                                                                        |
| **L1 — 단일 행동**             | 하나의 intent + 단순 상태 (Button, Switch, Checkbox, Radio, Tag, Link, IconButton)                                                                     | `anatomyAssertions` + 짧은 명시 contract 스토리                    | —                                                                                                        |
| **L2 — 합성/오버레이**         | disclosure↔overlay 동기화, focus trap, Esc, scroll lock, ARIA 연결 (Modal, Drawer, Menu, Popover, Select, MultiSelect, Tabs, Tooltip)                  | Storybook play + axe(현재 도구로 70%)                              | **+ Playwright Component Testing** (실 브라우저 focus/포인터, 멀티 윈도우, scroll, viewport 변경)        |
| **L3 — 키보드 그리드/셸**      | Arrow nav, type-ahead, virtual scroll, drag, selection rectangle (Calendar, DatePicker, TimePicker, Pagination, Sidebar, EmojiPicker, Timeline, Table) | Playwright CT 또는 Storybook play(키 이벤트 한정)                  | **+ Playwright `keyboard.press`/`drag`** + **`@testing-library/react-hooks`** (hooks unit)               |
| **L4 — 시간/공간 좌표 시스템** | drag-create, copy/paste, dual-arrow burst, virtual viewport, animation timing (Timetable family, 향후 Canvas/Whiteboard)                               | Storybook play 부적합 — 정확한 시간/픽셀 제어 필요                 | **+ Playwright + clock 제어** + **Vitest property-based** (fast-check) + **vitest-canvas-mock**(필요 시) |
| **Pure logic**                 | 시각 없는 hooks/utils (`anchorPopover`, `dropdown`, `buildPaginationRange`, `cn`)                                                                      | — (Storybook 부적합)                                               | **Vitest + Testing Library** (jsdom/happy-dom) — pure unit                                               |

---

## 어떤 도구를 언제 추가할지

### 1. Playwright Component Testing (CT)

**언제 추가하나**: L2/L3 컴포넌트 중 다음 중 하나라도 해당:

- **실제 focus 거동** 검증이 필요할 때 (Modal focus trap, Drawer focus restore)
- **실 viewport / scroll** 거동 (Sticky header, virtual list, infinite scroll)
- **다중 브라우저 엔진 분기**가 의심될 때 (Safari/WebKit의 input 거동, Firefox range thumb)
- **포인터 이벤트 + drag**가 핵심 (Slider drag, Resizer, Drag-drop)
- **clock/timer 제어**가 필요할 때 (Toast auto-dismiss, debounced search)

**왜 Storybook play로 안 되는가**:

- Storybook test-runner는 jsdom 위가 아닌 실 브라우저에서 돌긴 하지만, **단일 페이지 안에서 스토리 격리가 약함** — focus trap이 다른 스토리로 새는 등 race가 잦음.
- **clock 제어 API가 약함** — `setTimeout`을 직접 만지거나 fake timer 옵션이 없음.
- **viewport / device emulation**이 1차 시민이 아님.
- **다중 페이지(예: window.open, postMessage)** 시뮬레이션 어려움.

**현재 디자인시스템에서의 적용 후보**:

| 컴포넌트                      | 검증 항목                                       | Playwright CT가 필요한 이유                                                      |
| ----------------------------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| **Modal / Drawer**            | focus trap, focus restore on close, scroll lock | Storybook 환경은 활성 스토리 frame이 단일이라 focus trap이 검증 시점과 맞지 않음 |
| **Toast / Snackbar**          | auto-dismiss 타이밍, stacked instance ordering  | fake timer 제어 필요                                                             |
| **MultiSelect / EmojiPicker** | typeahead, 가상 스크롤 검색 결과 정렬           | 실 키보드 이벤트 + scroll measurement                                            |
| **Calendar / DatePicker**     | Arrow/PageUp/PageDown nav, locale 분기          | 키보드 시퀀스 + locale provider 분리                                             |
| **Slider / NumberInput drag** | pointer drag, touch                             | Storybook userEvent는 pointer drag가 미흡                                        |

도입 형태:

```bash
pnpm add -D --filter @oobleck/systheme @playwright/experimental-ct-react
```

`playwright-ct.config.ts`에 다음 패턴:

```ts
import { defineConfig, devices } from '@playwright/experimental-ct-react'

export default defineConfig({
  testDir: './src',
  testMatch: /.*\.ct\.tsx?$/,
  use: {
    ctViteConfig: { resolve: { alias: { '@': './src' } } },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})
```

**파일 컨벤션**: `Modal.ct.tsx` (Storybook stories와 별도), `expect(page).toHaveFocus(...)` 같은 실 브라우저 단언 사용.

### 2. Vitest + Testing Library (jsdom)

**언제 추가하나**:

- **시각이 없는 순수 hooks/utils** 테스트 (`primitives/anchorPopover`의 `usePointerDownOutside`, `useDismissOnEscape`, `utils/buildPaginationRange`, `utils/cn`).
- **컴포넌트의 "행동" 단위로 빠른 회귀** (Storybook 빌드 없이 ms 단위 실행).
- **Snapshot이 의미 있는 곳** (예: `cn` 결과 클래스 정렬, anatomy JSON 생성기).

**왜 Storybook으로 안 되는가**: Storybook 한 사이클은 vite 빌드 + 브라우저 mount + axe 까지 ~수초/스토리. hook 100개 테스트면 분 단위로 폭증. Vitest는 jsdom + esbuild로 1000개 테스트 초 단위.

**도입 형태**:

```bash
pnpm add -D --filter @oobleck/systheme vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom vitest-axe
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
  },
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

`src/test/setup.ts`에 `import '@testing-library/jest-dom/vitest'`.

**파일 컨벤션**: `usePointerDownOutside.test.ts`, `buildPaginationRange.test.ts` — 컴포넌트 폴더 내 같은 디렉토리.

### 3. Property-based testing (fast-check)

**언제**:

- `buildPaginationRange(currentPage, totalPages, surrounding)` 같은 **순수 함수의 모든 경계값** 테스트
- `cn()`, `boxShape()`, density utils의 무작위 입력 안정성

**왜**: 손으로 적은 케이스가 놓치는 경계 (max int, 빈 배열, 음수 step, 0-step) 자동 탐색.

```ts
import fc from 'fast-check'
import { buildPaginationRange } from '@/utils/buildPaginationRange'

test('paginationRange always contains current and is within [1, total]', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 1000 }),
      fc.integer({ min: 1, max: 1000 }),
      (current, total) => {
        const range = buildPaginationRange(Math.min(current, total), total, 1)
        return range.includes(current) && range.every((p) => p >= 1 && p <= total)
      },
    ),
  )
})
```

### 4. 시각 회귀 (VR) — 현재 미활성, 활성화 옵션

**현재 상태**: Chromatic config만 있고 토큰 부재로 CI에서 자동 skip. Lost Pixel(OSS fallback) 설정도 있으나 baseline 미생성.

**언제 어느 도구**:

| 시나리오                                      | 권장                                                    |
| --------------------------------------------- | ------------------------------------------------------- |
| 무료 tier 충분 + Storybook 표준 워크플로      | **Chromatic** (가장 매끄러운 통합, TurboSnap 비용 절감) |
| 셀프호스트 / SaaS 외부 의존 거부              | **Lost Pixel**(OSS)                                     |
| 이미 Playwright CT 사용 중 + VR도 같은 곳에서 | **Argos CI** (Playwright snapshot과 호환)               |
| 풍부한 baseline 비교 UI / 팀 리뷰 워크플로    | **Chromatic** > Argos > Lost Pixel                      |

**Chromatic 활성화 절차**:

```bash
# 1. 프로젝트 등록 후 토큰 받기 (https://chromatic.com)
# 2. CI secrets에 CHROMATIC_PROJECT_TOKEN 추가
# 3. 첫 baseline (한 번만, 메인 브랜치에서):
pnpm --filter @oobleck/systheme chromatic --auto-accept-changes
```

CI가 자동으로 모든 스토리 × 2 breakpoint로 스크린샷 → baseline diff.

**Lost Pixel 활성화** (OSS):

```bash
pnpm --filter @oobleck/systheme storybook:build
pnpm --filter @oobleck/systheme vr:lost-pixel:update  # baseline 생성, .lostpixel/baseline에 git commit
# CI에서:
pnpm --filter @oobleck/systheme vr:lost-pixel
```

baseline은 git에 커밋. PR마다 `.lostpixel/difference/`에 diff 이미지 생성.

### 5. 데이터 시각화 / Canvas / WebGL

**현재 디자인시스템엔 해당 컴포넌트 없음** — Timeline은 DOM, Timetable도 DOM grid.
향후 Chart, Canvas-based whiteboard, 3D 등을 추가할 경우:

- **Canvas snapshot은 Chromatic/Lost Pixel가 정상 처리** (DOM이 아닌 픽셀 비교라 오히려 안정)
- **인터랙션은 Playwright CT로 mouse coords + viewport 측정**
- **WebGL은 기준 GPU 환경 고정 필요** — Docker로 chromium 동일 빌드 사용 권장

---

## 디자인시스템 컴포넌트 군별 도구 매핑

| 컴포넌트군                                                                      | 추천 도구 조합                                             | 이유                                                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| **단순 L1** (Button, Tag, Badge, ...)                                           | Storybook play + axe                                       | 현재로 충분                                                         |
| **Field family** (Input, Textarea, NumberInput, Slider, FileInput, FormField)   | Storybook play + axe + (Slider drag만 Playwright CT)       | Slider thumb drag는 pointer 이벤트라 Storybook userEvent 한계       |
| **Form composite** (Checkbox, Radio, Switch, RadioGroup)                        | Storybook play + axe                                       | 현재로 충분                                                         |
| **Overlay** (Modal, Drawer, Menu, Popover, Tooltip)                             | **Playwright CT** + Storybook play(보조)                   | focus trap, scroll lock, multi-overlay stacking                     |
| **Picker** (Select, MultiSelect, DatePicker, TimePicker, EmojiPicker, Calendar) | **Playwright CT** + property-based for date math           | typeahead, Arrow nav, 가상 스크롤, locale                           |
| **Notification** (Toast, Snackbar, Alert)                                       | **Playwright CT** + clock 제어                             | auto-dismiss timer, stacking, swipe-to-dismiss                      |
| **Navigation** (TabBar, Sidebar, Breadcrumb, Pagination, Steps)                 | Storybook play + axe + (Pagination range는 fast-check)     | 대부분 단순, Pagination은 순수 함수 검증이 가치                     |
| **Data shell** (Table, Timeline)                                                | **Playwright CT** + Storybook play(시각만)                 | sticky header, virtual scroll, sort/filter, drag-resize column      |
| **Time grid** (Timetable family)                                                | **Playwright CT + clock 제어 + property-based(시간 계산)** | dual-arrow burst, copy/paste, drag-create, hover-preview, animation |
| **Primitives** (`anchorPopover`, `dropdown`, ...)                               | **Vitest + Testing Library**                               | hooks 단위 — Storybook 부적합                                       |
| **Utils** (`cn`, `buildPaginationRange`, `boxShape`)                            | **Vitest + fast-check**                                    | 순수 함수 — 무작위 경계값 테스트                                    |

---

## 본 PR 시점의 권장 도입 순서

1. **즉시 도입 가능 (이번 PR 후속)**:
   - **Vitest + Testing Library** for primitives + utils — 5분 셋업, 즉각 ROI
   - **Chromatic 토큰 등록** — 시각 회귀의 사실상 표준

2. **Tier 3 계약 테스트와 함께 도입**:
   - **Playwright CT** for Modal/Drawer/Menu/Popover의 focus trap
   - clock 제어 API for Toast/Snackbar

3. **Tier 4 셸 컴포넌트 작업과 함께**:
   - Playwright CT for Table virtual scroll, Timeline density
   - fast-check for buildPaginationRange, slot index math

4. **고급 (필요 시)**:
   - axe baseline 청산 후 `A11Y_STRICT=1` 기본화
   - Stryker mutation testing for utils (회귀 의미 검증)
   - bundle visualizer (rollup-plugin-visualizer) for size-limit 회귀 시 분석

---

## 도구별 한 줄 요약 — 어떤 회귀를 잡는가

| 도구                            | 잡는 회귀                                                      |
| ------------------------------- | -------------------------------------------------------------- |
| ESLint + 자체 룰                | 토큰 우회, 인라인 스타일, jsx-a11y 정적 위반                   |
| Prettier                        | 포맷 회귀                                                      |
| TypeScript                      | 타입 회귀                                                      |
| validate-ds                     | anatomy/intent 사전, data-slot ↔ anatomy 정합                  |
| Storybook test-runner           | mount 깨짐, 단순 인터랙션, 실 브라우저 axe                     |
| **Playwright CT** _(추가 권장)_ | focus trap, scroll/viewport, pointer drag, multi-engine, clock |
| **Vitest + RTL** _(추가 권장)_  | hooks/utils 단위, snapshot, mocking                            |
| **fast-check** _(추가 권장)_    | 순수 함수의 경계값                                             |
| Chromatic / Lost Pixel          | 시각적 회귀                                                    |
| size-limit                      | 번들 사이즈 회귀                                               |
| knip / publint                  | 죽은 코드, 잘못된 export                                       |

---

---

## 부록 A — Table·Timetable 같은 "복잡 정책 UI"를 위한 도구 매트릭스

Tier 3 합성 L2 까지는 본 가이드 위쪽의 도구로 충분합니다. Tier 4 (Table family, Timeline family, Timetable family)부터는 정책의 결합 폭이 넓어 **현재 도구(Storybook play + axe + Chromatic 시각 회귀)로는 부족**합니다. 이 부록은 그 영역에서 추가로 도입할 도구를 명시합니다.

### 왜 현재 도구로 부족한가

| 정책 차원          | 예시 (Table)                                                                                                                                    | 현재 도구의 한계                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **선택 모델**      | single / multi / range (shift-click) / select-all / 키보드 Space-Shift+ArrowDown                                                                | Storybook play의 `userEvent`는 modifier key 조합과 다중 click 시퀀스를 부정확하게 합성. axe는 선택 정책을 모름. Chromatic은 시각만 비교. |
| **정렬·필터**      | 컬럼 클릭 정렬 / 다중 정렬 / debounced 글로벌 필터 / 컬럼 필터                                                                                  | `userEvent.type` 후 debounce를 기다리려면 fake clock 필요 — Storybook test-runner 미지원.                                                |
| **가상화**         | virtual scroll (10k 행), sticky header, sticky 첫 컬럼                                                                                          | jsdom·storybook iframe은 `IntersectionObserver`/`ResizeObserver`/scroll layout 측정이 부정확. 실 brower viewport 측정 필요.              |
| **컬럼 조작**      | drag-resize, drag-reorder                                                                                                                       | `userEvent`는 drag 시퀀스(`pointerdown → pointermove × N → pointerup`)와 native HTML5 DnD 둘 다 빈약.                                    |
| **편집·검증**      | inline edit, validation, optimistic update, undo                                                                                                | 비동기 흐름 + 상태 머신 + cleanup. Storybook 단일 play에서 풀어쓰면 수백 줄.                                                             |
| **포커스·a11y**    | role=grid + aria-rowindex/colindex, screen reader announce, focus restore on layout shift                                                       | axe는 정적 스냅샷만 본다. 동적 announce 검증은 `aria-live` 메시지 확인이 따로 필요.                                                      |
| **Timetable 좌표** | dual-arrow burst (같은 방향 키 N회 내 deactive 해제), drag-create selection rectangle, copy/paste 키보드, hover preview, shake animation 타이밍 | 픽셀 좌표 + clock + key-burst window 모두 동시 검증해야 — Storybook play에서 안정적이지 않음.                                            |

### 권장 추가 도구 — 우선순위 순

#### 1. **Playwright Component Testing (CT)** — 거의 확실히 필요

**커버**: focus 거동, scroll 측정, drag(pointerdown/move/up), 다중 브라우저, viewport 변경, clock 제어, screenshot, trace.

**왜 1순위**:

- 실 브라우저(Chromium/WebKit/Firefox)에서 컴포넌트만 격리 마운트. Storybook iframe과 다르게 매 테스트 fresh.
- `page.clock.install()`로 시간 동결, `page.keyboard.down('Shift')` 후 click으로 정확한 modifier 조합.
- `expect(locator).toHaveScreenshot()`로 시각 회귀까지 같은 도구로 처리(Argos CI와 페어링하면 SaaS 리뷰까지).
- Chromatic을 굳이 안 써도 됨(또는 보완 관계).

**Table에 적용 예**:

```ts
test('shift-click multi-select range', async ({ mount, page }) => {
  const table = await mount(<Table rows={...} />)
  await table.locator('[data-row-key="2"] [role=checkbox]').click()
  await page.keyboard.down('Shift')
  await table.locator('[data-row-key="6"] [role=checkbox]').click()
  await page.keyboard.up('Shift')
  await expect(table).toHaveAttribute('data-selected-count', '5')
})

test('virtual scroll keeps focus on offscreen row', async ({ mount, page }) => {
  const table = await mount(<Table rows={tenThousand} />)
  await table.locator('[data-row-key="42"] button').focus()
  await page.mouse.wheel(0, 50_000)   // 한참 스크롤
  await expect(table.locator(':focus')).toHaveAttribute('data-row-key', '42')
})
```

#### 2. **Vitest + fake timers + Testing Library** — 정책 머신 격리

**커버**: 순수 hooks/유틸/상태 머신, debounce, throttle, 시간 종속 로직.

**왜 필요**:

- Table의 정렬 비교 함수, Timetable의 `slotMinuteForIndex` / `addCalendarDays` / `shouldShowAppointmentsForCursor` 같은 순수 함수는 컴포넌트 마운트 없이 검증해야 빠르고 견고.
- `vi.useFakeTimers()` + `vi.advanceTimersByTime(800)`으로 dual-arrow burst window의 모든 분기를 체계적으로.
- ms 단위 회귀를 검증하기에 Storybook은 무겁고 느림.

```ts
import { vi, test, expect } from 'vitest'
test('dual-arrow burst within 400ms releases deactive', () => {
  const policy = createDeactiveBurstPolicy({ windowMs: 400 })
  vi.useFakeTimers()
  policy.feed('ArrowRight')
  vi.advanceTimersByTime(200)
  policy.feed('ArrowRight')
  expect(policy.released).toBe(true)
  policy.reset()
  policy.feed('ArrowRight')
  vi.advanceTimersByTime(500)
  policy.feed('ArrowRight')
  expect(policy.released).toBe(false)
})
```

#### 3. **fast-check** (property-based testing) — 좌표·범위 수학

**커버**: `buildPaginationRange`, `appointmentsForSlot`, `slotMinuteForIndex`, `parseDateKey`, `formatMinuteRange` 같은 순수 함수의 무작위 입력 invariants.

**왜 필요**: Table의 page range, Timetable의 분 단위 좌표 변환은 사람이 수기로 케이스를 다 못 만듭니다. property test가 반례를 자동 탐색.

```ts
test('slotMinuteForIndex inverse of indexFromMinute', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 1440 / 5 - 1 }),
      fc.integer({ min: 1, max: 60 }),
      (idx, slotMin) => slotMinuteForIndex(slotMin, idx) === idx * slotMin,
    ),
  )
})
```

#### 4. **모델 기반 테스팅 (XState 또는 fast-check commands API)** — 선택/편집 정책

**커버**: "선택 → 편집 → 취소 → 재선택" 같은 **유효한 행동 시퀀스를 자동 생성**하고 모든 path에서 invariant가 깨지지 않는지 검증.

**왜 필요**: Table의 selection × edit × validation × optimistic update 결합은 손으로 만든 테스트로는 조합 폭발을 못 따라잡음. 모델은 한 번 정의하면 fast-check가 무작위 시퀀스로 깊은 path까지 탐색.

```ts
class SelectionModel {
  selected = new Set<string>()
  toggle(id: string) { ... }
  selectRange(from: string, to: string) { ... }
}
class SelectionRealCheck extends fc.Command<SelectionModel, RealTable> { ... }
fc.assert(fc.property(
  fc.commands([toggleCommand, selectRangeCommand, selectAllCommand], 100),
  (cmds) => fc.modelRun(() => ({ model: new SelectionModel(), real: realTable }), cmds),
))
```

XState로 정책을 머신으로 정의해두면 머신 자체가 문서가 되고 visualizer로 시각화도 됩니다. Timetable의 deactive-burst 같은 시간성 정책이 가장 큰 수혜.

#### 5. **Mutation testing (Stryker)** — 테스트가 진짜 의미 있는지 메타 검증

**언제**: 위 1~4가 어느 정도 자리 잡은 후. 핵심 utils (Pagination, Timetable 좌표 함수)에 한정 적용.

**얻는 것**: "테스트는 통과하지만 실제 분기는 검증 안 함"을 정량적으로 드러냄. 70% mutation score 같은 목표를 잡고 테스트 품질 게이팅.

#### 6. **시각 회귀 도구** — 정정 (사용자 오해)

> 현재는 **Chromatic이 활성화되지 않았습니다.** `chromatic.config.json`만 있고 `CHROMATIC_PROJECT_TOKEN` 부재로 CI에서 자동 skip. Lost Pixel(OSS)도 설정만 있고 baseline 미생성.

따라서 "Chromatic으로 시각 회귀를 잡고 있다"는 가정 위에 Table 작업을 진행하면 안 됩니다. Table family 도입 전 다음 중 하나를 활성화 권장:

- **Chromatic**: token 등록 → 첫 baseline. SaaS, 무료 tier 5,000 snapshot/월 충분
- **Argos CI**: Playwright CT 기반, OSS 친화. 이미 Playwright CT를 도입한다면 자연스러움
- **Lost Pixel(OSS 셀프)**: baseline 이미지를 git 커밋. 외부 의존 거부 시

복잡 정책 UI에서는 시각 회귀가 **렌더된 상태에 대한 picture proof**로 동작합니다 — 정렬 후 첫 행이 진짜 바뀌었는지, virtual list가 sticky header를 가리지 않는지, drag preview가 정확한 위치인지 등. 이런 검증은 행동 테스트와 보완적이지 대체 관계가 아닙니다.

### 도입 순서 제안 (Tier 4 진입 시)

1. **Playwright CT** 도입 → Modal/Drawer/Menu의 focus trap 먼저(Tier 3 보강), 그 후 Table 진입 직전 Pagination/Selection 시나리오 테스트로 확장.
2. **Vitest + fast-check** 동시 도입 → Timetable 좌표/시간 함수, Pagination range, Date math.
3. **VR 활성화** (Chromatic 또는 Argos) → Table baseline 확보. 회귀 차단 시작.
4. **모델 기반 테스팅** → Table selection/edit, Timetable deactive-burst 정책 안정화 후.
5. **Stryker** → utils 한정. "이 함수 변경에 테스트가 정말 반응하는가" 검증.

### 한 줄 결정 가이드

| 질문                                                                                   | 답                                               |
| -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| "버튼 누르면 핸들러 호출되는가?"                                                       | Storybook play (현재 도구)                       |
| "Esc로 모달 닫히고 트리거로 포커스 돌아오는가?"                                        | **Playwright CT**                                |
| "100k 행 가상 스크롤이 sticky header를 가리지 않는가?"                                 | **Playwright CT** + VR                           |
| "이 페이지 범위 함수가 모든 입력에서 invariant를 지키는가?"                            | **fast-check + Vitest**                          |
| "정렬 + 필터 + 선택을 무작위로 섞었을 때 selectedKeys 합집합이 항상 row 부분집합인가?" | **모델 기반 테스팅 + fast-check commands**       |
| "이 UI가 어제와 픽셀이 같은가?"                                                        | **Chromatic / Argos / Lost Pixel**               |
| "이 hook이 unmount 후 listener를 정리하는가?"                                          | **Vitest + Testing Library**                     |
| "이 텍스트가 스크린리더 사용자에게 announce 되는가?"                                   | Playwright CT + `aria-live` 직접 검증 (axe 한계) |

---

## 의도적으로 추천하지 않는 것

- **Cypress Component Testing**: Playwright CT와 거의 동등한 가치이지만 **Cypress는 다중 페이지/window를 1차 시민으로 안 다룸**, 실 브라우저 distribution도 좁음. 이미 Playwright 인프라가 있으면 Cypress 도입은 중복.
- **Jest**: Vitest가 더 빠르고 ESM 친화적이며 Vite 설정과 자연스럽게 맞물림. 신규 도입 시 Jest는 권장 안 함.
- **Snapshot test 남발**: 컴포넌트 자체보다 utils, AST 변환, anatomy 생성기 같은 결정적 출력에만 사용 권장. UI 스냅샷은 시각 회귀(Chromatic)에 위임.
- **e2e (Playwright in browser context)**: 디자인시스템은 단일 컴포넌트의 격리된 검증이 핵심. Full e2e는 `apps/mvos`의 책임.
