import type { InteractionContextKind, InteractionIntent, TraversalAxis } from './types'

export interface KeyModifiers {
  shiftKey?: boolean
  ctrlKey?: boolean
  altKey?: boolean
  metaKey?: boolean
}

/**
 * Pure function: maps a keyboard key + context kind/axis → InteractionIntent | null
 *
 * Derived from intent-dictionary.json traverse.activation + command activation rules:
 *
 * - `field` kind (value-input / search-input): absorbsTraversal → arrow keys return null
 * - `overlay` kind: Escape → cancel (handled)
 * - `grid` (axis=both): 4 directional arrows → nav.up/down/left/right
 * - block axis (list, pane-stack, tree, document): ArrowDown → nav.next, ArrowUp → nav.prev
 * - inline axis (linear, toolbar): ArrowRight → nav.next, ArrowLeft → nav.prev
 * - Home / End → nav.first / nav.last
 * - PageUp / PageDown → nav.pageNext / nav.pagePrev
 * - Enter / Space → activate (non-field)
 * - Escape → cancel (non-field)
 */
export function resolveIntent(
  kind: InteractionContextKind,
  axis: TraversalAxis,
  key: string,
  _modifiers?: KeyModifiers,
): InteractionIntent | null {
  // field kind (value-input/search-input): absorbsTraversal for arrow keys
  // Only special field-specific keys are handled
  if (kind === 'field') {
    switch (key) {
      case 'Enter':
        return { type: 'edit.commit' }
      case 'Escape':
        // field Escape is context-dependent; return edit.cancel signal
        // caller decides if it's "handled" (has-value) or not (empty = bubble)
        return { type: 'edit.cancel' }
      default:
        // All other keys including arrow keys pass through (native caret)
        return null
    }
  }

  // Universal navigation extremes
  switch (key) {
    case 'Home':
      return { type: 'nav.first' }
    case 'End':
      return { type: 'nav.last' }
    case 'PageUp':
      return { type: 'nav.pageNext' }
    case 'PageDown':
      return { type: 'nav.pagePrev' }
    case 'Escape':
      return { type: 'cancel' }
    case 'Enter':
    case ' ':
      return { type: 'activate' }
  }

  // Axis-based arrow key navigation
  if (axis === 'both') {
    // Grid / 2D navigation
    switch (key) {
      case 'ArrowDown':
        return { type: 'nav.down' }
      case 'ArrowUp':
        return { type: 'nav.up' }
      case 'ArrowRight':
        return { type: 'nav.right' }
      case 'ArrowLeft':
        return { type: 'nav.left' }
    }
  } else if (axis === 'block') {
    // Vertical lists: ArrowDown → next, ArrowUp → prev
    switch (key) {
      case 'ArrowDown':
        return { type: 'nav.next' }
      case 'ArrowUp':
        return { type: 'nav.prev' }
    }
  } else if (axis === 'inline') {
    // Horizontal toolbars/linear: ArrowRight → next, ArrowLeft → prev
    switch (key) {
      case 'ArrowRight':
        return { type: 'nav.next' }
      case 'ArrowLeft':
        return { type: 'nav.prev' }
    }
  }

  return null
}

/**
 * Returns the default traversal axis for a given context kind.
 * Used when `axis` is not explicitly provided.
 */
export function defaultAxis(kind: InteractionContextKind): TraversalAxis {
  switch (kind) {
    case 'linear':
      return 'inline'
    case 'grid':
      return 'both'
    case 'list':
    case 'document':
    case 'pane-stack':
    case 'tree':
    case 'range':
      return 'block'
    case 'field':
    case 'overlay':
    default:
      return 'block'
  }
}
