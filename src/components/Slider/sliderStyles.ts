/**
 * Slider·RangeSlider 가 공유하는 네이티브 `input[type=range]` 스타일.
 *
 * 트랙은 별도 div 로 그리고 네이티브 트랙은 투명 처리한다 — 브라우저마다 트랙 렌더가
 * 달라 채움(fill)을 일관되게 얹을 수 없기 때문이다. 썸만 네이티브를 쓴다.
 */
export const SLIDER_THUMB_CLASSES = [
  // webkit thumb
  '[&::-webkit-slider-thumb]:appearance-none',
  '[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full',
  '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-background',
  '[&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform',
  '[&::-webkit-slider-thumb]:hover:scale-110',
  'focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-ring focus-visible:[&::-webkit-slider-thumb]:ring-offset-1',
  // moz thumb
  '[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0',
  '[&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:outline-2 [&::-moz-range-thumb]:outline-primary',
  '[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-sm',
  // 네이티브 트랙 투명 처리
  '[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:bg-transparent',
  '[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:bg-transparent',
].join(' ')

export const SLIDER_TRACK_CLASSES =
  'relative h-1.5 w-full overflow-hidden rounded-full border border-border bg-surface'

/** 0~100 으로 정규화. min===max 인 퇴화 구간에서 NaN 이 새지 않게 막는다. */
export function sliderPercent(value: number, min: number, max: number): number {
  if (max <= min) return 0
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
}
