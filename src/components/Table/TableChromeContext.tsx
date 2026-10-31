'use client'

import { createContext, useContext } from 'react'

/** `panel`: 둥근 테두리 스크롤 박스(카드형). `flush`: 레이아웃 너비에 맞춘 인라인/리스트형(edge-to-edge). */
export type TableChrome = 'panel' | 'flush'

const TableChromeContext = createContext<TableChrome>('panel')

function useTableChrome(): TableChrome {
  return useContext(TableChromeContext)
}

export { TableChromeContext, useTableChrome }
