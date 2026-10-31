'use client'

import { createContext, useContext } from 'react'

export type TimelineDensity = 'compact' | 'default' | 'loose'

export type TimelineMeta = {
  index: number
  count: number
  density?: TimelineDensity
}

const TimelineMetaContext = createContext<TimelineMeta | null>(null)

export function useTimelineMeta(): TimelineMeta | null {
  return useContext(TimelineMetaContext)
}

export { TimelineMetaContext }
