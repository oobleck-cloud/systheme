import type { Meta, StoryObj } from '@storybook/react'

/**
 * 색 토큰 — 표면 사다리·글자 위계·채움·상태·브랜드 반전을 한 화면에.
 * 툴바 Theme 을 Dark 로 바꿔 두 테마를 같은 배치로 비교한다.
 * 대비 수치는 `pnpm --filter @oobleck/systheme check:contrast` 가 낸다.
 */
const meta: Meta = {
  title: 'Foundations/Color',
  parameters: { layout: 'fullscreen' },
}
export default meta

const SURFACES = [
  ['canvas', 'bg-canvas', '페이지 바탕 (recessed)'],
  ['surface', 'bg-surface', 'well · 워크스페이스 크롬'],
  ['default', 'bg-background', 'raised 카드'],
  ['float', 'bg-float', '팝오버 · 메뉴 · 셀렉트'],
  ['container-low', 'bg-container-low', ''],
  ['container', 'bg-container', ''],
  ['container-high', 'bg-container-high', ''],
  ['overlay (muted)', 'bg-muted', 'hover · 눌린 면'],
] as const

const TEXTS = [
  ['fg', 'text-fg', '본문'],
  ['fg-subtle', 'text-fg-subtle', '보조'],
  ['fg-muted', 'text-fg-muted', '캡션 · 메타'],
  ['fg-disabled', 'text-fg-disabled', '비활성'],
  ['fg-brand', 'text-fg-brand', '링크 · 강조'],
] as const

// Tailwind 는 문자열 조합을 못 보므로 클래스는 전부 리터럴로 적는다.
const STATES = [
  ['success', 'border-success-border bg-success-subtle', 'text-success-text', 'bg-success-primary'],
  ['warning', 'border-warning-border bg-warning-subtle', 'text-warning-text', 'bg-warning-primary'],
  ['error', 'border-error-border bg-error-subtle', 'text-error-text', 'bg-error-primary'],
  ['info', 'border-info-border bg-info-subtle', 'text-info-text', 'bg-info-primary'],
] as const
const TAGS = [
  ['gray', 'bg-tag-gray-subtle text-tag-gray-text'],
  ['red', 'bg-tag-red-subtle text-tag-red-text'],
  ['orange', 'bg-tag-orange-subtle text-tag-orange-text'],
  ['green', 'bg-tag-green-subtle text-tag-green-text'],
  ['teal', 'bg-tag-teal-subtle text-tag-teal-text'],
  ['blue', 'bg-tag-blue-subtle text-tag-blue-text'],
  ['purple', 'bg-tag-purple-subtle text-tag-purple-text'],
] as const
const BRAND = [
  [50, 'bg-brand-50'],
  [100, 'bg-brand-100'],
  [200, 'bg-brand-200'],
  [300, 'bg-brand-300'],
  [400, 'bg-brand-400'],
  [500, 'bg-brand-500'],
  [600, 'bg-brand-600'],
  [700, 'bg-brand-700'],
  [800, 'bg-brand-800'],
  [900, 'bg-brand-900'],
] as const

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-fg-subtle">{title}</h2>
      {children}
    </section>
  )
}

export const Overview: StoryObj = {
  render: () => (
    <div className="min-h-dvh bg-canvas p-8 text-fg">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <Section title="표면 사다리 — 다크에서 한 단이 2~4포인트, 라이트는 흰 카드가 떠오른다">
          <div className="grid grid-cols-4 gap-3">
            {SURFACES.map(([name, cls, note]) => (
              <div
                key={name}
                className={`flex h-24 flex-col justify-between rounded-lg border border-border p-3 ${cls}`}
              >
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-fg-muted">{note}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="글자 위계 × 표면">
          <div className="grid grid-cols-3 gap-3">
            {(['bg-canvas', 'bg-background', 'bg-float'] as const).map((bg) => (
              <div
                key={bg}
                className={`flex flex-col gap-1.5 rounded-lg border border-border p-4 ${bg}`}
              >
                <span className="mb-1 text-xs text-fg-muted">{bg}</span>
                {TEXTS.map(([name, cls, note]) => (
                  <p key={name} className={`text-sm ${cls}`}>
                    {note} — {name}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section title="채움 — 다크는 밝은 채움 + 어두운 글자(M3)">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg">
              primary
            </span>
            <span className="rounded-md bg-primary-hover px-4 py-2 text-sm font-medium text-primary-fg">
              primary-hover
            </span>
            <span className="rounded-md bg-primary-container px-4 py-2 text-sm font-medium text-on-primary-container">
              primary-container
            </span>
            <span className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-fg">
              secondary
            </span>
            <span className="rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-fg">
              destructive
            </span>
            <span className="rounded-md bg-disabled-container px-4 py-2 text-sm font-medium text-on-disabled">
              disabled
            </span>
          </div>
        </Section>

        <Section title="상태 — subtle 웰 위 text, primary 채움">
          <div className="grid grid-cols-4 gap-3">
            {STATES.map(([s, well, text, fill]) => (
              <div key={s} className={`flex flex-col gap-2 rounded-lg border p-3 ${well}`}>
                <span className={`text-sm font-medium ${text}`}>{s}-text on subtle</span>
                <span className={`w-fit rounded-full px-2 py-0.5 text-xs text-white ${fill}`}>
                  {s}-primary
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="태그 팔레트 — 분류 색 (조치 필요도 아님)">
          <div className="flex flex-wrap gap-2">
            {TAGS.map(([c, cls]) => (
              <span key={c} className={`rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
                {c}
              </span>
            ))}
          </div>
        </Section>

        <Section title="브랜드 사다리 — 다크에서 반전 (bg-brand-50 = 연한 선택 배경, text-brand-700 = 짙은 강조)">
          <div className="grid grid-cols-10 gap-1">
            {BRAND.map(([step, cls]) => (
              <div key={step} className={`flex h-12 items-end rounded-md p-1.5 ${cls}`}>
                <span className="text-[10px] text-fg-muted">{step}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <span className="rounded-md border border-primary bg-brand-50 px-3 py-1.5 text-sm text-primary">
              선택된 항목
            </span>
            <span className="rounded-md bg-brand-50 px-3 py-1.5 text-sm text-brand-700">
              brand-700 on brand-50
            </span>
          </div>
        </Section>

        <Section title="구분선">
          <div className="flex flex-col gap-2 rounded-lg bg-background p-4">
            <div className="border-t border-border-subtle pt-1 text-xs text-fg-muted">
              border-subtle
            </div>
            <div className="border-t border-border pt-1 text-xs text-fg-muted">border-default</div>
            <div className="border-t border-border-strong pt-1 text-xs text-fg-muted">
              border-strong
            </div>
          </div>
        </Section>
      </div>
    </div>
  ),
}
