'use client'

import * as React from 'react'

const POINT_SELECTOR = '[data-chart-point]'

/**
 * Roving tabindex for interactive SVG chart points.
 *
 * Charts can have hundreds of clickable data points. Marking every one with
 * `tabIndex={0}` creates a "tab trap" where keyboard users must Tab through every
 * point. Instead, this hook keeps exactly ONE point in the tab order (roving
 * tabindex) and lets Arrow / Home / End move focus between points.
 *
 * Usage:
 * - Attach the returned `onKeyDown` to the chart `<svg>` (events bubble from points).
 * - Mark each interactive point element with `data-chart-point` (NO `tabIndex` in JSX —
 *   this hook manages `tabIndex` imperatively so React re-renders don't clobber it).
 * - Each point keeps its own `role="button"`, `aria-label`, `onClick`, and
 *   Enter/Space `onKeyDown` for activation.
 */
export function useSvgRovingPoints(svgRef: React.RefObject<SVGSVGElement | null>) {
  // After every render, ensure exactly one point is the tab stop.
  React.useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const points = Array.from(svg.querySelectorAll<SVGElement>(POINT_SELECTOR))
    if (points.length === 0) return

    // Keep an existing tab stop if it's still present; otherwise make the first point the tab stop.
    const hasTabStop = points.some((p) => p.getAttribute('tabindex') === '0')
    points.forEach((p, i) => {
      const keep = hasTabStop && p.getAttribute('tabindex') === '0'
      p.setAttribute('tabindex', keep || (!hasTabStop && i === 0) ? '0' : '-1')
    })
  })

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<SVGSVGElement>) => {
      const key = e.key
      if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(key)) return

      const svg = svgRef.current
      if (!svg) return
      const points = Array.from(svg.querySelectorAll<SVGElement>(POINT_SELECTOR))
      if (points.length === 0) return

      const active = document.activeElement as Element | null
      const currentIdx = active ? points.indexOf(active as SVGElement) : -1
      if (currentIdx < 0) return

      e.preventDefault()
      let nextIdx = currentIdx
      if (key === 'ArrowRight' || key === 'ArrowDown')
        nextIdx = Math.min(currentIdx + 1, points.length - 1)
      else if (key === 'ArrowLeft' || key === 'ArrowUp') nextIdx = Math.max(currentIdx - 1, 0)
      else if (key === 'Home') nextIdx = 0
      else if (key === 'End') nextIdx = points.length - 1

      if (nextIdx === currentIdx) return
      points[currentIdx].setAttribute('tabindex', '-1')
      points[nextIdx].setAttribute('tabindex', '0')
      points[nextIdx].focus()
    },
    [svgRef],
  )

  return { onKeyDown }
}
