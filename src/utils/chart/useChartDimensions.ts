'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

import { DEFAULT_MARGIN } from './types'

import type { ChartMargin, ChartDimensions } from './types'

/**
 * Tracks the container element's size via ResizeObserver and returns
 * computed chart dimensions (outer + inner, accounting for margin).
 *
 * Usage:
 *   const [containerRef, dims] = useChartDimensions({ margin })
 *   <div ref={containerRef}>
 *     <svg width={dims.width} height={dims.height}>
 *       <g transform={`translate(${dims.margin.left},${dims.margin.top})`}>
 *         ...
 *       </g>
 *     </svg>
 *   </div>
 */
export function useChartDimensions(
  options: {
    margin?: Partial<ChartMargin>
    defaultWidth?: number
    defaultHeight?: number
  } = {},
): [React.RefCallback<HTMLElement>, ChartDimensions] {
  const margin: ChartMargin = {
    ...DEFAULT_MARGIN,
    ...options.margin,
  }

  const [size, setSize] = useState<{ width: number; height: number }>({
    width: options.defaultWidth ?? 480,
    height: options.defaultHeight ?? 300,
  })

  const observerRef = useRef<ResizeObserver | null>(null)

  const refCallback = useCallback((node: HTMLElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }
    if (!node) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(node)
    observerRef.current = ro

    // Initial measurement
    const { width, height } = node.getBoundingClientRect()
    setSize({ width: Math.floor(width), height: Math.floor(height) })
  }, [])

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const dims: ChartDimensions = {
    width: size.width,
    height: size.height,
    innerWidth: Math.max(0, size.width - margin.left - margin.right),
    innerHeight: Math.max(0, size.height - margin.top - margin.bottom),
    margin,
  }

  return [refCallback, dims]
}
