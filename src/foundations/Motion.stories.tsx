import type { Meta, StoryObj } from '@storybook/react'

import { cn } from '@/utils/cn'

const meta: Meta = {
  title: 'Foundations/Motion',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

const EASING_CONFIGS = [
  {
    token: '--ds-ease-standard',
    utility: 'ease-standard',
    label: 'Standard',
    hint: '감쇠비 1.0 — overshoot 없음. 일상 UI 피드백.',
    cssVar: 'var(--ds-ease-standard)',
  },
  {
    token: '--ds-ease-expressive',
    utility: 'ease-expressive',
    label: 'Expressive',
    hint: '감쇠비 0.4 — bounce. Hero · FAB · toolbar 등장.',
    cssVar: 'var(--ds-ease-expressive)',
  },
  {
    token: '--ds-ease-snappy',
    utility: 'ease-snappy',
    label: 'Snappy',
    hint: '감쇠비 0.75 — 약한 overshoot. 버튼 press · 체크박스.',
    cssVar: 'var(--ds-ease-snappy)',
  },
] as const

const DURATION_CONFIGS = [
  {
    token: '--ds-duration-effects-fast',
    label: 'Effects Fast',
    value: '120ms',
    hint: 'micro-interaction, toggle, checkbox',
    category: 'Effects',
  },
  {
    token: '--ds-duration-effects-default',
    label: 'Effects Default',
    value: '200ms',
    hint: '버튼 press, 색 변화',
    category: 'Effects',
  },
  {
    token: '--ds-duration-effects-slow',
    label: 'Effects Slow',
    value: '400ms',
    hint: '강조 · 주의 환기',
    category: 'Effects',
  },
  {
    token: '--ds-duration-spatial-fast',
    label: 'Spatial Fast',
    value: '150ms',
    hint: 'tooltip, 소형 menu',
    category: 'Spatial',
  },
  {
    token: '--ds-duration-spatial-default',
    label: 'Spatial Default',
    value: '300ms',
    hint: 'navigation, expanding panel/sheet',
    category: 'Spatial',
  },
  {
    token: '--ds-duration-spatial-slow',
    label: 'Spatial Slow',
    value: '500ms',
    hint: 'full-screen · hero 전환',
    category: 'Spatial',
  },
] as const

const ALL_MOTION_TOKENS = [
  {
    token: '--ds-ease-standard',
    utility: 'ease-standard',
    value: 'cubic-bezier(0.2, 0, 0, 1)',
    category: 'Easing',
    hint: 'standard — overshoot 없음',
  },
  {
    token: '--ds-ease-expressive',
    utility: 'ease-expressive',
    value: 'linear(…)',
    category: 'Easing',
    hint: 'expressive — bounce',
  },
  {
    token: '--ds-ease-snappy',
    utility: 'ease-snappy',
    value: 'linear(…)',
    category: 'Easing',
    hint: 'snappy — 약한 overshoot',
  },
  {
    token: '--ds-duration-effects-fast',
    utility: 'duration-effects-fast',
    value: '120ms',
    category: 'Duration / Effects',
    hint: 'micro-interaction, toggle, checkbox',
  },
  {
    token: '--ds-duration-effects-default',
    utility: 'duration-effects-default',
    value: '200ms',
    category: 'Duration / Effects',
    hint: '버튼 press, 색 변화',
  },
  {
    token: '--ds-duration-effects-slow',
    utility: 'duration-effects-slow',
    value: '400ms',
    category: 'Duration / Effects',
    hint: '강조 · 주의 환기',
  },
  {
    token: '--ds-duration-spatial-fast',
    utility: 'duration-spatial-fast',
    value: '150ms',
    category: 'Duration / Spatial',
    hint: 'tooltip, 소형 menu',
  },
  {
    token: '--ds-duration-spatial-default',
    utility: 'duration-spatial-default',
    value: '300ms',
    category: 'Duration / Spatial',
    hint: 'navigation, expanding panel/sheet',
  },
  {
    token: '--ds-duration-spatial-slow',
    utility: 'duration-spatial-slow',
    value: '500ms',
    category: 'Duration / Spatial',
    hint: 'full-screen · hero 전환',
  },
] as const

export const EasingShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="max-w-prose text-sm text-fg-muted">
        박스 위에 마우스를 올리면 각 easing으로 이동합니다 (duration:{' '}
        <code className="text-fg">300ms</code> spatial-default). spring을 CSS{' '}
        <code className="text-fg">linear()</code>로 사전 샘플링한 곡선입니다.
      </p>
      {EASING_CONFIGS.map(({ token, label, hint, cssVar }) => (
        <div
          key={token}
          className="group flex items-center gap-4 rounded-lg border border-border bg-surface p-4"
        >
          <div className="w-32 shrink-0">
            <p className="text-sm font-medium text-fg">{label}</p>
            <p className="text-xs leading-snug text-fg-muted">{hint}</p>
          </div>
          <div className="relative min-w-80 flex-1 overflow-hidden rounded-full bg-muted p-1">
            <div
              className="size-14 rounded-xl bg-primary transition-transform group-hover:translate-x-56"
              style={
                {
                  transitionDuration: 'var(--ds-duration-spatial-default)',
                  transitionTimingFunction: cssVar,
                } as React.CSSProperties
              }
            />
          </div>
          <code className="w-44 shrink-0 font-mono text-xs text-fg-muted">{token}</code>
        </div>
      ))}
    </div>
  ),
}

export const DurationScale: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-sm text-fg-muted">
        박스 위에 마우스를 올리면 각 duration으로 opacity가 변합니다. Effects(비공간)와
        Spatial(위치·크기) 두 범주로 분류됩니다.
      </p>
      {(['Effects', 'Spatial'] as const).map((category) => (
        <div key={category} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-fg">{category}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {DURATION_CONFIGS.filter((d) => d.category === category).map(
              ({ token, label, value, hint }) => (
                <div
                  key={token}
                  className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex h-20 items-center justify-center rounded-lg bg-muted">
                    <div
                      className="size-10 rounded-lg bg-primary transition-opacity group-hover:opacity-20"
                      style={
                        {
                          transitionDuration: `var(${token})`,
                          transitionTimingFunction: 'var(--ds-ease-standard)',
                        } as React.CSSProperties
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-sm font-medium text-fg">{label}</p>
                    <span className="font-mono text-xs font-semibold text-fg-subtle">{value}</span>
                    <p className="text-xs text-fg-muted">{hint}</p>
                  </div>
                  <code className="font-mono text-xs text-fg-muted">{token}</code>
                </div>
              ),
            )}
          </div>
        </div>
      ))}
    </div>
  ),
}

export const Reference: Story = {
  name: 'Motion Tokens Reference',
  render: () => (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-fg">토큰</th>
            <th className="px-4 py-3 text-left font-medium text-fg">Tailwind utility</th>
            <th className="px-4 py-3 text-left font-medium text-fg">값</th>
            <th className="px-4 py-3 text-left font-medium text-fg">분류</th>
            <th className="px-4 py-3 text-left font-medium text-fg">용도</th>
          </tr>
        </thead>
        <tbody>
          {ALL_MOTION_TOKENS.map(({ token, utility, value, category, hint }, idx) => (
            <tr
              key={token}
              className={cn(
                'border-b border-border last:border-0',
                idx % 2 === 0 ? 'bg-surface' : 'bg-background',
              )}
            >
              <td className="px-4 py-3">
                <code className="font-mono text-xs text-fg">{token}</code>
              </td>
              <td className="px-4 py-3">
                <code className="font-mono text-xs text-fg-muted">{utility}</code>
              </td>
              <td className="px-4 py-3">
                <code className="font-mono text-xs text-fg-muted">{value}</code>
              </td>
              <td className="px-4 py-3 text-xs text-fg-muted">{category}</td>
              <td className="px-4 py-3 text-xs text-fg-muted">{hint}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
}
