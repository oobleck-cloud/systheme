'use client'

import { TableChromeContext, type TableChrome } from './TableChromeContext'

import { Spinner } from '@/components/Spinner'
import { Surface } from '@/primitives/surface'
import { cn } from '@/utils/cn'

export type TableDensity = 'comfortable' | 'default' | 'compact'

type TableProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * `panel`: 둥근 테두리 스크롤 영역(카드형).
   * `flush`: 레이아웃 안에 꽉 차는 리스트형 — 외곽 라운드/박스 테두리 없음(edge-to-edge).
   */
  chrome?: TableChrome
  /**
   * 행·헤더의 패딩·폰트 크기 스케일.
   * - `comfortable`: 모바일/터치 친화 (넓은 여백)
   * - `default`: 어드민 기본값
   * - `compact`: 데이터 집약형 화면
   *
   * 부모 컨테이너에 `data-density` 속성이 있으면 그 값을 상속하므로
   * 명시하지 않아도 컨텍스트 density 가 자동 적용됩니다.
   */
  density?: TableDensity
  /**
   * 헤더(thead)를 세로 sticky 로 쓸 수 있게 자체 가로 스크롤 래퍼를 끈다.
   * CSS 규칙상 `overflow-x-auto` 래퍼가 있으면 thead 의 `sticky top` 이 그 래퍼 기준으로 붙어
   * 무력화되므로, 이 모드에선 가로·세로 스크롤을 모두 **가장 가까운 스크롤 조상**(overflow-auto
   * 컨테이너)이 소유해야 한다. 호출자가 그 컨테이너를 제공할 때만 켤 것 (chrome="flush" 전용).
   */
  stickyHeader?: boolean
  /** anatomy `loading` — 스크롤 영역 위 오버레이 */
  loading?: boolean
  /** anatomy `loading-indicator` 대체 UI */
  loadingSlot?: React.ReactNode
  /** anatomy `empty-slot` — 테이블 위 보조 영역(빈 상태 등) */
  emptySlot?: React.ReactNode
}

function Table({
  className,
  chrome = 'panel',
  density,
  stickyHeader = false,
  loading = false,
  loadingSlot,
  emptySlot,
  children,
  ...props
}: TableProps) {
  return (
    <TableChromeContext.Provider value={chrome}>
      <div
        data-slot="table-root"
        data-density={density}
        className={cn('relative w-full', className)}
        {...props}
      >
        {loading ? (
          <div
            role="status"
            aria-busy="true"
            aria-live="polite"
            data-slot="loading-scrim"
            className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[4px]"
          >
            {loadingSlot ?? <Spinner size="md" accessibilityLabel="불러오는 중" />}
          </div>
        ) : null}
        {emptySlot != null && emptySlot !== false ? (
          <div data-slot="empty-slot" className={cn(chrome === 'flush' ? 'mb-0' : 'mb-2')}>
            {emptySlot}
          </div>
        ) : null}
        {chrome === 'panel' ? (
          <Surface
            kind="section"
            density="compact"
            data-slot="scroll-region"
            className="min-w-0 overflow-hidden bg-transparent [&_[data-slot=surface-body]]:p-0"
          >
            <div data-slot="surface" className="min-w-0 overflow-x-auto">
              {children}
            </div>
          </Surface>
        ) : (
          <div data-slot="scroll-region" className="min-w-0 rounded-none border-0">
            <div data-slot="surface" className={cn('min-w-0', !stickyHeader && 'overflow-x-auto')}>
              {children}
            </div>
          </div>
        )}
      </div>
    </TableChromeContext.Provider>
  )
}

export { Table }
export type { TableProps }
