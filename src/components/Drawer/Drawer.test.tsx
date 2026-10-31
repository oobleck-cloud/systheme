/**
 * Drawer — Behavior tests
 *
 * A. Visibility — renders when open, absent when closed (controlled + uncontrolled)
 * B. Close button — clicking × calls onOpenChange(false)
 * C. Backdrop close — clicking the scrim calls onOpenChange(false)
 * D. Escape close — Escape keydown on document calls onOpenChange(false)
 * E. Side variants — side prop reflected in data attributes / ARIA
 * F. ARIA — role=dialog, aria-modal, aria-labelledby (with title) / aria-label (without)
 * G. Body overflow — document.body.style.overflow set to "hidden" when open
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Drawer } from './Drawer'

function renderDrawer(props: Partial<React.ComponentProps<typeof Drawer>> = {}) {
  return render(
    <Drawer {...props}>
      <p>서랍 콘텐츠</p>
    </Drawer>,
  )
}

afterEach(() => {
  document.body.style.overflow = ''
})

// ─── A. Visibility ────────────────────────────────────────────────────────────

describe('A. Visibility', () => {
  it('renders dialog when open=true', () => {
    renderDrawer({ open: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render dialog when open=false', () => {
    renderDrawer({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders children when open', () => {
    renderDrawer({ open: true })
    expect(screen.getByText('서랍 콘텐츠')).toBeInTheDocument()
  })

  it('uncontrolled defaultOpen=true renders dialog on mount', () => {
    renderDrawer({ defaultOpen: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uncontrolled defaultOpen=false (default) does not render dialog', () => {
    renderDrawer()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ─── B. Close button ──────────────────────────────────────────────────────────

describe('B. Close button', () => {
  it('clicking the close button calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderDrawer({ open: true, title: '서랍 제목', onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: '서랍 닫기' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('close button present even without title', () => {
    renderDrawer({ open: true })
    expect(screen.getByRole('button', { name: '서랍 닫기' })).toBeInTheDocument()
  })

  it('clicking the close button in uncontrolled mode calls onOpenChange(false)', () => {
    // AnimatePresence keeps dialog in DOM during exit animation, so we verify
    // the state change via onOpenChange rather than DOM removal.
    const onOpenChange = vi.fn()
    renderDrawer({ defaultOpen: true, onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: '서랍 닫기' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── C. Backdrop close ────────────────────────────────────────────────────────

describe('C. Backdrop close', () => {
  it('clicking the backdrop scrim calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderDrawer({ open: true, onOpenChange })

    const backdrop = document.querySelector('[data-slot="drawer-backdrop"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── D. Escape close ─────────────────────────────────────────────────────────

describe('D. Escape close', () => {
  it('Escape keydown on document calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderDrawer({ open: true, onOpenChange })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('Escape does nothing when drawer is closed', () => {
    const onOpenChange = vi.fn()
    renderDrawer({ open: false, onOpenChange })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('Escape in uncontrolled mode calls onOpenChange(false)', () => {
    // AnimatePresence keeps dialog in DOM during exit animation, so we verify
    // the state change via onOpenChange rather than DOM removal.
    const onOpenChange = vi.fn()
    renderDrawer({ defaultOpen: true, onOpenChange })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── E. Side variants ────────────────────────────────────────────────────────

describe('E. Side variants', () => {
  const sides = ['left', 'right', 'top', 'bottom'] as const

  sides.forEach((side) => {
    it(`side="${side}" renders the dialog`, () => {
      renderDrawer({ open: true, side })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('default side is "right"', () => {
    renderDrawer({ open: true })
    // The panel has data-panel-shape corresponding to edge-right
    const panel = document.querySelector('[data-panel-shape="edge-right"]')
    expect(panel).not.toBeNull()
  })

  it('side="left" uses edge-left panel shape', () => {
    renderDrawer({ open: true, side: 'left' })
    const panel = document.querySelector('[data-panel-shape="edge-left"]')
    expect(panel).not.toBeNull()
  })
})

// ─── F. ARIA ──────────────────────────────────────────────────────────────────

describe('F. ARIA', () => {
  it('has role="dialog" when open', () => {
    renderDrawer({ open: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dialog has aria-modal="true"', () => {
    renderDrawer({ open: true })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('with title: dialog is labelled by the title heading (aria-labelledby)', () => {
    renderDrawer({ open: true, title: '서랍 제목' })

    const dialog = screen.getByRole('dialog')
    const labelledById = dialog.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()

    const titleEl = document.getElementById(labelledById!)
    expect(titleEl).not.toBeNull()
    expect(titleEl!.textContent).toBe('서랍 제목')
  })

  it('without title: dialog has aria-label="서랍"', () => {
    renderDrawer({ open: true })

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-label', '서랍')
    expect(dialog).not.toHaveAttribute('aria-labelledby')
  })

  it('custom titleId is used for aria-labelledby', () => {
    renderDrawer({ open: true, title: '제목', titleId: 'custom-title' })

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'custom-title')
  })

  it('footer slot renders when provided', () => {
    renderDrawer({ open: true, footer: <button>저장</button> })
    expect(screen.getByRole('button', { name: '저장' })).toBeInTheDocument()
  })
})

// ─── G. Body overflow ────────────────────────────────────────────────────────

describe('G. Body overflow', () => {
  it('sets document.body.style.overflow to "hidden" when open', () => {
    renderDrawer({ open: true })
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow when drawer is closed', () => {
    const { rerender } = renderDrawer({ open: true })
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Drawer open={false}>
        <p>콘텐츠</p>
      </Drawer>,
    )

    expect(document.body.style.overflow).toBe('')
  })
})
