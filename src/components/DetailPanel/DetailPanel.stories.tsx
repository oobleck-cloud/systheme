import { Badge } from '../Badge'
import { Button } from '../Button'

import {
  DETAIL_NEUTRAL_BADGE,
  DetailActions,
  DetailFacts,
  DetailInset,
  DetailList,
  DetailListItem,
  DetailPanel,
  DetailSection,
  DetailStacked,
  DetailSummary,
} from './DetailPanel'
import anatomy from './DetailPanel.anatomy.json'

import type { Meta, StoryObj } from '@storybook/react'

import { mergeAnatomyMeta } from '@/storybook/mergeAnatomyMeta'

const meta: Meta<typeof DetailPanel> = {
  title: 'Components/L2/DetailPanel',
  component: DetailPanel,
  tags: ['autodocs'],
  decorators: [(Story) => <div className="w-[480px] bg-background">{Story()}</div>],
}

mergeAnatomyMeta(meta, anatomy as Record<string, unknown>)

export default meta
type Story = StoryObj<typeof DetailPanel>

export const QuoteDrawer: Story = {
  render: () => (
    <DetailPanel>
      <DetailSummary>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-fg">행복이사</span>
          <span className="text-xs text-fg-subtle">평점 4.92 · 리뷰 109</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold text-fg tabular-nums">25만 원</span>
            <span className="text-xs text-fg-subtle tabular-nums">
              이사 25만 · 10-29 11:38 제출
            </span>
          </div>
          <div className="flex gap-1.5">
            <Badge size="sm" className={DETAIL_NEUTRAL_BADGE}>
              참여됨
            </Badge>
            <Badge size="sm" variant="error">
              확인 필요
            </Badge>
          </div>
        </div>
      </DetailSummary>
      <DetailSection
        title="처리"
        badge={
          <Badge size="sm" variant="error">
            확인 필요
          </Badge>
        }
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm text-fg">판단 필요 — 첫 전달인데 전달 시각이 이미 있어요</span>
          <span className="text-xs text-fg-subtle">에이전트 · 10-29 11:41</span>
        </div>
        <DetailActions>
          <Button size="md">다시 묻기</Button>
          <Button size="md" variant="secondary">
            전달 처리
          </Button>
          <Button size="md" variant="ghost">
            제외
          </Button>
        </DetailActions>
      </DetailSection>
      <DetailSection title="시세">
        <span className="text-sm text-fg">시세 하단보다 16.8만 원(40%) 낮아요</span>
        <DetailInset>
          <span className="text-sm font-semibold text-fg">41.8만~59.8만 원</span>
        </DetailInset>
      </DetailSection>
      <DetailSection title="견적 내용">
        <DetailFacts
          rows={[
            ['인원', '1명'],
            ['차량', '1톤 1대'],
            ['최종 제안', '조정 가능'],
          ]}
        />
      </DetailSection>
      <DetailSection title="질문지 답">
        <DetailStacked
          rows={[
            ['실 톤수 확인', '실톤수 1톤 트럭 한대 입니다'],
            ['일반이사 확인(10/31 토)', '일반이사 진행 하겠습니다'],
          ]}
        />
      </DetailSection>
    </DetailPanel>
  ),
}

export const Customer: Story = {
  render: () => (
    <DetailPanel>
      <DetailSummary>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-fg">김고객</span>
          <Badge size="sm" variant="success">
            정기 이용 중 1건
          </Badge>
        </div>
        <DetailFacts
          rows={[
            ['누적 이용', '7회'],
            ['최근 방문', '2026-10-12'],
          ]}
        />
      </DetailSummary>
      <DetailSection
        title="방문 이력"
        count={5}
        action={
          <Button size="sm" variant="ghost">
            2건 더 보기
          </Button>
        }
      >
        <DetailList>
          <DetailListItem title="입주 청소" meta="2026-10-12 · 강남구 역삼동" />
          <DetailListItem
            title="정기 청소 · 격주 화요일"
            meta="2025-03-04 ~"
            trailing={
              <Badge size="sm" variant="success">
                이용 중
              </Badge>
            }
          />
        </DetailList>
      </DetailSection>
      <DetailSection title="메모" count={0}>
        <p className="text-sm text-fg-subtle">남긴 메모가 없어요.</p>
      </DetailSection>
    </DetailPanel>
  ),
}
