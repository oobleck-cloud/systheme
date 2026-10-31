'use client'

import { type VariantProps } from 'class-variance-authority'
import { forwardRef, useCallback, useRef, useState } from 'react'

import { TabBarContext } from './tab-bar-context'
import { TabList, tabListVariants } from './TabList'
import { TabTrigger } from './TabTrigger'

/** @deprecated Use `tabListVariants` — kept for backwards-compatible imports */
const tabBarVariants = tabListVariants

export type TabBarItem = { id: string; label: string; disabled?: boolean }

type TabBarShared = Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'children'> &
  VariantProps<typeof tabListVariants> & {
    tabListLabel?: string
    /**
     * 탭 너비 전략.
     * - `'auto'`(기본): 탭 이름 길이에 맞게 유동적으로 조절.
     * - `'fill'`: 탭들이 줄 폭을 같은 몫으로 나눠 가진다(글자는 칸 가운데). 패널처럼 폭이 정해진
     *   좁은 자리에서 할 일 2~4개를 고를 때 — 왼쪽에 몰려 오른쪽이 비지 않게.
     * - `number`: 해당 픽셀 너비로 고정. 이름이 길면 `…` 으로 잘림.
     * Items API(`tabs` prop) 사용 시에만 적용됨. 합성 모드에서는 각 `TabTrigger`에 직접 지정.
     */
    tabWidth?: 'auto' | 'fill' | number
  }

type TabBarWithItems = TabBarShared & {
  tabs: TabBarItem[]
  selectedTabId?: string
  defaultSelectedTabId?: string
  onTabChange?: (tabId: string) => void
  /** Ignored when `tabs` is set (Storybook args may still include `children`). */
  children?: React.ReactNode
}

type TabBarWithComposition = TabBarShared & {
  /**
   * Composed `TabTrigger` (or richer rows).
   * `selectedTabId`/`defaultSelectedTabId`/`onTabChange`를 제공하면
   * 하위 `TabTrigger`가 context를 통해 선택 상태를 자동으로 읽습니다.
   * 미제공 시 각 `TabTrigger`에 직접 `selectedTabId`/`onSelect`를 전달하세요.
   */
  children: React.ReactNode
  tabs?: undefined
  /** context로 하위 TabTrigger에 전달될 선택된 탭 ID */
  selectedTabId?: string
  /** uncontrolled 초기 선택 탭 ID */
  defaultSelectedTabId?: string
  /** 탭 선택 변경 콜백 */
  onTabChange?: (tabId: string) => void
}

export type TabBarProps = TabBarWithItems | TabBarWithComposition

function TabBarItems({
  forwardedRef,
  tabs,
  selectedTabId: selectedTabIdProp,
  defaultSelectedTabId,
  onTabChange,
  tabWidth,
  ...listProps
}: Omit<TabBarWithItems, 'children'> & { forwardedRef: React.ForwardedRef<HTMLDivElement> }) {
  const [internalSelectedTabId, setInternalSelectedTabId] = useState<string>(
    () => defaultSelectedTabId ?? tabs[0]?.id ?? '',
  )
  const isControlled = selectedTabIdProp !== undefined
  const selectedTabId = isControlled ? selectedTabIdProp! : internalSelectedTabId

  // Stable refs for use inside event handler
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs
  const selectedTabIdRef = useRef(selectedTabId)
  selectedTabIdRef.current = selectedTabId
  const listRef = useRef<HTMLDivElement>(null)

  function handleTabChange(tabId: string) {
    if (!isControlled) setInternalSelectedTabId(tabId)
    onTabChange?.(tabId)
  }

  // WAI-ARIA tablist: ArrowLeft/Right navigate between tabs (automatic activation)
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const allTabs = tabsRef.current
    const enabledTabs = allTabs.filter((t) => !t.disabled)
    const currentIdx = enabledTabs.findIndex((t) => t.id === selectedTabIdRef.current)

    let target: TabBarItem | undefined

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        target = enabledTabs[(currentIdx + 1) % enabledTabs.length]
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        target = enabledTabs[(currentIdx - 1 + enabledTabs.length) % enabledTabs.length]
        break
      case 'Home':
        e.preventDefault()
        target = enabledTabs[0]
        break
      case 'End':
        e.preventDefault()
        target = enabledTabs[enabledTabs.length - 1]
        break
    }

    if (target) {
      handleTabChange(target.id)
      const tabEl = listRef.current?.querySelector<HTMLElement>(`#tab-${target.id}`)
      tabEl?.focus()
    }
  }

  const isFixed = typeof tabWidth === 'number'
  return (
    <TabList
      ref={(el) => {
        listRef.current = el
        if (typeof forwardedRef === 'function') forwardedRef(el)
        else if (forwardedRef) forwardedRef.current = el
      }}
      onKeyDown={handleKeyDown}
      {...listProps}
    >
      {tabs.map((tab) => (
        <TabTrigger
          key={tab.id}
          tabId={tab.id}
          label={tab.label}
          density={listProps.density}
          selectedTabId={selectedTabId}
          disabled={tab.disabled}
          onSelect={handleTabChange}
          style={{ '--ds-tab-w': isFixed ? `${tabWidth}px` : undefined }}
          className={
            isFixed
              ? 'w-[var(--ds-tab-w)] overflow-hidden'
              : tabWidth === 'fill'
                ? 'min-w-0 flex-1 basis-0'
                : undefined
          }
        />
      ))}
    </TabList>
  )
}

function TabBarComposition({
  forwardedRef,
  children,
  selectedTabId: selectedTabIdProp,
  defaultSelectedTabId,
  onTabChange,
  tabWidth: _tabWidth,
  ...listProps
}: Omit<TabBarWithComposition, 'tabs'> & { forwardedRef: React.ForwardedRef<HTMLDivElement> }) {
  const [internalSelectedTabId, setInternalSelectedTabId] = useState<string | undefined>(
    () => defaultSelectedTabId,
  )
  const hasSelection = selectedTabIdProp !== undefined || defaultSelectedTabId !== undefined
  const isControlled = selectedTabIdProp !== undefined
  const selectedTabId = isControlled ? selectedTabIdProp : internalSelectedTabId

  const listRef = useRef<HTMLDivElement>(null)

  const handleSelect = useCallback(
    (tabId: string) => {
      if (!isControlled) setInternalSelectedTabId(tabId)
      onTabChange?.(tabId)
    },
    [isControlled, onTabChange],
  )

  // WAI-ARIA tablist: ArrowLeft/Right navigate between tab elements
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!hasSelection) return
      const container = listRef.current
      if (!container) return

      const allTabs = Array.from(
        container.querySelectorAll<HTMLElement>('[role="tab"]:not([aria-disabled="true"])'),
      )
      const currentEl = document.activeElement as HTMLElement | null
      const currentIdx = currentEl ? allTabs.indexOf(currentEl) : -1

      let target: HTMLElement | undefined

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          target = allTabs[(currentIdx + 1) % allTabs.length]
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          target = allTabs[(currentIdx - 1 + allTabs.length) % allTabs.length]
          break
        case 'Home':
          e.preventDefault()
          target = allTabs[0]
          break
        case 'End':
          e.preventDefault()
          target = allTabs[allTabs.length - 1]
          break
      }

      if (target) {
        target.focus()
        // Extract tabId from id="tab-{tabId}"
        const tabId = target.id.replace(/^tab-/, '')
        if (tabId) handleSelect(tabId)
      }
    },
    [hasSelection, handleSelect],
  )

  const list = (
    <TabList
      ref={(el) => {
        listRef.current = el
        if (typeof forwardedRef === 'function') forwardedRef(el)
        else if (forwardedRef) forwardedRef.current = el
      }}
      onKeyDown={handleKeyDown}
      {...listProps}
    >
      {children}
    </TabList>
  )

  if (!hasSelection) return list

  return (
    <TabBarContext.Provider value={{ selectedTabId, onSelect: handleSelect }}>
      {list}
    </TabBarContext.Provider>
  )
}

const TabBar = forwardRef<HTMLDivElement, TabBarProps>((props, ref) => {
  if ('tabs' in props && props.tabs != null) {
    const { children: _ignoredChildren, ...rest } = props
    return <TabBarItems forwardedRef={ref} {...rest} />
  }

  return <TabBarComposition forwardedRef={ref} {...(props as TabBarWithComposition)} />
})

TabBar.displayName = 'TabBar'

export { TabBar, tabBarVariants }
