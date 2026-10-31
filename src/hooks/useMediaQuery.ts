'use client'

import { useEffect, useState } from 'react'

/** SSR 시 false, 마운트 후 미디어 쿼리 결과 동기화 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const sync = () => setMatches(mql.matches)
    sync()
    mql.addEventListener('change', sync)
    return () => mql.removeEventListener('change', sync)
  }, [query])

  return matches
}

/** Tailwind `sm` 미만 — 바텀시트 레이아웃 */
export const MOBILE_SHEET_MEDIA = '(max-width: 639px)'
