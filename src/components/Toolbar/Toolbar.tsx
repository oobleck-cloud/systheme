'use client'

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useState,
  type ReactElement,
} from 'react'

import { ButtonGroup, type ButtonGroupEndShape } from '@/components/Button/ButtonGroup'
import { useDismissOnEscape } from '@/primitives/anchorPopover'
import { cn } from '@/utils/cn'

export type ToolbarDensity = 'compact' | 'default' | 'loose'

export interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /**
   * 툴바 surface 크기.
   * - compact: 컨트롤 h-8 (이중 Panel 제거 후의 컴팩트 크기)
   * - default: 컨트롤 h-11 (구 Panel p-1.5 + sm 버튼과 동일한 외곽)
   * - loose: 컨트롤 h-12
   */
  density?: ToolbarDensity
  className?: string
}

export interface FloatingToolbarProps extends ToolbarProps {
  /** 표시 여부 — false면 exit motion 후 unmount */
  visible?: boolean
  /** 화면 내 위치 */
  placement?: 'bottom-center' | 'top-center' | 'bottom-start' | 'bottom-end'
  /** dismiss 콜백 */
  onDismiss?: () => void
}

export type ToolbarItemTone = 'default' | 'destructive'

export interface ToolbarItemProps {
  children: React.ReactNode
  /** Panel 외곽 형태 — circle: 단일 FAB/아이콘, rounded: pill/박스 */
  shape?: 'circle' | 'rounded'
  /** destructive — 컨트롤 surface가 destructive 색으로 채워짐 */
  tone?: ToolbarItemTone
  density?: ToolbarDensity
  className?: string
}

export interface ToolbarGroupProps {
  children: React.ReactNode
  /**
   * 버튼을 세그먼트형(pill)으로 연결해 배치.
   * false이면 같은 surface 안에서 gap으로만 분리.
   */
  connected?: boolean
  /** connected 모드에서 양 끝 모서리 형태 */
  endShape?: ButtonGroupEndShape
  density?: ToolbarDensity
  className?: string
}

const placementClasses: Record<NonNullable<FloatingToolbarProps['placement']>, string> = {
  'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  'top-center': 'top-6 left-1/2 -translate-x-1/2',
  'bottom-start': 'bottom-6 left-6',
  'bottom-end': 'bottom-6 right-6',
}

const toolbarClusterBaseClass = cn('inline-flex items-center')

/** 구 Panel(p-1.5) + sm 컨트롤과 동일한 외곽 높이를 density로 표현 */
const toolbarDensityConfig: Record<
  ToolbarDensity,
  {
    clusterGap: string
    buttonSurfaceClass: string
    iconSurfaceClass: string
    buttonSize: 'sm' | 'md'
    buttonDensity: 'compact' | 'default' | 'loose'
    iconButtonSize: 'sm' | 'md' | 'lg'
  }
> = {
  compact: {
    clusterGap: 'gap-1.5',
    buttonSurfaceClass: 'h-8 min-h-8 px-3',
    iconSurfaceClass: 'h-8 w-8 min-h-8 min-w-8',
    buttonSize: 'sm',
    buttonDensity: 'default',
    iconButtonSize: 'sm',
  },
  default: {
    clusterGap: 'gap-2',
    buttonSurfaceClass: 'h-11 min-h-11 px-4',
    iconSurfaceClass: 'h-11 w-11 min-h-11 min-w-11',
    buttonSize: 'sm',
    buttonDensity: 'loose',
    iconButtonSize: 'md',
  },
  loose: {
    clusterGap: 'gap-2.5',
    buttonSurfaceClass: 'h-12 min-h-12 px-5',
    iconSurfaceClass: 'h-12 w-12 min-h-12 min-w-12',
    buttonSize: 'md',
    buttonDensity: 'default',
    iconButtonSize: 'lg',
  },
}

const ToolbarDensityContext = createContext<ToolbarDensity>('default')

function useToolbarDensity(override?: ToolbarDensity): ToolbarDensity {
  const inherited = useContext(ToolbarDensityContext)
  return override ?? inherited
}

/** Toolbar floating surface — Panel wrapper 없이 컨트롤/surface에 직접 적용 */
const toolbarGlassSurfaceClass = cn(
  'shadow-panel backdrop-blur-xl bg-background/80 supports-[backdrop-filter]:bg-background/70',
)

const toolbarGroupControlClass = cn(
  'shadow-none bg-transparent focus-visible:ring-offset-0 hover:bg-secondary',
)

function toolbarGroupOuterShape(endShape: ButtonGroupEndShape): string {
  return endShape === 'full' ? 'rounded-full' : 'rounded-2xl'
}

type ToolbarControlChild = ReactElement<{
  className?: string
  variant?: string
  round?: string
  shape?: string
  size?: string
  density?: string
}>

function toolbarControlDisplayName(child: ToolbarControlChild): string | undefined {
  return (child.type as { displayName?: string }).displayName
}

function cloneToolbarControlChild(
  child: ToolbarControlChild,
  density: ToolbarDensity,
  options: {
    dataSlot: 'toolbar-item' | 'toolbar-group-control'
    shape?: 'circle' | 'rounded'
    tone?: ToolbarItemTone
    extraClassName?: string
  },
) {
  const config = toolbarDensityConfig[density]
  const displayName = toolbarControlDisplayName(child)
  const isDestructive = options.tone === 'destructive'
  const variant = isDestructive ? 'destructive' : (child.props.variant ?? 'ghost')

  const sizingProps: Record<string, unknown> = {}
  let surfaceClass = config.buttonSurfaceClass

  if (displayName === 'Button') {
    sizingProps.size = config.buttonSize
    sizingProps.density = config.buttonDensity
    sizingProps.round = 'full'
    surfaceClass = config.buttonSurfaceClass
  } else if (displayName === 'IconButton') {
    sizingProps.size = config.iconButtonSize
    sizingProps.shape = options.shape === 'circle' ? 'circle' : (child.props.shape ?? 'rounded')
    surfaceClass = config.iconSurfaceClass
  }

  return cloneElement(child, {
    ...sizingProps,
    variant,
    'data-slot': options.dataSlot,
    className: cn(
      child.props.className,
      'inline-flex shrink-0 border-0 focus-visible:ring-offset-0',
      options.dataSlot === 'toolbar-item' && 'shadow-panel',
      options.shape === 'circle' ? 'rounded-full' : 'rounded-2xl',
      options.dataSlot === 'toolbar-item' && !isDestructive && toolbarGlassSurfaceClass,
      options.dataSlot === 'toolbar-item' &&
        !isDestructive &&
        variant === 'ghost' &&
        'hover:bg-secondary',
      options.dataSlot === 'toolbar-group-control' && toolbarGroupControlClass,
      surfaceClass,
      options.extraClassName,
    ),
  } as Partial<ToolbarControlChild['props']> & { 'data-slot': string })
}

function ToolbarSurfaceProvider({
  density,
  children,
  className,
  ...props
}: {
  density: ToolbarDensity
  children: React.ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ToolbarDensityContext.Provider value={density}>
      <div
        className={cn(toolbarClusterBaseClass, toolbarDensityConfig[density].clusterGap, className)}
        {...props}
      >
        {children}
      </div>
    </ToolbarDensityContext.Provider>
  )
}

/**
 * Toolbar — 분리된 surface 클러스터 레이아웃(orchestration).
 * 자체 chrome 없음. 각 ToolbarItem / ToolbarGroup 이 독립 floating surface 1개.
 *
 * WAI-ARIA toolbar: ArrowLeft/Right 로 포커스 이동.
 */
function Toolbar({ children, className, density = 'default', ...props }: ToolbarProps) {
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const container = e.currentTarget
    // Collect all interactive elements that are not disabled
    const items = Array.from(
      container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [role="button"]:not([disabled]), a[href], input:not([disabled])',
      ),
    ).filter((el) => el.closest('[data-slot="toolbar-root"]') === container)
    const currentIdx = items.findIndex((el) => el === document.activeElement)

    let nextIdx = -1
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextIdx = (currentIdx + 1) % items.length
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextIdx = (currentIdx - 1 + items.length) % items.length
        break
      case 'Home':
        e.preventDefault()
        nextIdx = 0
        break
      case 'End':
        e.preventDefault()
        nextIdx = items.length - 1
        break
    }

    if (nextIdx >= 0) items[nextIdx]?.focus()
  }

  return (
    <ToolbarSurfaceProvider
      density={density}
      role="toolbar"
      data-slot="toolbar-root"
      data-density={density}
      className={className}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </ToolbarSurfaceProvider>
  )
}

function FloatingToolbar({
  children,
  className,
  density = 'default',
  visible = true,
  placement = 'bottom-center',
  onDismiss,
  ...props
}: FloatingToolbarProps) {
  const [mounted, setMounted] = useState(visible)
  const [show, setShow] = useState(false)

  useDismissOnEscape(visible && onDismiss != null, () => onDismiss?.())

  useEffect(() => {
    if (visible) {
      setMounted(true)
      const id = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(id)
    } else {
      setShow(false)
      const id = setTimeout(() => setMounted(false), 300)
      return () => clearTimeout(id)
    }
  }, [visible])

  if (!mounted) return null

  return (
    <ToolbarSurfaceProvider
      density={density}
      role="toolbar"
      data-slot="toolbar-root"
      data-density={density}
      className={cn(
        'fixed z-50',
        placementClasses[placement],
        'transition-[opacity,transform]',
        'duration-spatial-default',
        'ease-expressive',
        show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        className,
      )}
      {...props}
    >
      {children}
    </ToolbarSurfaceProvider>
  )
}

/**
 * ToolbarItem — 단일 컨트롤 = floating surface 1개.
 * padding wrapper 없음. glass/destructive chrome은 버튼 자체에 적용.
 */
function ToolbarItem({
  children,
  shape = 'circle',
  tone = 'default',
  density: densityProp,
  className,
}: ToolbarItemProps) {
  const density = useToolbarDensity(densityProp)
  const child = Children.only(children)
  if (!isValidElement<{ className?: string; variant?: string }>(child)) {
    return null
  }

  return cloneToolbarControlChild(child as ToolbarControlChild, density, {
    dataSlot: 'toolbar-item',
    shape,
    tone,
    extraClassName: className,
  })
}

/**
 * ToolbarGroup — 연관 액션이 공유하는 glass surface 1개.
 * padding 없이 컨트롤이 surface 가장자리까지 채움. hover는 세그먼트 내부에서만 변함.
 */
function ToolbarGroup({
  children,
  connected = true,
  endShape = 'full',
  density: densityProp,
  className,
}: ToolbarGroupProps) {
  const density = useToolbarDensity(densityProp)

  const clonedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child
    return cloneToolbarControlChild(child as ToolbarControlChild, density, {
      dataSlot: 'toolbar-group-control',
    })
  })

  return (
    <div
      data-slot="toolbar-group"
      className={cn(
        'inline-flex shrink-0 overflow-hidden border-0',
        toolbarGlassSurfaceClass,
        toolbarGroupOuterShape(endShape),
        className,
      )}
    >
      {connected ? (
        <ButtonGroup connected={false} gap={0} endShape={endShape}>
          {clonedChildren}
        </ButtonGroup>
      ) : (
        <div role="group" className="flex items-stretch gap-0">
          {clonedChildren}
        </div>
      )}
    </div>
  )
}

Toolbar.displayName = 'Toolbar'
FloatingToolbar.displayName = 'FloatingToolbar'
ToolbarItem.displayName = 'ToolbarItem'
ToolbarGroup.displayName = 'ToolbarGroup'

export { Toolbar, FloatingToolbar, ToolbarItem, ToolbarGroup }
