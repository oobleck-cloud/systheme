import type { Decorator } from '@storybook/react'

export type StorybookSurface = 'default' | 'tinted'
export type StorybookShape = 'default' | 'expressive'
export type StorybookDensity = 'compact' | 'default' | 'comfortable'

/**
 * 모바일 컨텍스트 3축(표면·조형·밀도)을 문서 루트에 건다 — 셸이 하는 일과 동일.
 * 전 스토리를 모바일 스코프에서 재검할 수 있게 한다(실앱 커버리지 검증용).
 */
export const withContextScope: Decorator = (Story, context) => {
  const root = document.documentElement
  const surface = (context.globals.surface as StorybookSurface | undefined) ?? 'default'
  const shape = (context.globals.shape as StorybookShape | undefined) ?? 'default'
  const density = (context.globals.density as StorybookDensity | undefined) ?? 'default'

  if (surface === 'default') root.removeAttribute('data-surface')
  else root.setAttribute('data-surface', surface)
  if (shape === 'default') root.removeAttribute('data-shape')
  else root.setAttribute('data-shape', shape)
  if (density === 'default') root.removeAttribute('data-density')
  else root.setAttribute('data-density', density)

  return Story()
}
