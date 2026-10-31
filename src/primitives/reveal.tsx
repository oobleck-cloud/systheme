'use client'

/**
 * Expressive Motion Language — 패널형 표면 공용 등장 primitive 3종.
 *
 * 한 벌의 M3 Expressive Spatial 스프링(overshoot 있는 탄력, motionTokens) 위에 형태별로 수렴한다:
 *   · <PanelReveal>  — 코너 발원 2축(가로→세로) 확장. 앵커 옆 플로팅 패널(popover·분리 dock·peek·드롭다운).
 *   · <AxisExpand>   — 단일 축(x|y) 0↔auto 확장. 사이드바(x)·아코디언/트리/인라인(y).
 *   · <ScaleReveal>  — 중앙 점 발원 scale-in. 모달·라이트박스·중앙 오버레이.
 *
 * 공통 규약:
 *   - `open` 을 주면 컴포넌트가 내부 AnimatePresence 로 mount/exit 을 관리한다(토글 표면에 편함).
 *     `open` 을 생략하면 호출자가 바깥 AnimatePresence + 조건부 렌더로 제어한다(기존 패턴 호환).
 *   - prefers-reduced-motion 이면 스케일·크기 애니를 끄고 fade 만(overlayVariants.fade)으로 강등한다.
 *   - 원본 변형(panelReveal/scaleReveal/axisExpandVariants)은 motionTokens 에서 직접 import 도 가능.
 */
import { AnimatePresence, motion, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import { forwardRef, type ReactNode } from 'react'

import {
  axisExpandVariants,
  overlayVariants,
  panelReveal,
  panelRevealContent,
  scaleReveal,
} from '../foundations/motionTokens'

import { cn } from '@/utils/cn'

// ─── 공통: open 제어 래핑 ────────────────────────────────────────────────────
// open 미지정 → 자식 그대로(호출자가 AnimatePresence 소유). 지정 → 내부 AnimatePresence.
function withPresence(open: boolean | undefined, node: ReactNode) {
  if (open === undefined) return node
  return <AnimatePresence>{open ? node : null}</AnimatePresence>
}

// ─── PanelReveal ─────────────────────────────────────────────────────────────

export type PanelRevealProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  /** 발원 코너 = transform-origin (기본 'bottom left' — dock/필드 코너에서 자라남). */
  origin?: string
  /**
   * 확장이 끝난 뒤 내용을 페이드(스케일 왜곡 은폐) + staggerChildren 로 감쌀지.
   * 기본 false(레이아웃 안전 — children 을 flex 컨테이너의 직계로 유지). **고정 높이 패널**에서만
   * true 로 켠다 — content-driven 높이(max-height 만 있는 팝오버 등)에서 flex-1 래퍼는 높이를 0으로
   * 무너뜨린다. true 일 때 contentClassName 로 래퍼 골격을 조정한다.
   */
  orchestrateContent?: boolean
  /** orchestrateContent=true 일 때 내용 래퍼 className(기본 flex 컬럼). */
  contentClassName?: string
  /** open 지정 시 내부 AnimatePresence 로 mount/exit 관리. */
  open?: boolean
  children?: ReactNode
}

/** 코너 발원 2축(가로→세로) 확장 패널. children 만 넣으면 dock/앵커 코너에서 펼쳐진다. */
export const PanelReveal = forwardRef<HTMLDivElement, PanelRevealProps>(function PanelReveal(
  {
    origin = 'bottom left',
    orchestrateContent = false,
    contentClassName,
    open,
    className,
    style,
    children,
    ...rest
  },
  ref,
) {
  const reduced = useReducedMotion()
  const node = (
    <motion.div
      ref={ref}
      style={{ transformOrigin: origin, ...style }}
      variants={reduced ? overlayVariants.fade : panelReveal}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('overflow-hidden', className)}
      {...rest}
    >
      {reduced || !orchestrateContent ? (
        children
      ) : (
        <motion.div
          variants={panelRevealContent}
          className={cn('flex min-h-0 flex-1 flex-col', contentClassName)}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
  return withPresence(open, node)
})

// ─── AxisExpand ──────────────────────────────────────────────────────────────

export type AxisExpandProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  /** 확장 축 — 'x'(폭, 사이드바) | 'y'(높이, 아코디언/트리/인라인). 기본 'y'. */
  axis?: 'x' | 'y'
  /** open 지정 시 내부 AnimatePresence 로 mount/exit 관리. */
  open?: boolean
  children?: ReactNode
}

/** 단일 축 0↔auto 확장(overflow hidden). 사이드바(x)·아코디언/트리(y)에 공용. */
export const AxisExpand = forwardRef<HTMLDivElement, AxisExpandProps>(function AxisExpand(
  { axis = 'y', open, className, children, ...rest },
  ref,
) {
  const reduced = useReducedMotion()
  const variants = reduced ? overlayVariants.fade : axisExpandVariants(axis)
  const node = (
    <motion.div
      ref={ref}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('overflow-hidden', className)}
      {...rest}
    >
      {children}
    </motion.div>
  )
  return withPresence(open, node)
})

// ─── ScaleReveal ─────────────────────────────────────────────────────────────

export type ScaleRevealProps = Omit<HTMLMotionProps<'div'>, 'ref'> & {
  /** 발원 지점 = transform-origin (기본 'center'). */
  origin?: string
  /** open 지정 시 내부 AnimatePresence 로 mount/exit 관리. */
  open?: boolean
  children?: ReactNode
}

/** 중앙(또는 origin) 점 발원 scale-in. 모달·라이트박스·중앙 오버레이. */
export const ScaleReveal = forwardRef<HTMLDivElement, ScaleRevealProps>(function ScaleReveal(
  { origin = 'center', open, className, style, children, ...rest },
  ref,
) {
  const reduced = useReducedMotion()
  const node = (
    <motion.div
      ref={ref}
      style={{ transformOrigin: origin, ...style }}
      variants={reduced ? overlayVariants.fade : scaleReveal}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  )
  return withPresence(open, node)
})
