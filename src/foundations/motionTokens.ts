/**
 * Motion Design Tokens — JS Layer (motion.dev)
 *
 * 두 레이어 분리 원칙:
 *   CSS layer (motion.css)  → CSS transition: Button hover, Switch thumb, Checkbox mark 등
 *   JS layer  (this file)   → motion.dev spring: Overlay enter/exit (Modal, Drawer, Popover …)
 *
 * spring.*     → motion.dev transition config (AnimatePresence 자식에 직접 전달)
 * duration.*   → tween 전용 duration (초 단위, motion.css ms 값과 동기화)
 * ease.*       → tween 전용 easing (CSS cubic-bezier 동일 값)
 * overlay.*    → 컴포넌트별 enter/exit variants 정의
 * reducedMotion.* → prefers-reduced-motion 대체 config
 */
import type { TargetAndTransition, Transition, Variants } from 'motion/react'

// ─── Spring configs ───────────────────────────────────────────────────────────
// motion.dev `duration + bounce` API 사용:
//   bounce: 0   = no overshoot  (감쇠비 1.0, CSS standard curve 대응)
//   bounce: 0.12 = 약한 overshoot (감쇠비 0.75, CSS snappy curve 대응)
//   bounce: 0.35 = 뚜렷한 overshoot (감쇠비 0.4, CSS expressive curve 대응)

export const spring = {
  /** 감쇠비 1.0 — overshoot 없음, 일상 UI 피드백 */
  standard: {
    type: 'spring',
    duration: 0.2,
    bounce: 0,
  } satisfies Transition,

  /** 감쇠비 0.4 — bounce 있음, hero moment·overlay 등장 */
  expressive: {
    type: 'spring',
    duration: 0.3,
    bounce: 0.35,
  } satisfies Transition,

  /** 감쇠비 0.75 — 약한 overshoot, press·toggle 반응 */
  snappy: {
    type: 'spring',
    duration: 0.15,
    bounce: 0.12,
  } satisfies Transition,

  /**
   * M3 Expressive · Spatial "fast" 근사 — 탄력 강한 overshoot.
   * 공식 CSS 근사 cubic-bezier(.42,1.67,.21,.9)/0.35s 의 bounce 대응.
   * 축 순차 확장(panelReveal)의 1단계(가로) 등 짧고 튀는 spatial 변화에.
   */
  expressiveFast: {
    type: 'spring',
    duration: 0.32,
    bounce: 0.45,
  } satisfies Transition,

  /**
   * M3 Expressive · Spatial "slow" 근사 — 뚜렷하되 느긋한 overshoot.
   * 공식 CSS 근사 cubic-bezier(.38,1.21,.22,1)/0.5s 대응.
   * panelReveal 2단계(세로) 등 크게 자라 정착하는 spatial 변화에.
   */
  expressiveSlow: {
    type: 'spring',
    duration: 0.5,
    bounce: 0.35,
  } satisfies Transition,
} as const

// ─── Tween durations ──────────────────────────────────────────────────────────
// motion.css 값(ms)과 동기화. motion.dev는 초 단위 사용.

export const duration = {
  effects: { fast: 0.12, default: 0.2, slow: 0.4 },
  spatial: { fast: 0.15, default: 0.3, slow: 0.5 },
} as const

// ─── Tween easing ─────────────────────────────────────────────────────────────

export const ease = {
  /** M3 standard curve — tween 전용 */
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
} as const

// ─── Reduced motion ───────────────────────────────────────────────────────────

export const reducedMotion = {
  /** overlay: 위치 이동 없이 opacity만, 짧게 */
  overlay: {
    type: 'tween',
    duration: duration.effects.fast,
    ease: ease.standard,
  } satisfies Transition,

  /** micro: 즉시 (사실상 끄기) */
  micro: { type: 'tween', duration: 0 } satisfies Transition,
} as const

// ─── Overlay variants ─────────────────────────────────────────────────────────
// AnimatePresence 자식에 `variants={overlay.fade}` 형태로 사용.
// 각 컴포넌트는 이 variants를 그대로 쓰거나 확장해 오버라이드.

const hidden: TargetAndTransition = { opacity: 0 }
const visible: TargetAndTransition = { opacity: 1 }

export const overlayVariants = {
  /** Scrim, Tooltip, 소형 fade-only */
  fade: {
    initial: hidden,
    animate: { ...visible, transition: spring.standard },
    exit: { ...hidden, transition: spring.standard },
  } satisfies Variants,

  /** Modal dialog — scale + fade, expressive */
  dialog: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1, transition: spring.expressive },
    exit: { opacity: 0, scale: 0.97, transition: spring.standard },
  } satisfies Variants,

  /** CommandPalette — 위에서 살짝 내려오며 등장 */
  commandPalette: {
    initial: { opacity: 0, scale: 0.96, y: -8 },
    animate: { opacity: 1, scale: 1, y: 0, transition: spring.expressive },
    exit: { opacity: 0, scale: 0.96, y: -8, transition: spring.standard },
  } satisfies Variants,

  /** Menu / Select dropdown — scale-y + fade */
  menu: {
    initial: { opacity: 0, scaleY: 0.92, y: -4 },
    animate: { opacity: 1, scaleY: 1, y: 0, transition: spring.standard },
    exit: { opacity: 0, scaleY: 0.92, y: -4, transition: spring.standard },
  } satisfies Variants,

  /** Popover / Tooltip bubble — fade + 미세 translate */
  popover: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0, transition: spring.standard },
    exit: { opacity: 0, y: 4, transition: spring.standard },
  } satisfies Variants,

  /** Drawer — 방향별로 translate 값을 오버라이드해서 사용 */
  drawerLeft: {
    initial: { opacity: 0, x: '-100%' },
    animate: { opacity: 1, x: 0, transition: spring.expressive },
    exit: { opacity: 0, x: '-100%', transition: spring.standard },
  } satisfies Variants,
  drawerRight: {
    initial: { opacity: 0, x: '100%' },
    animate: { opacity: 1, x: 0, transition: spring.expressive },
    exit: { opacity: 0, x: '100%', transition: spring.standard },
  } satisfies Variants,
  drawerTop: {
    initial: { opacity: 0, y: '-100%' },
    animate: { opacity: 1, y: 0, transition: spring.expressive },
    exit: { opacity: 0, y: '-100%', transition: spring.standard },
  } satisfies Variants,
  drawerBottom: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0, transition: spring.expressive },
    exit: { opacity: 0, y: '100%', transition: spring.standard },
  } satisfies Variants,

  /** Toast / Snackbar — 아래에서 슬라이드업 */
  toast: {
    initial: { opacity: 0, y: 16, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1, transition: spring.expressive },
    exit: {
      opacity: 0,
      y: 8,
      scale: 0.96,
      transition: { ...spring.standard, duration: duration.spatial.fast },
    },
  } satisfies Variants,
} as const

// ─── Panel reveal (M3 Expressive · 축 순차 확장) ─────────────────────────────────
// 트리거/앵커 코너에서 발원해 **①가로(scaleX) 먼저 → ②세로(scaleY) 후속**으로 펼쳐지는
// spatial 스프링 연출. 사이드바·분리 dock·상세 패널 등 "패널형" 표면의 공용 등장 물리다.
//
// 사용법:
//   - 반드시 `style={{ transformOrigin }}` 를 지정한다(발원 코너 — 예: 'bottom left').
//   - 컨테이너에 `overflow-hidden` 을 준다(펼쳐지는 동안 내용 잘림).
//   - 내용(헤더·리스트)은 `panelRevealContent` 로 확장이 끝난 뒤 페이드시켜 스케일 왜곡을 감춘다
//     (필요하면 리스트에 staggerChildren 을 얹는다).
// reduced-motion 사용자는 이 variants 대신 overlayVariants.fade 를 쓴다(스케일·이동 제거).

/** 패널 컨테이너 — 가로 먼저, 세로 후속. 닫힘은 역순(세로 접힘 → 가로 접힘). */
export const panelReveal = {
  initial: { opacity: 0, scaleX: 0.16, scaleY: 0.1 },
  animate: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    transition: {
      opacity: { duration: duration.effects.fast },
      scaleX: spring.expressiveFast, // ① 가로
      scaleY: { ...spring.expressiveSlow, delay: 0.14 }, // ② 세로(살짝 겹쳐 후속)
    },
  },
  exit: {
    opacity: 0,
    scaleX: 0.16,
    scaleY: 0.1,
    transition: {
      opacity: { duration: duration.effects.fast, delay: 0.08 },
      scaleY: { ...spring.standard, duration: duration.spatial.fast }, // 세로 먼저 접힘
      scaleX: { ...spring.standard, duration: duration.spatial.default, delay: 0.1 }, // 가로 뒤이어
    },
  },
} satisfies Variants

/** 패널 내용 — 컨테이너 확장이 끝난 뒤 페이드(스케일 왜곡 은폐). staggerChildren 옵션. */
export const panelRevealContent = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { delay: 0.44, duration: duration.effects.default, staggerChildren: 0.05 },
  },
  exit: { opacity: 0, transition: { duration: duration.effects.fast } },
} satisfies Variants

/** panelRevealContent 의 자식(리스트 행 등) — 아래에서 살짝 올라오며 순차 등장. */
export const panelRevealItem = {
  initial: { opacity: 0, y: 7 },
  animate: { opacity: 1, y: 0, transition: spring.standard },
  exit: { opacity: 0 },
} satisfies Variants

/**
 * ScaleReveal — 중앙(또는 지정 origin) 점에서 발원하는 scale-in. 모달·라이트박스·중앙 오버레이 등
 * 앵커가 없는 표면용. panelReveal 과 달리 축 순차가 아니라 2축 동시 scale(overshoot 있는 spatial).
 * overlayVariants.dialog(scale 0.97) 보다 큰 발원감(0.9)이라 hero 성 오버레이에 어울린다.
 */
export const scaleReveal = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: spring.expressive },
  exit: { opacity: 0, scale: 0.94, transition: spring.standard },
} satisfies Variants

/**
 * AxisExpand — 단일 축(width|height) 0↔auto 확장 transition 팩토리. 사이드바(x)·아코디언/트리/
 * 인라인 패널(y) 등 한 축으로만 열리는 표면용. Framer 가 auto 를 측정해 spatial 스프링으로 편다.
 * 가로는 탄력 강한 expressiveFast, 세로는 expressive(default) — 리스트가 길어도 과하지 않게.
 */
export function axisExpandVariants(axis: 'x' | 'y'): Variants {
  // 축별로 width/height 리터럴 키를 쓴다(계산 키 `[dim]` 은 Framer Variants 의 CSS-var 인덱스와
  // 충돌해 타입이 깨진다). opacity 는 overshoot 없이 짧게, 크기만 spatial 스프링으로.
  const fade = { duration: duration.effects.fast }
  if (axis === 'x') {
    return {
      initial: { width: 0, opacity: 0 },
      animate: {
        width: 'auto',
        opacity: 1,
        transition: { width: spring.expressiveFast, opacity: fade },
      },
      exit: { width: 0, opacity: 0, transition: { width: spring.standard, opacity: fade } },
    }
  }
  return {
    initial: { height: 0, opacity: 0 },
    animate: {
      height: 'auto',
      opacity: 1,
      transition: { height: spring.expressive, opacity: fade },
    },
    exit: { height: 0, opacity: 0, transition: { height: spring.standard, opacity: fade } },
  }
}
