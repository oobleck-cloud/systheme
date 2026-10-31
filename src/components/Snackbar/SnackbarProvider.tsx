'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { SnackbarRegion, type SnackRecord } from './Snackbar'

export type SnackInput = {
  message: string
  actionLabel?: string
  onAction?: () => void
  /**
   * 자동 닫힘 시간(ms). 기본 4000ms.
   * `0` 또는 음수로 설정하면 자동으로 닫히지 않습니다.
   */
  durationMs?: number
}

type SnackbarContextValue = {
  /** 스낵바를 큐에 추가합니다. 생성된 snack id를 반환합니다. */
  push: (input: SnackInput) => string
  /** 특정 snack을 즉시 닫습니다. */
  dismiss: (id: string) => void
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null)

type InternalSnackRecord = SnackRecord & {
  actionLabel?: string
  onAction?: () => void
}

export type SnackbarProviderProps = {
  children: ReactNode
}

function SnackbarProvider({ children }: SnackbarProviderProps) {
  const [snacks, setSnacks] = useState<InternalSnackRecord[]>([])

  const dismiss = useCallback((id: string) => {
    setSnacks((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const push = useCallback(
    (input: SnackInput): string => {
      const id = crypto.randomUUID()
      const record: InternalSnackRecord = {
        id,
        open: true,
        message: input.message,
        actionLabel: input.actionLabel,
        onAction: input.onAction,
      }
      setSnacks((prev) => [...prev, record])
      const duration = input.durationMs ?? 4000
      if (duration > 0 && typeof window !== 'undefined') {
        window.setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  const hasAction = snacks.some((s) => s.onAction)

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <SnackbarRegion
        snacks={snacks}
        onDismiss={dismiss}
        onAction={
          hasAction
            ? (id) => {
                const snack = snacks.find((s) => s.id === id)
                snack?.onAction?.()
                dismiss(id)
              }
            : undefined
        }
        actionLabel={snacks.find((s) => s.actionLabel)?.actionLabel}
      />
    </SnackbarContext.Provider>
  )
}

/**
 * `SnackbarProvider` 하위에서 스낵바를 추가/닫는 훅.
 *
 * ```tsx
 * const { push } = useSnackbar()
 * push({ message: '복사 완료' })
 * ```
 */
function useSnackbar(): SnackbarContextValue {
  const ctx = useContext(SnackbarContext)
  if (!ctx) throw new Error('useSnackbar must be used within <SnackbarProvider>')
  return ctx
}

export { SnackbarProvider, useSnackbar }
