/**
 * useInteractionContext — Interaction Grammar PR2
 *
 * Test-first specification covering:
 *  A. Key → Intent resolution by context kind
 *  B. Escape bubbling
 *  C. roving tabindex
 *  D. contextProps spread (role/aria)
 *  E. onIntent handled/unhandled propagation
 */

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { resolveIntent } from './resolver'
import { useInteractionContext } from './useInteractionContext'

// ---------------------------------------------------------------------------
// A. Key → Intent resolution by context kind
// ---------------------------------------------------------------------------

describe('A. Key → Intent resolution by context kind', () => {
  // ---- list (axis=block) ----
  describe('list (axis=block)', () => {
    const kind = 'list' as const
    const axis = 'block' as const

    it('ArrowDown → nav.next', () => {
      expect(resolveIntent(kind, axis, 'ArrowDown')).toEqual({ type: 'nav.next' })
    })

    it('ArrowUp → nav.prev', () => {
      expect(resolveIntent(kind, axis, 'ArrowUp')).toEqual({ type: 'nav.prev' })
    })

    it('Home → nav.first', () => {
      expect(resolveIntent(kind, axis, 'Home')).toEqual({ type: 'nav.first' })
    })

    it('End → nav.last', () => {
      expect(resolveIntent(kind, axis, 'End')).toEqual({ type: 'nav.last' })
    })

    it('Enter → activate', () => {
      expect(resolveIntent(kind, axis, 'Enter')).toEqual({ type: 'activate' })
    })

    it('Space → activate', () => {
      expect(resolveIntent(kind, axis, ' ')).toEqual({ type: 'activate' })
    })

    it('Escape → cancel', () => {
      expect(resolveIntent(kind, axis, 'Escape')).toEqual({ type: 'cancel' })
    })

    it('ArrowLeft → null (not inline axis)', () => {
      expect(resolveIntent(kind, axis, 'ArrowLeft')).toBeNull()
    })

    it('ArrowRight → null (not inline axis)', () => {
      expect(resolveIntent(kind, axis, 'ArrowRight')).toBeNull()
    })
  })

  // ---- linear/toolbar (axis=inline) ----
  describe('linear/toolbar (axis=inline)', () => {
    const kind = 'linear' as const
    const axis = 'inline' as const

    it('ArrowRight → nav.next', () => {
      expect(resolveIntent(kind, axis, 'ArrowRight')).toEqual({ type: 'nav.next' })
    })

    it('ArrowLeft → nav.prev', () => {
      expect(resolveIntent(kind, axis, 'ArrowLeft')).toEqual({ type: 'nav.prev' })
    })

    it('Home → nav.first', () => {
      expect(resolveIntent(kind, axis, 'Home')).toEqual({ type: 'nav.first' })
    })

    it('End → nav.last', () => {
      expect(resolveIntent(kind, axis, 'End')).toEqual({ type: 'nav.last' })
    })

    it('ArrowDown → null (not block axis)', () => {
      expect(resolveIntent(kind, axis, 'ArrowDown')).toBeNull()
    })

    it('ArrowUp → null (not block axis)', () => {
      expect(resolveIntent(kind, axis, 'ArrowUp')).toBeNull()
    })
  })

  // ---- grid (axis=both) ----
  describe('grid (axis=both)', () => {
    const kind = 'grid' as const
    const axis = 'both' as const

    it('ArrowDown → nav.down', () => {
      expect(resolveIntent(kind, axis, 'ArrowDown')).toEqual({ type: 'nav.down' })
    })

    it('ArrowUp → nav.up', () => {
      expect(resolveIntent(kind, axis, 'ArrowUp')).toEqual({ type: 'nav.up' })
    })

    it('ArrowRight → nav.right', () => {
      expect(resolveIntent(kind, axis, 'ArrowRight')).toEqual({ type: 'nav.right' })
    })

    it('ArrowLeft → nav.left', () => {
      expect(resolveIntent(kind, axis, 'ArrowLeft')).toEqual({ type: 'nav.left' })
    })

    it('Home → nav.first', () => {
      expect(resolveIntent(kind, axis, 'Home')).toEqual({ type: 'nav.first' })
    })

    it('End → nav.last', () => {
      expect(resolveIntent(kind, axis, 'End')).toEqual({ type: 'nav.last' })
    })
  })

  // ---- overlay ----
  describe('overlay', () => {
    const kind = 'overlay' as const
    const axis = 'block' as const

    it('Escape → cancel', () => {
      expect(resolveIntent(kind, axis, 'Escape')).toEqual({ type: 'cancel' })
    })

    it('Enter → activate', () => {
      expect(resolveIntent(kind, axis, 'Enter')).toEqual({ type: 'activate' })
    })
  })

  // ---- field (absorbsTraversal) ----
  describe('field (absorbsTraversal)', () => {
    const kind = 'field' as const
    const axis = 'block' as const

    it('ArrowDown → null (native caret)', () => {
      expect(resolveIntent(kind, axis, 'ArrowDown')).toBeNull()
    })

    it('ArrowUp → null (native caret)', () => {
      expect(resolveIntent(kind, axis, 'ArrowUp')).toBeNull()
    })

    it('ArrowLeft → null (native caret)', () => {
      expect(resolveIntent(kind, axis, 'ArrowLeft')).toBeNull()
    })

    it('ArrowRight → null (native caret)', () => {
      expect(resolveIntent(kind, axis, 'ArrowRight')).toBeNull()
    })

    it('Enter → edit.commit', () => {
      expect(resolveIntent(kind, axis, 'Enter')).toEqual({ type: 'edit.commit' })
    })

    it('Escape → edit.cancel', () => {
      expect(resolveIntent(kind, axis, 'Escape')).toEqual({ type: 'edit.cancel' })
    })
  })
})

// ---------------------------------------------------------------------------
// B. Escape bubbling — via onIntent return value
// ---------------------------------------------------------------------------

describe('B. Escape bubbling (via onIntent return value)', () => {
  it('field Escape with value: onIntent returns true (handled) — stops propagation', () => {
    // Simulate: field has value → edit.cancel is handled (returns true)
    const hasValue = true
    const onIntent = vi.fn((intent: { type: string }) => {
      if (intent.type === 'edit.cancel') {
        return hasValue // true when field has value
      }
      return false
    })

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'field',
        onIntent,
      }),
    )

    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    const stopPropagation = vi.spyOn(mockEvent, 'stopPropagation')
    const preventDefault = vi.spyOn(mockEvent, 'preventDefault')

    // Create a synthetic React keyboard event wrapping the native event
    act(() => {
      const { onKeyDown } = result.current.contextProps
      if (onKeyDown) {
        onKeyDown({
          key: 'Escape',
          nativeEvent: mockEvent,
          stopPropagation: () => mockEvent.stopPropagation(),
          preventDefault: () => mockEvent.preventDefault(),
        } as unknown as React.KeyboardEvent<HTMLElement>)
      }
    })

    expect(onIntent).toHaveBeenCalledWith({ type: 'edit.cancel' }, mockEvent)
    expect(stopPropagation).toHaveBeenCalled()
    expect(preventDefault).toHaveBeenCalled()
  })

  it('field Escape without value: onIntent returns false (unhandled) — does NOT stop propagation', () => {
    // Simulate: field is empty → edit.cancel is NOT handled (returns false)
    const hasValue = false
    const onIntent = vi.fn((intent: { type: string }) => {
      if (intent.type === 'edit.cancel') {
        return hasValue as boolean // false when field is empty
      }
      return false
    })

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'field',
        onIntent,
      }),
    )

    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    const stopPropagation = vi.spyOn(mockEvent, 'stopPropagation')
    const preventDefault = vi.spyOn(mockEvent, 'preventDefault')

    act(() => {
      const { onKeyDown } = result.current.contextProps
      if (onKeyDown) {
        onKeyDown({
          key: 'Escape',
          nativeEvent: mockEvent,
          stopPropagation: () => mockEvent.stopPropagation(),
          preventDefault: () => mockEvent.preventDefault(),
        } as unknown as React.KeyboardEvent<HTMLElement>)
      }
    })

    expect(onIntent).toHaveBeenCalledWith({ type: 'edit.cancel' }, mockEvent)
    // NOT stopped — should bubble to parent
    expect(stopPropagation).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('overlay Escape: always handled (cancel intent returned)', () => {
    const onIntent = vi.fn(() => true)

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'overlay',
        onIntent,
      }),
    )

    const mockEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    const stopPropagation = vi.spyOn(mockEvent, 'stopPropagation')

    act(() => {
      const { onKeyDown } = result.current.contextProps
      if (onKeyDown) {
        onKeyDown({
          key: 'Escape',
          nativeEvent: mockEvent,
          stopPropagation: () => mockEvent.stopPropagation(),
          preventDefault: () => mockEvent.preventDefault(),
        } as unknown as React.KeyboardEvent<HTMLElement>)
      }
    })

    expect(onIntent).toHaveBeenCalledWith({ type: 'cancel' }, mockEvent)
    expect(stopPropagation).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// C. Roving tabindex
// ---------------------------------------------------------------------------

describe('C. Roving tabindex', () => {
  it('initial: first item (index 0) has tabIndex=0, others have tabIndex=-1', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        itemCount: 3,
        onIntent: () => {},
      }),
    )

    expect(result.current.getItemProps(0).tabIndex).toBe(0)
    expect(result.current.getItemProps(1).tabIndex).toBe(-1)
    expect(result.current.getItemProps(2).tabIndex).toBe(-1)
  })

  it('after setFocusedIndex(1): index 1 gets tabIndex=0, others get tabIndex=-1', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        itemCount: 3,
        onIntent: () => {},
      }),
    )

    act(() => {
      result.current.setFocusedIndex(1)
    })

    expect(result.current.getItemProps(0).tabIndex).toBe(-1)
    expect(result.current.getItemProps(1).tabIndex).toBe(0)
    expect(result.current.getItemProps(2).tabIndex).toBe(-1)
  })

  it('clicking an item updates focusedIndex to that item', () => {
    const onIntent = vi.fn()
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        itemCount: 3,
        onIntent,
      }),
    )

    const itemProps = result.current.getItemProps(2)
    act(() => {
      itemProps.onClick?.({
        nativeEvent: new MouseEvent('click'),
      } as unknown as React.MouseEvent<HTMLElement>)
    })

    expect(result.current.focusedIndex).toBe(2)
    expect(result.current.getItemProps(2).tabIndex).toBe(0)
    expect(result.current.getItemProps(0).tabIndex).toBe(-1)
  })

  it('onFocus on item updates focusedIndex', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        itemCount: 3,
        onIntent: () => {},
      }),
    )

    act(() => {
      result.current.getItemProps(2).onFocus?.({} as React.FocusEvent<HTMLElement>)
    })

    expect(result.current.focusedIndex).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// D. contextProps spread (role/aria)
// ---------------------------------------------------------------------------

describe('D. contextProps spread', () => {
  it('list → role="listbox" and aria-orientation="vertical"', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        onIntent: () => {},
      }),
    )

    expect(result.current.contextProps.role).toBe('listbox')
    expect(result.current.contextProps['aria-orientation']).toBe('vertical')
  })

  it('linear → role="toolbar" and aria-orientation="horizontal"', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'linear',
        onIntent: () => {},
      }),
    )

    expect(result.current.contextProps.role).toBe('toolbar')
    expect(result.current.contextProps['aria-orientation']).toBe('horizontal')
  })

  it('grid → role="grid"', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'grid',
        onIntent: () => {},
      }),
    )

    expect(result.current.contextProps.role).toBe('grid')
  })

  it('overlay → role="dialog"', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'overlay',
        onIntent: () => {},
      }),
    )

    expect(result.current.contextProps.role).toBe('dialog')
  })

  it('field → no role set', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'field',
        onIntent: () => {},
      }),
    )

    expect(result.current.contextProps.role).toBeUndefined()
  })

  it('contextProps has onKeyDown handler', () => {
    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        onIntent: () => {},
      }),
    )

    expect(typeof result.current.contextProps.onKeyDown).toBe('function')
  })
})

// ---------------------------------------------------------------------------
// E. onIntent callback — handled vs unhandled propagation
// ---------------------------------------------------------------------------

describe('E. onIntent handled/unhandled propagation', () => {
  it('onIntent returning true (handled) → stopPropagation + preventDefault called', () => {
    const onIntent = vi.fn(() => true as boolean | void)

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        axis: 'block',
        onIntent,
      }),
    )

    const mockNativeEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    const stopPropagation = vi.spyOn(mockNativeEvent, 'stopPropagation')
    const preventDefault = vi.spyOn(mockNativeEvent, 'preventDefault')

    act(() => {
      result.current.contextProps.onKeyDown?.({
        key: 'ArrowDown',
        nativeEvent: mockNativeEvent,
        stopPropagation: () => mockNativeEvent.stopPropagation(),
        preventDefault: () => mockNativeEvent.preventDefault(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    expect(onIntent).toHaveBeenCalledWith({ type: 'nav.next' }, mockNativeEvent)
    expect(stopPropagation).toHaveBeenCalled()
    expect(preventDefault).toHaveBeenCalled()
  })

  it('onIntent returning false (unhandled) → event NOT stopped (bubbles)', () => {
    const onIntent = vi.fn(() => false as boolean | void)

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        axis: 'block',
        onIntent,
      }),
    )

    const mockNativeEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    const stopPropagation = vi.spyOn(mockNativeEvent, 'stopPropagation')
    const preventDefault = vi.spyOn(mockNativeEvent, 'preventDefault')

    act(() => {
      result.current.contextProps.onKeyDown?.({
        key: 'ArrowDown',
        nativeEvent: mockNativeEvent,
        stopPropagation: () => mockNativeEvent.stopPropagation(),
        preventDefault: () => mockNativeEvent.preventDefault(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    expect(onIntent).toHaveBeenCalledWith({ type: 'nav.next' }, mockNativeEvent)
    expect(stopPropagation).not.toHaveBeenCalled()
    expect(preventDefault).not.toHaveBeenCalled()
  })

  it('onIntent returning void (unhandled) → event NOT stopped', () => {
    const onIntent = vi.fn((_intent: unknown, _event: unknown) => {
      // returns undefined (void)
    })

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        axis: 'block',
        onIntent,
      }),
    )

    const mockNativeEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    const stopPropagation = vi.spyOn(mockNativeEvent, 'stopPropagation')

    act(() => {
      result.current.contextProps.onKeyDown?.({
        key: 'Enter',
        nativeEvent: mockNativeEvent,
        stopPropagation: () => mockNativeEvent.stopPropagation(),
        preventDefault: () => mockNativeEvent.preventDefault(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    expect(stopPropagation).not.toHaveBeenCalled()
  })

  it('unknown key → onIntent not called', () => {
    const onIntent = vi.fn()

    const { result } = renderHook(() =>
      useInteractionContext({
        kind: 'list',
        axis: 'block',
        onIntent,
      }),
    )

    const mockNativeEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })

    act(() => {
      result.current.contextProps.onKeyDown?.({
        key: 'Tab',
        nativeEvent: mockNativeEvent,
        stopPropagation: () => mockNativeEvent.stopPropagation(),
        preventDefault: () => mockNativeEvent.preventDefault(),
      } as unknown as React.KeyboardEvent<HTMLElement>)
    })

    expect(onIntent).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Additional resolver edge cases
// ---------------------------------------------------------------------------

describe('resolver edge cases', () => {
  it('PageUp → nav.pageNext', () => {
    expect(resolveIntent('list', 'block', 'PageUp')).toEqual({ type: 'nav.pageNext' })
  })

  it('PageDown → nav.pagePrev', () => {
    expect(resolveIntent('list', 'block', 'PageDown')).toEqual({ type: 'nav.pagePrev' })
  })

  it('arbitrary character key → null', () => {
    expect(resolveIntent('list', 'block', 'a')).toBeNull()
    expect(resolveIntent('list', 'block', 'Tab')).toBeNull()
    expect(resolveIntent('list', 'block', 'Shift')).toBeNull()
  })

  it('grid ArrowDown/Up/Left/Right all resolve correctly', () => {
    expect(resolveIntent('grid', 'both', 'ArrowDown')).toEqual({ type: 'nav.down' })
    expect(resolveIntent('grid', 'both', 'ArrowUp')).toEqual({ type: 'nav.up' })
    expect(resolveIntent('grid', 'both', 'ArrowLeft')).toEqual({ type: 'nav.left' })
    expect(resolveIntent('grid', 'both', 'ArrowRight')).toEqual({ type: 'nav.right' })
  })
})
