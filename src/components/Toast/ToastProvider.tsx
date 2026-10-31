'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { ToastRegion, type ToastRecord, type ToastSeverity } from './Toast'

export type ToastInput = {
  severity?: ToastSeverity
  title: string
  description?: string
  /**
   * 자동 닫힘 시간(ms). 기본 4000ms.
   * `0` 또는 음수로 설정하면 자동으로 닫히지 않습니다.
   */
  durationMs?: number
}

type ToastContextValue = {
  /** 토스트를 큐에 추가합니다. 생성된 toast id를 반환합니다. */
  push: (input: ToastInput) => string
  /** 특정 toast를 즉시 닫습니다. */
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export type ToastProviderProps = {
  children: ReactNode
  /** 토스트 표시 위치. 기본 `'bottom-right'` */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

function ToastProvider({ children, position = 'bottom-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (input: ToastInput): string => {
      const id = crypto.randomUUID()
      const record: ToastRecord = {
        id,
        open: true,
        severity: input.severity ?? 'neutral',
        title: input.title,
        description: input.description,
      }
      setToasts((prev) => [...prev, record])
      const duration = input.durationMs ?? 4000
      if (duration > 0 && typeof window !== 'undefined') {
        window.setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismiss} position={position} />
    </ToastContext.Provider>
  )
}

/**
 * `ToastProvider` 하위에서 토스트를 추가/닫는 훅.
 *
 * ```tsx
 * const { push } = useToast()
 * push({ title: '저장 완료', severity: 'success' })
 * ```
 */
function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export { ToastProvider, useToast }
