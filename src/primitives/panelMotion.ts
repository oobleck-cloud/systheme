'use client'

import { motion } from 'motion/react'

import { Panel, type PanelProps } from './panel'

import type { MotionProps } from 'motion/react'

/**
 * motion.dev로 래핑된 Panel.
 * `motion(Panel)` 호출 시 ForwardRefExoticComponent ↔ ComponentType 타입 충돌이 발생하므로
 * 여기서 한 번만 처리하고, 각 컴포넌트는 이 export를 직접 사용한다.
 */
type MotionPanelProps = PanelProps & MotionProps

export const MotionPanel = motion(Panel as any) as React.ForwardRefExoticComponent<
  MotionPanelProps & React.RefAttributes<HTMLDivElement>
>
