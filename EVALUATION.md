# Design System Evaluation Report

자동 도구가 도입된 직후 (Layer 1 → 4 → 2 → 3 → 5) 디자인시스템 본체에 대해 자동
검증을 한 번 돌린 결과 리포트. 각 항목은 동일 도구를 다시 돌려 재현 가능하다.

> 생성: 도구 도입 시점 / 디자인시스템 87개 anatomy, 47개 stories, 53개 컴포넌트 폴더 기준
>
> 갱신 (2026-05): registry-gaps 부품 **전부** `src/components/`로 이전·구현(`BulkSelectionBar`·`MaskedSecretDisplay`·`FilterChipGroup` 포함 **23개** 패밀리). `@oobleck/systheme`에서 export.

---

## 1. Lint & Format (ESLint 9 + 디자인시스템 커스텀 룰)

**현재**: `pnpm lint` → **0 errors, 47 warnings** (CI 통과)

### 1-1. Errors (직전 8건 → 0건, 본 PR에서 자체 수정)

| 파일                       | 수정                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `Divider.tsx`              | `<hr role="separator">` → `<hr>` (hr 자체가 separator)                                                           |
| `Drawer.stories.tsx` (2건) | `href="#"` → `href="#home"` / `href="#settings"` named anchor                                                    |
| `Popover.tsx`              | trigger div에 `role="button"` + `tabIndex={0}` + Enter/Space `onKeyDown`                                         |
| `TimePicker.tsx` (2건)     | hour/minute `<li>` 옵션에 `tabIndex` + Enter/Space 키보드 핸들러                                                 |
| `TimetableShell.tsx`       | `role="application"`이 의도적으로 모든 키 입력을 가로채는 케이스 — 명시적 `eslint-disable-next-line` + 사유 주석 |

→ **모두 키보드/스크린리더 사용자에게 중요한 a11y 결함이며, 기존 수동 리뷰로는 잡히지 않았던 항목.**

### 1-2. Warnings (47건) — 주요 카테고리

#### 디자인 토큰 우회 (`design-system/no-hardcoded-px`)

| 파일                     | 위반                             |
| ------------------------ | -------------------------------- |
| `Calendar.tsx`           | `text-[10px]`, `h-[18px]`        |
| `Spinner.tsx`            | `border-[1.5px]`, `border-[3px]` |
| `TimePicker.tsx`         | `text-[10px]`                    |
| `TimelineItemBoxed.tsx`  | `text-[10px]`                    |
| `TimelineItemInline.tsx` | `pt-[3px]`, `text-[10px]` (2건)  |
| `boxShape.ts`            | `text-[10px]`                    |

→ Tailwind 의미 스케일(`text-xs`, `border-1.5`) 또는 토큰 변수로 마이그레이션 필요.

#### 인라인 style (`design-system/no-inline-style`)

| 파일                            | 건수 |
| ------------------------------- | ---- |
| `Input.tsx`                     | 3    |
| `Progress.tsx`                  | 1    |
| `Slider.tsx`                    | 1    |
| `TimetableAppointmentBlock.tsx` | 2    |
| `TimetableGrid.tsx`             | 6    |
| `TimetableTimeSlotCell.tsx`     | 2    |
| `anchorContextSurface.tsx`      | 1    |

→ 동적 값이 필요한 케이스는 `style={{ '--ds-*': value }}`(CSS 변수)로 치환 권장. 이 룰은 그 패턴은 자동 허용함.

#### `autoFocus` (`jsx-a11y/no-autofocus`)

`EmojiPicker.tsx:173`, `MultiSelect.tsx:185`, `Select.tsx:144` — 자동 포커스는 스크린리더/키보드 사용자에게 갑작스런 컨텍스트 변경.

---

## 2. Anatomy 검증 (`pnpm validate:ds`)

`0 errors, 72 warnings` (Layer 4 검증기)

### 2-1. data-slot ↔ anatomy 미정합 (36건)

컴포넌트 코드의 `data-slot="…"` 속성 중 anatomy에 등재되지 않은 것:

| 컴포넌트                      | 미등재 slot                                                                                                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RichList`                    | `rich-list-root` (Panel/listbox), `rich-list-items`, `rich-list-row`, `rich-list-body`, `rich-list-empty` — Select 패널과 동일한 스크롤 리스트 셸                 |
| `SearchField`                 | `search-root`, `search-input-segment`, `search-leading`, `search-input`, `search-trailing`, `search-clear`, `search-submit` (`submitLayout`: inline \| connected) |
| `Steps`                       | `steps-item`                                                                                                                                                      |
| `Table`                       | `loading-scrim`, `empty-slot`, `scroll-region`                                                                                                                    |
| `TableHeader`                 | `header-row`                                                                                                                                                      |
| `TimelineItemBoxed/Inline`    | `track`                                                                                                                                                           |
| `TimetableAppointmentBlock`   | `title`, `copy-feedback`, `selection-ring`, `hover-preview-wrap`                                                                                                  |
| `TimetableAppointmentPreview` | `hover-preview-surface`                                                                                                                                           |
| `TimetableController`         | `date-nav`, `view-toolbar`                                                                                                                                        |
| `TimetableGrid`               | `grid-scroll-surface`, `time-rail-labels`                                                                                                                         |
| `TimetableResourceColumn`     | `slot-stack`                                                                                                                                                      |
| `TimetableShell`              | `controller-region`, `grid-region`                                                                                                                                |
| `TimetableTimeSlotCell`       | `copy-feedback`, `cell-hover-preview-wrap`                                                                                                                        |
| `TimetableViewToolbar`        | `include-deactive-row`                                                                                                                                            |

→ 의미: 코드는 슬롯을 노출하는데 anatomy는 그 part를 모름. **AI가 anatomy를 코드 변경에 맞춰 업데이트하지 않은 흔한 패턴.** anatomy-author skill로 재합성 권장.

### 2-2. Story 누락 (35건)

전체 컴포넌트 중 거의 절반에 stories가 없음:

| 카테고리         | 컴포넌트                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| L1/L2 (단일)     | Accordion, Alert, AvatarGroup, Breadcrumb, FileInput, FormField, Kbd, NumberInput, Popover, Progress, Radio/RadioGroup, Slider, Steps, Switch\* |
| Table 패밀리     | TableBody, TableCaption, TableCell, TableFooter, TableFrame, TableHead, TableHeader, TableRow, TableStackedText                                 |
| Timeline 패밀리  | TimelineItemInline                                                                                                                              |
| Timetable 패밀리 | 8개 모두 (Block/Preview/Controller/DateNav/Grid/ResourceColumn/Shell/TimeSlotCell/ViewToolbar)                                                  |
| Primitive        | dropdownPopover                                                                                                                                 |

\* Switch는 본 PR에서 stories 추가 완료.

→ **VR + interaction 테스트가 적용되지 않는 구멍.** 우선순위 1: Switch (완료), Accordion, Alert, Popover, Slider, Progress 등 기본 컴포넌트.

### 2-3. Command part 동작 누락 (1건)

`anatomy/command-no-effect` — command intent를 가진 part 중 `writes`/`emits` 둘 다 없는 케이스.
의미상 모순(사용자 입력을 받는데 아무것도 안 함). anatomy 재분류 또는 코드 보완 필요.

---

## 3. 커버되지 않는 영역 (수동 도입 시 발견)

### 3-0. axe-core a11y baseline 부채 (CI 통과 후 추가 발견)

Storybook test-runner 첫 실행 시 axe-core가 199개 스토리를 검사한 결과:

- **86개 스토리에서 a11y violation 발견** (51 test suites 중 33개 실패)
- 가장 많은 룰: **`color-contrast`** (WCAG 2 AA 대비) — 토큰 색 정의 단계의 부채
- 그 외: `aria-required-children`, `nested-interactive` 등이 분산

이 baseline은 도구가 도입되기 전부터 존재했던 결함이므로, 모든 PR이 baseline으로 인해 빨갛지지 않도록 기본은 **report-only 모드**로 설정.

- 기본: violation 리포트는 콘솔에 출력하되 CI는 통과 (`skipFailures: true`)
- `A11Y_STRICT=1` 환경변수 설정 시 즉시 실패 (baseline 청산 후 활성화 권장)
- 새로 추가하는 스토리 단위로 점진 청산 → 끝나면 STRICT를 default로 전환

P1 추가: 색 토큰 색대비 점검 + axe baseline 청산.

### 3-1. 동작 검증 (interaction)

**현재 인프라**: `@storybook/test-runner` + axe-playwright + `play` 함수.
**현재 구현된 anatomy-driven 테스트**: 27개 컴포넌트 (273개 스토리, 273/273 CI 통과).

- 초기 5개 (Button, Switch, Tooltip, Input, Avatar)
- Tier 1 신규 14개 (Accordion, Alert, AvatarGroup, Breadcrumb, FileInput, FormField, Kbd, NumberInput, Popover, Progress, Radio, RadioGroup, Slider, Steps)
- Tier 2 추가 8개 (Checkbox, IconButton, Tag, Link, Textarea, SearchField, DescriptionRow + EmptyState/Badge 등 시각 컴포넌트는 스킵)

남은 권장 후보 (Tier 3 — 합성 L2):

1. **Select / MultiSelect** — `disclosure` + `overlay-surface` + `select-option(iterates)`
2. **DatePicker / TimePicker** — Calendar 합성 + `disclosure`
3. **Modal / Drawer** — `dismiss` + focus trap + Esc 처리
4. **Pagination** — `stepper × 2` + `select-option(iterates)`
5. **Tabs (TabBar/TabList/TabTrigger)** — `select-option`
6. **Toast / Snackbar** — `notification-region` + auto-dismiss
7. **Sidebar, Calendar, EmojiPicker, Menu** — overlay + 키보드 nav

각 컴포넌트의 anatomy를 보고 `anatomyAssertions` + override + 명시적 ARIA/포커스 검증을 평균 30-60줄로 작성. 컴포넌트군별로 1 PR씩 분할 권장.

Tier 4 (Table/Timeline/Timetable family)는 anatomy ↔ data-slot 미정합 36건을 먼저 정리한 후 진행. Tier 5 (Primitives)는 hooks 단위테스트(Vitest) 별도 PR.

### 3-2. Visual Regression 베이스라인

Chromatic 또는 Lost Pixel 첫 실행 시 모든 스토리의 baseline을 등록해야 함. 현재는 인프라만 셋업.

운영 권장:

- **Chromatic**: 무료 tier(5,000 snapshot/month) 충분. `CHROMATIC_PROJECT_TOKEN` secret만 추가하면 CI가 자동 작동.
- **Lost Pixel(OSS)**: 셀프호스트 가능, 외부 의존 없이 PR diff. baseline은 git에 커밋(`.lostpixel/baseline`).

### 3-3. 사전(intent dictionary) 사용률

자동 분석 스크립트는 아직 없으나, anatomy validator가 미등재 intent는 잡고 있음.
다음 단계로 권장: 한 번도 안 쓰인 intent / 한 컴포넌트만 쓰는 intent 리포트 (`intent-curator` skill의 분석 모드).

---

## 4. 우선순위 권장 (앞으로의 작업)

| 우선순위 | 작업                                                                                                                                                           | 기대 효과                      |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| ~~P0~~ ✓ | ~~Lint error 8건 수정~~ — 본 PR에서 완료                                                                                                                       | CI 통과, 명백한 a11y 결함 제거 |
| ~~P0~~ ✓ | ~~Bundle Size CI 실패~~ — esbuild preset 적용 완료                                                                                                             | 번들 사이즈 회귀 차단          |
| ~~P0~~ ✓ | ~~apps/mvos type-check 실패~~ — paths alias 보강 완료                                                                                                          | 타입 회귀 차단                 |
| ~~P1~~ ✓ | ~~단순 L1 Story 누락 14건~~ — Tier 1 본 PR에서 완료 (story-missing 35→20)                                                                                      | VR/a11y 자동 검증 커버리지 ↑   |
| ~~P1~~ ✓ | ~~기존 stories에 anatomy-driven 검증 부재~~ — Tier 2 8건 본 PR에서 완료                                                                                        | 행동 계약 자동 검증            |
| ~~P0~~ ✓ | ~~Chromatic baseline 미생성~~ — token 활성화 + build #3 / #4 publish 완료 (65 컴포넌트 / 273 스토리)                                                           | 시각 회귀 자동 차단 시작       |
| ~~P1~~ ✓ | ~~Vitest + fast-check 미도입~~ — 본 PR에서 cn / boxShape / buildPaginationRange / anchorPopover 37 tests                                                       | hook/util 회귀 차단            |
| ~~P1~~ ✓ | ~~Playwright CT 미도입~~ — 본 PR에서 Modal focus trap 7 tests + 인프라 셋업 완료                                                                               | 합성 컴포넌트 동적 계약 검증   |
| **P1**   | Tier 3 합성 L2 (Select/MultiSelect/DatePicker/TimePicker/Modal/Drawer/Menu/Tabs/Toast/Snackbar/Sidebar/Pagination/Calendar/EmojiPicker) — 컴포넌트군별 PR 분할 | 핵심 인터랙션 회귀 차단        |
| **P1**   | data-slot ↔ anatomy 미정합 36건 → anatomy 업데이트 또는 코드의 data-slot 정리                                                                                  | AI 작업물의 구조 검증 신뢰도 ↑ |
| **P2**   | Tier 4 — Table/Timeline/Timetable family stories 20건 (anatomy 정합 선결)                                                                                      | 셸 컴포넌트 통합 검증          |
| **P2**   | 인라인 style 13건 → CSS 변수 패턴으로 치환                                                                                                                     | 토큰 우회 차단                 |
| **P2**   | 하드코딩 px 8건 → 의미 스케일로 마이그레이션                                                                                                                   | 토큰 일관성                    |
| **P3**   | Tier 5 Primitives (anchorPopover/dropdown/...) Vitest 단위테스트                                                                                               | hook/util 회귀 차단            |
| **P3**   | axe baseline 부채 청산 → `A11Y_STRICT=1` 기본 전환                                                                                                             | 진짜 a11y 회귀 차단            |
| **P3**   | size-limit 임계 튜닝 (실측: Button 1.1KB, Tooltip 0.8KB, Switch 0.5KB, Calendar 1.4KB, Barrel 30.9KB)                                                          | 번들 사이즈 회귀 차단          |

---

## 5. 자동 검증 스택 요약

| Layer | 도구                               | 명령                                     | 차단 항목                                                  |
| ----- | ---------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| 1     | ESLint 9 + 커스텀 룰 + Prettier    | `pnpm lint`, `pnpm format:check`         | 토큰 우회, 인라인 스타일, a11y, 코드 스타일                |
| 2     | Storybook test-runner + axe + play | `pnpm test-storybook:ci`                 | mount 깨짐, 인터랙션 회귀, ARIA/a11y                       |
| 3     | Chromatic / Lost Pixel             | `pnpm chromatic` / `pnpm vr:lost-pixel`  | 시각적 회귀 (모든 스토리 × 2 breakpoint)                   |
| 4     | 자체 anatomy validator             | `pnpm validate:ds`                       | anatomy schema, intent 사전 정합, data-slot 정합, 커버리지 |
| 5     | size-limit / publint / knip        | `pnpm size`, `pnpm publint`, `pnpm knip` | 번들 사이즈, package export, 죽은 코드                     |

이 5개 layer가 모이면 AI 또는 사람이 디자인시스템에 PR을 올릴 때마다 (1) 코드 컨벤션, (2) 토큰 사용, (3) 동작, (4) 시각, (5) 접근성, (6) 디자인시스템 고유 구조까지 자동으로 검증된다.

---

## 6. Box Language (Surface + Panel) — 2026-05

**문서:** [`PRIMITIVES.md`](./PRIMITIVES.md), Storybook **Foundations / Box Language**

| 레이어         | Primitive                                         | 상태                                                                                         |
| -------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 부착 박스      | `Surface` (`section` \| `control` \| `connected`) | `primitives/surface/` — Table, Timetable, Alert(callout), media widgets 등 마이그레이션 완료 |
| 겹침 박스      | `Panel` (`glass` \| `solid` × shape)              | Select/Menu(glass), Tooltip/Toast(solid compact), Modal/Drawer(solid dialog/edge)            |
| Orchestration  | `OverlayScrim`, `DropdownPopover`, anchor hooks   | Modal/Drawer/CommandPalette backdrop 통합                                                    |
| Implementation | `Box`                                             | Panel scroll hint 전용                                                                       |

**Deprecated (transitional):** `inputVariants` → `surfaceControlVariants`, `ConnectedBox` → `Surface` connected, Panel `variant` → `appearance`+`shape`, `drawerPanelVariants` → `panelVariants`.

**후속 (optional):** ESLint `design-system/prefer-box-language` — 신규 `rounded-lg border bg-background` shell warn.
