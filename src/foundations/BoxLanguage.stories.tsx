import type { Meta, StoryObj } from '@storybook/react'

import { cn } from '@/utils/cn'

const meta: Meta = {
  title: 'Foundations/Box Language',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

const MIGRATION_CHECKLIST = [
  { pr: 'PR1', item: 'Box Language Foundations + PRIMITIVES.md', status: 'done' },
  { pr: 'PR2', item: 'Surface → primitives, kind(section|control|connected)', status: 'done' },
  { pr: 'PR3', item: 'Panel solid + OverlayScrim', status: 'done' },
  { pr: 'PR4', item: 'Floating L2 → Panel solid', status: 'done' },
  { pr: 'PR5', item: 'Modal/Drawer → Scrim + Panel + Surface', status: 'done' },
  { pr: 'PR6', item: 'Attached L2 → Surface section', status: 'done' },
  { pr: 'PR7', item: 'SearchField connected + governance', status: 'done' },
] as const

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}

function PrimitiveRow({
  name,
  layer,
  purpose,
}: {
  name: string
  layer: 'box' | 'implementation' | 'orchestration' | 'out-of-scope'
  purpose: string
}) {
  const layerLabel = {
    box: 'Box language',
    implementation: 'Implementation',
    orchestration: 'Orchestration',
    'out-of-scope': 'Out of scope',
  }[layer]

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="py-2 pr-4 font-mono text-sm text-fg">{name}</td>
      <td className="py-2 pr-4 text-sm text-fg-muted">{layerLabel}</td>
      <td className="py-2 text-sm text-fg-subtle">{purpose}</td>
    </tr>
  )
}

export const Overview: Story = {
  name: 'Overview',
  render: () => (
    <div className="mx-auto max-w-3xl space-y-8 text-sm text-fg">
      <DocSection title="Box Language — 화면을 두 단어로 읽기">
        <p className="leading-relaxed text-fg-subtle">
          UI에서 <strong className="font-medium text-fg">보이는 박스</strong>는{' '}
          <code className="text-fg">Surface</code>(부착)와 <code className="text-fg">Panel</code>
          (겹침) 두 primitive로만 설명합니다. Portal, Focus trap, Scrim, hover delay 등은 박스
          언어가 아닌 orchestration·timing 레이어입니다.
        </p>
        <ul className="list-inside list-disc space-y-1 text-fg-subtle">
          <li>
            <code className="text-fg">Surface</code> — 레이아웃에 붙은 in-flow 박스 (섹션, 필드
            트리거, connected 입력)
          </li>
          <li>
            <code className="text-fg">Panel</code> — 다른 콘텐츠 위에 떠 있는 박스 (드롭다운, 툴팁,
            다이얼로그 껍데기)
          </li>
        </ul>
      </DocSection>

      <DocSection title="Composition recipes">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-3 py-2 text-xs font-medium text-fg-muted">L2</th>
                <th className="px-3 py-2 text-xs font-medium text-fg-muted">조립</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-3 py-2 font-mono text-xs">Select</td>
                <td className="px-3 py-2 text-fg-subtle">Surface(control) + Panel(glass list)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">Tooltip</td>
                <td className="px-3 py-2 text-fg-subtle">Panel(solid compact)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">Modal</td>
                <td className="px-3 py-2 text-fg-subtle">
                  OverlayScrim + Panel(solid dialog) + Surface(section)
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">Drawer</td>
                <td className="px-3 py-2 text-fg-subtle">
                  OverlayScrim + Panel(solid edge) + Surface(section)
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">Table</td>
                <td className="px-3 py-2 text-fg-subtle">Surface(section)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection title="Migration checklist">
        <ul className="space-y-2">
          {MIGRATION_CHECKLIST.map(({ pr, item, status }) => (
            <li
              key={pr}
              className={cn(
                'flex items-start gap-2 rounded-md border border-border px-3 py-2',
                status === 'done' ? 'bg-success-bg/30' : 'bg-surface',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 size-2 shrink-0 rounded-full',
                  status === 'done' ? 'bg-success-primary' : 'bg-fg-muted',
                )}
                aria-hidden
              />
              <span>
                <span className="font-mono text-xs text-fg-muted">{pr}</span>{' '}
                <span className="text-fg-subtle">{item}</span>
              </span>
            </li>
          ))}
        </ul>
      </DocSection>
    </div>
  ),
}

export const PrimitiveCatalog: Story = {
  name: 'Primitive catalog',
  render: () => (
    <div className="mx-auto max-w-3xl">
      <p className="mb-4 text-sm text-fg-subtle">
        상세 참조: <code className="text-fg">packages/design-system/PRIMITIVES.md</code>
      </p>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="px-3 py-2 text-xs font-medium text-fg-muted">Primitive</th>
              <th className="px-3 py-2 text-xs font-medium text-fg-muted">Layer</th>
              <th className="px-3 py-2 text-xs font-medium text-fg-muted">Role</th>
            </tr>
          </thead>
          <tbody className="px-3">
            <PrimitiveRow
              name="Surface"
              layer="box"
              purpose="부착 박스 — section / control / connected"
            />
            <PrimitiveRow
              name="Panel"
              layer="box"
              purpose="겹침 박스 — glass(overlay|list) / solid(compact|dialog|edge)"
            />
            <PrimitiveRow
              name="Box"
              layer="implementation"
              purpose="Panel 스크롤 힌트 기반 — 직접 사용 지양"
            />
            <PrimitiveRow
              name="OverlayScrim"
              layer="orchestration"
              purpose="Modal/Drawer dimmer — 박스 아님"
            />
            <PrimitiveRow
              name="DropdownPopover"
              layer="orchestration"
              purpose="앵커 open/close + dismiss shell"
            />
            <PrimitiveRow
              name="anchorPopover hooks"
              layer="orchestration"
              purpose="pointer outside, Escape, focus trap"
            />
            <PrimitiveRow
              name="AnchorContextSurface"
              layer="orchestration"
              purpose="커스텀 trigger + Panel 패턴"
            />
            <PrimitiveRow name="Dropdown" layer="orchestration" purpose="L1 disclosure + Panel" />
            <PrimitiveRow
              name="animation / timing"
              layer="out-of-scope"
              purpose="L2 로컬 (Tooltip delay 등)"
            />
          </tbody>
        </table>
      </div>
    </div>
  ),
}

export const SelectExample: Story = {
  name: 'Example — Select',
  render: () => (
    <div className="mx-auto max-w-md space-y-3 text-sm">
      <p className="text-fg-subtle">
        Select = Surface(control) 트리거 + Panel(glass list). orchestration은 DropdownPopover.
      </p>
      <div className="relative rounded-lg border border-dashed border-border p-4">
        <div className="mb-2 rounded-lg border border-border bg-background px-3 py-2 text-fg-muted">
          Surface(control) — combobox trigger
        </div>
        <div className="rounded-md bg-background/80 p-2 shadow-panel backdrop-blur-xl">
          Panel(glass list) — options
        </div>
      </div>
    </div>
  ),
}

export const ModalExample: Story = {
  name: 'Example — Modal',
  render: () => (
    <div className="mx-auto max-w-md space-y-3 text-sm">
      <p className="text-fg-subtle">
        Modal = OverlayScrim + Panel(dialog) + Surface(section). Focus trap은 Modal L2.
      </p>
      <div className="relative overflow-hidden rounded-lg border border-border">
        <div className="bg-inverse/20 px-4 py-8 text-center text-xs text-fg-muted">
          OverlayScrim
        </div>
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="w-full max-w-xs overflow-hidden rounded-xl border border-border-subtle bg-background shadow-dialog">
            <div className="border-b border-border px-3 py-2 text-xs font-medium">
              Surface header
            </div>
            <div className="px-3 py-2 text-fg-subtle">Surface body</div>
          </div>
        </div>
      </div>
    </div>
  ),
}
