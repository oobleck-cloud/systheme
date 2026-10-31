import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Components/Charts/Overview',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj

const CHART_CATALOG = [
  {
    group: 'Shell',
    description: '모든 차트가 공유하는 프레임·범례·로딩/빈 상태 셸 (앱에서 직접 import하지 않음)',
    items: [{ name: 'ChartFrame', use: '제목, 범례, empty/loading' }],
  },
  {
    group: 'Cartesian',
    description: '축 기반 비교·추세·분포',
    items: [
      { name: 'BarChart', use: '범주 비교, 스택/100%' },
      { name: 'LineChart', use: '시계열·추세' },
      { name: 'AreaChart', use: '누적·채널 비중' },
      { name: 'ScatterPlot', use: '두 지표 상관' },
      { name: 'BubbleChart', use: '3차원 산점' },
      { name: 'Histogram', use: '연속값 분포' },
      { name: 'BoxPlot', use: '사분위·이상치' },
    ],
  },
  {
    group: 'Part-to-whole',
    description: '전체 대비 구성·계층',
    items: [
      { name: 'PieChart', use: '비율·구성' },
      { name: 'TreemapChart', use: '계층 면적' },
      { name: 'SunburstChart', use: '방사형 계층' },
    ],
  },
  {
    group: 'Matrix & calendar',
    description: '격자·시간 패턴',
    items: [
      { name: 'HeatmapChart', use: '2D 매트릭스' },
      { name: 'CalendarHeatmap', use: '일별 활동' },
      { name: 'ContributionGraph', use: 'GitHub-style 기여도' },
    ],
  },
  {
    group: 'Flow & network',
    description: '단계·흐름·관계',
    items: [
      { name: 'FunnelChart', use: '전환 단계' },
      { name: 'WaterfallChart', use: '증감 분해' },
      { name: 'SankeyChart', use: '흐름 다이어그램' },
      { name: 'ForceDirectedGraph', use: '관계 네트워크' },
    ],
  },
  {
    group: 'Indicators',
    description: 'KPI·소형 트렌드',
    items: [
      { name: 'GaugeChart', use: '목표 대비 달성' },
      { name: 'RadarChart', use: '다축 역량 비교' },
      { name: 'SparklineChart', use: '인라인 미니 트렌드' },
    ],
  },
] as const

function DocSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}

export const Catalog: Story = {
  name: 'Catalog',
  render: () => (
    <div className="mx-auto max-w-3xl space-y-8 text-sm text-fg">
      <DocSection title="Charts — 데이터 시각화 패밀리">
        <p className="leading-relaxed text-fg-subtle">
          21개 차트 컴포넌트는 <code className="text-fg">@/utils/chart</code> 공통 유틸(스케일, 축,
          토큰, 툴팁)과 <code className="text-fg">ChartFrame</code> 셸을 공유합니다. Storybook
          사이드바에서는 L1/L2 복잡도 대신 <strong className="font-medium text-fg">용도별</strong>로
          묶어 탐색합니다 — Layout·Table·MapboxMap과 같은 도메인 그룹 패턴입니다.
        </p>
      </DocSection>

      <DocSection title="Component catalog">
        <div className="space-y-6">
          {CHART_CATALOG.map(({ group, description, items }) => (
            <div key={group} className="overflow-hidden rounded-lg border border-border">
              <div className="border-b border-border bg-surface px-3 py-2">
                <p className="font-medium text-fg">{group}</p>
                <p className="text-xs text-fg-muted">{description}</p>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-xs font-medium text-fg-muted">Component</th>
                    <th className="px-3 py-2 text-xs font-medium text-fg-muted">When to use</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(({ name, use }) => (
                    <tr key={name} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 font-mono text-xs text-fg">{name}</td>
                      <td className="px-3 py-2 text-fg-subtle">{use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection title="Shared tokens">
        <p className="text-fg-subtle">
          시리즈 색상은 <code className="text-fg">--ds-chart-series-*</code> CSS 변수를 사용합니다.
          className에 hex/rgb를 직접 넣지 말고 토큰 또는{' '}
          <code className="text-fg">readSeriesColors()</code>를 따릅니다.
        </p>
      </DocSection>
    </div>
  ),
}
