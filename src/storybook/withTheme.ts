import type { Decorator } from '@storybook/react'

export type StorybookTheme = 'light' | 'dark'

export const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as StorybookTheme | undefined) ?? 'light'
  document.documentElement.classList.toggle('dark', theme === 'dark')
  return Story()
}
