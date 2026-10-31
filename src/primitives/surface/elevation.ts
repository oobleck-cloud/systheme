import { cva, type VariantProps } from 'class-variance-authority'

/**
 * elevation — 표면 고도(高度) 사다리를 한 곳에서 정의하는 구조 primitive.
 *
 * MVOS 는 chroma 0 중립 회색을 유지하면서, "밝기 = 고도" 규칙으로 위계를 만든다.
 * 색은 의미(상태·선택·주요액션)에만 쓰고 표면 tint 는 쓰지 않는다.
 *
 *   canvas  (L0, recessed)  — 페이지/워크스페이스 바탕. 한 단계 눌린 회색면.
 *   well    (L-1, nested)   — 카드 내부에서 다시 눌린 그룹(통계·중첩 리스트). border 대신 눌림으로 구분.
 *   raised  (L1)           — 캔버스 위에 뜬 흰 카드/패널. subtle border + shadow-sm.
 *   overlay (L2)           — 팝오버/드롭다운/플로팅. subtle border + shadow-float.
 *                            면은 bg-float — 라이트는 흰색과 같고, 다크는 카드보다 한 단 밝다.
 *
 * 흰 배경끼리 겹치는 "흰 위에 흰"(경계 없는 평면)을 없애기 위해,
 * 컨테이너는 raised(흰 카드)로, 그 바탕은 canvas(눌린 회색)로 둔다.
 */
export const elevation = cva('', {
  variants: {
    level: {
      canvas: 'bg-canvas',
      well: 'bg-surface',
      raised: 'border border-border-subtle bg-background shadow-sm',
      overlay: 'border border-border-subtle bg-float shadow-float',
    },
    radius: {
      none: '',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
    },
  },
  defaultVariants: {
    level: 'raised',
    radius: 'lg',
  },
})

export type ElevationVariantProps = VariantProps<typeof elevation>
