'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/utils/cn'

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*-+='

export type AnimatedTextEffect = 'scramble' | 'shimmer'

interface AnimatedTextProps {
  value: string
  /** scramble 전용 — 문자당 reveal 간격(ms) */
  speed?: number
  /** scramble: 글리프 순환 후 확정 · shimmer: 하이라이트 스윕 후 일반 텍스트 */
  effect?: AnimatedTextEffect
  className?: string
  as?: 'span' | 'p' | 'div'
}

function ShimmerText({
  value,
  className,
  as: Tag = 'span',
}: Pick<AnimatedTextProps, 'value' | 'className' | 'as'>) {
  const [shimmering, setShimmering] = useState(true)

  useEffect(() => {
    setShimmering(true)
    const timer = setTimeout(() => setShimmering(false), 700)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <Tag
      className={cn(className, shimmering && 'ds-animated-text-shimmer')}
      data-slot="animated-text-root"
      data-animated-text-effect="shimmer"
    >
      {value}
    </Tag>
  )
}

function ScrambleText({
  value,
  speed = 20,
  className,
  as: Tag = 'span',
}: Pick<AnimatedTextProps, 'value' | 'speed' | 'className' | 'as'>) {
  const [displayed, setDisplayed] = useState(value)
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const targetRef = useRef(value)

  useEffect(() => {
    if (value === targetRef.current && displayed === value) return
    targetRef.current = value

    if (animRef.current) clearTimeout(animRef.current)

    const target = value
    let revealedCount = 0
    let tick = 0

    function frame() {
      tick++
      if (tick % 2 === 0) revealedCount = Math.min(revealedCount + 1, target.length)

      setDisplayed(
        target
          .split('')
          .map((char, i) => {
            if (i < revealedCount) return char
            if (char === ' ' || char === '\n') return char
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
          })
          .join(''),
      )

      if (revealedCount < target.length) {
        animRef.current = setTimeout(frame, speed)
      }
    }

    animRef.current = setTimeout(frame, speed)
    return () => {
      if (animRef.current) clearTimeout(animRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, speed])

  return (
    <Tag className={className} data-slot="animated-text-root" data-animated-text-effect="scramble">
      {displayed}
    </Tag>
  )
}

/**
 * 텍스트 변경 시 motion 효과를 적용합니다.
 * - scramble: 글리프 순환 후 좌→우 확정
 * - shimmer: Notion 자동완성 스타일 하이라이트 스윕
 */
export function AnimatedText({
  value,
  speed = 20,
  effect = 'scramble',
  className,
  as: Tag = 'span',
}: AnimatedTextProps) {
  if (effect === 'shimmer') {
    return <ShimmerText value={value} className={className} as={Tag} />
  }

  return <ScrambleText value={value} speed={speed} className={className} as={Tag} />
}
