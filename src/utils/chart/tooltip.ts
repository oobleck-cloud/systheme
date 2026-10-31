'use client'

import { useState, useCallback } from 'react'

import type { TooltipState } from './types'

const INITIAL_STATE: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  items: [],
}

/**
 * Manages floating tooltip state for chart components.
 * Coordinates are relative to the SVG element.
 */
export function useChartTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>(INITIAL_STATE)

  const showTooltip = useCallback(
    (x: number, y: number, content: { title?: string; items: TooltipState['items'] }) => {
      setTooltip({ visible: true, x, y, ...content })
    },
    [],
  )

  const hideTooltip = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  return { tooltip, showTooltip, hideTooltip }
}

/**
 * Format a raw numeric value for tooltip display.
 * Respects compact notation for large numbers.
 */
export function formatTooltipValue(value: number, decimals = 1): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(decimals)}M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(decimals)}k`
  return value % 1 === 0 ? String(value) : value.toFixed(decimals)
}
