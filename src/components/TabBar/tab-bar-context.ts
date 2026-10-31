'use client'

import { createContext, useContext } from 'react'

type TabBarContextValue = {
  selectedTabId: string | undefined
  onSelect: (tabId: string) => void
}

export const TabBarContext = createContext<TabBarContextValue | null>(null)

export function useTabBarContext(): TabBarContextValue | null {
  return useContext(TabBarContext)
}
