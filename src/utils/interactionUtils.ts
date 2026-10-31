/**
 * Interaction Layer utilities — L2
 *
 * Panel(질감·공간) 위에서 동작하는 사용자 액션 피드백.
 * M3 Expressive state-layer 패턴 차용.
 * Box/Surface/Panel을 수정하지 않고 액션 컴포넌트에만 주입.
 */

import { cn } from './cn'

/**
 * press feedback: active:scale + transition
 * tactile — 눌리는 촉각적 느낌
 */
export const pressScale = cn(
  'active:scale-[0.97]',
  'transition-transform',
  'duration-effects-fast',
  'ease-snappy',
)

/**
 * state-layer: hover/focus-visible/active 상태 오버레이
 * relative + ::before pseudo로 구현 (Box Language를 건드리지 않음)
 *
 * 사용법: 컴포넌트 root에 추가, 내부 content는 relative z-10
 */
export const stateLayer = cn(
  'relative',
  'overflow-hidden',
  'before:absolute',
  'before:inset-0',
  'before:rounded-[inherit]',
  'before:bg-current',
  'before:opacity-0',
  'before:transition-opacity',
  'before:duration-effects-fast',
  'before:ease-standard',
  'hover:before:opacity-[0.08]',
  'focus-visible:before:opacity-[0.12]',
  'active:before:opacity-[0.16]',
)

/**
 * motionTransition: 일반 색상 전환에 motion 토큰 적용
 * 기존 transition-colors를 이 유틸로 대체할 수 있음
 */
export const motionTransition = cn('transition-colors', 'duration-effects-default', 'ease-standard')

/**
 * shapeMorphBase: CSS transition 기반 corner radius 변형 유틸
 * selected 상태 전환 시 pill ↔ rounded 모핑에 사용.
 * M3 Expressive ButtonGroup "bump & react" 패턴.
 */
export const shapeMorphBase = cn(
  'transition-[border-radius]',
  'duration-effects-default',
  'ease-snappy',
)

/** 비선택 상태 기본 shape */
export const shapeMorphDefault = cn(shapeMorphBase, 'rounded-md')

/** 선택 상태 pill shape */
export const shapeMorphSelected = cn(shapeMorphBase, 'rounded-full')
