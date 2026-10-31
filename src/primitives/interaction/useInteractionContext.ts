'use client'

import { type RefObject, useRef, useState } from 'react'

import { defaultAxis, resolveIntent } from './resolver'

import type { InteractionContextKind, InteractionIntent, TraversalAxis } from './types'

export interface UseInteractionContextOptions {
  kind: InteractionContextKind
  axis?: TraversalAxis
  itemCount?: number
  onIntent: (intent: InteractionIntent, event: Event) => boolean | void
}

export interface UseInteractionContextResult {
  contextProps: React.HTMLAttributes<HTMLElement>
  getItemProps: (index: number) => React.HTMLAttributes<HTMLElement>
  focusedIndex: number
  setFocusedIndex: (index: number) => void
  /** Ref to attach to the context container (required for overlay kind) */
  containerRef: RefObject<HTMLElement | null>
}

/**
 * Headless interaction context hook implementing the Interaction Grammar system.
 *
 * Responsibilities:
 * - Key → Intent resolution via `resolver.ts` (driven by intent-dictionary.json rules)
 * - Escape bubbling: onIntent returning true (handled) stops propagation; false/void lets it bubble
 * - Roving tabindex: only the focused item has tabIndex=0, others have tabIndex=-1
 * - field kind: absorbsTraversal — arrow keys pass through to native caret
 * - overlay kind: integrates pointer-down-outside dismiss pattern
 */
export function useInteractionContext({
  kind,
  axis,
  itemCount = 0,
  onIntent,
}: UseInteractionContextOptions): UseInteractionContextResult {
  const resolvedAxis = axis ?? defaultAxis(kind)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const containerRef = useRef<HTMLElement>(null)
  const onIntentRef = useRef(onIntent)
  onIntentRef.current = onIntent

  function handleKeyDown(e: React.KeyboardEvent) {
    const intent = resolveIntent(kind, resolvedAxis, e.key)
    if (!intent) return

    const handled = onIntentRef.current(intent, e.nativeEvent)

    if (handled) {
      e.stopPropagation()
      e.preventDefault()
    }
    // If not handled (false/void), event bubbles naturally
  }

  // Build ARIA role based on context kind
  const ariaRole = contextKindToRole(kind)

  const contextProps: React.HTMLAttributes<HTMLElement> = {
    role: ariaRole,
    onKeyDown: handleKeyDown,
    ...(kind === 'list' && { 'aria-orientation': 'vertical' as const }),
    ...(kind === 'linear' && { 'aria-orientation': 'horizontal' as const }),
  }

  function getItemProps(index: number): React.HTMLAttributes<HTMLElement> {
    return {
      tabIndex: index === focusedIndex ? 0 : -1,
      onClick: (e: React.MouseEvent) => {
        setFocusedIndex(index)
        onIntentRef.current({ type: 'activate' }, e.nativeEvent)
      },
      onFocus: () => {
        setFocusedIndex(index)
      },
    }
  }

  return {
    contextProps,
    getItemProps,
    focusedIndex,
    setFocusedIndex,
    containerRef,
  }
}

function contextKindToRole(kind: InteractionContextKind): React.AriaRole | undefined {
  switch (kind) {
    case 'list':
      return 'listbox'
    case 'linear':
      return 'toolbar'
    case 'grid':
      return 'grid'
    case 'tree':
      return 'tree'
    case 'overlay':
      return 'dialog'
    case 'document':
      return 'document'
    default:
      return undefined
  }
}
