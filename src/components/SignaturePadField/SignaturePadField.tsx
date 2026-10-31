'use client'

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/Button/Button'
import { Stack } from '@/components/layout/Stack'
import { cn } from '@/utils/cn'

export type SignaturePadFieldProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  helperText?: string
  /** 서명 변경 시 dataURL 또는 null(지운 경우) 전달 */
  onChange?: (dataUrl: string | null) => void
  onClear?: () => void
  /** 제출 시 PNG Blob 전달. prop이 없어도 버튼은 서명이 있으면 활성화됨 */
  onSubmit?: (blob: Blob) => void
}

const SignaturePadField = forwardRef<HTMLDivElement, SignaturePadFieldProps>(
  ({ className, helperText, onChange, onClear, onSubmit, ...props }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [hasInk, setHasInk] = useState(false)
    const isDrawingRef = useRef(false)
    const lastPosRef = useRef<{ x: number; y: number } | null>(null)

    // 캔버스 크기를 display 크기에 맞춤 (고해상도 대응)
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width || 400
      canvas.height = rect.height || 160
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#1a1a1a'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }, [])

    const getPos = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        return {
          x: (e.clientX - rect.left) * (canvas.width / rect.width),
          y: (e.clientY - rect.top) * (canvas.height / rect.height),
        }
      },
      [],
    )

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.preventDefault()
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.setPointerCapture(e.pointerId)
        isDrawingRef.current = true
        const pos = getPos(e)
        lastPosRef.current = pos
        if (pos) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.beginPath()
            ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      },
      [getPos],
    )

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        const pos = getPos(e)
        const last = lastPosRef.current
        if (!pos || !last) return
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (!ctx) return
        ctx.beginPath()
        ctx.moveTo(last.x, last.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
        lastPosRef.current = pos
      },
      [getPos],
    )

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawingRef.current) return
        isDrawingRef.current = false
        lastPosRef.current = null
        setHasInk(true)
        const dataUrl = canvasRef.current?.toDataURL() ?? null
        onChange?.(dataUrl)
      },
      [onChange],
    )

    const handleClear = useCallback(() => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      setHasInk(false)
      onChange?.(null)
      onClear?.()
    }, [onChange, onClear])

    const handleSubmit = useCallback(() => {
      const canvas = canvasRef.current
      if (!canvas || !onSubmit) return
      canvas.toBlob((blob) => {
        if (blob) onSubmit(blob)
      }, 'image/png')
    }, [onSubmit])

    return (
      <div
        ref={ref}
        data-slot="signature-pad-field-root"
        className={cn('flex w-full flex-col gap-2', className)}
        {...props}
      >
        <canvas
          ref={canvasRef}
          data-slot="signature-pad-field-canvas-slot"
          className="h-40 w-full touch-none rounded-md border border-dashed border-border bg-muted"
          aria-label="서명 캔버스 — 마우스 또는 터치로 서명하세요"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <p data-slot="signature-pad-field-helper" className="text-xs text-fg-muted">
          {helperText || '\u00A0'}
        </p>
        <Stack direction="horizontal" align="center" gap={2} wrap>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            data-slot="signature-pad-field-clear"
            disabled={!onClear && !hasInk}
            onClick={handleClear}
          >
            지우기
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-slot="signature-pad-field-commit"
            disabled={!hasInk}
            onClick={handleSubmit}
          >
            서명 제출
          </Button>
        </Stack>
      </div>
    )
  },
)

SignaturePadField.displayName = 'SignaturePadField'

export { SignaturePadField }
