/**
 * Modal — Behavior tests
 *
 * A. Visibility — renders when open, absent when closed (controlled + uncontrolled)
 * B. Close button — clicking the × button calls onOpenChange(false)
 * C. Backdrop close — clicking the scrim calls onOpenChange(false)
 * D. Escape close — Escape keydown on document calls onOpenChange(false)
 * E. onOpenChange — called correctly for all close paths
 * F. ARIA — role=dialog, aria-modal, aria-labelledby matches title h2
 * G. Body overflow — document.body.style.overflow set to "hidden" when open
 */

import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Modal } from './Modal'

function renderModal(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  return render(
    <Modal title="테스트 모달" {...props}>
      <p>모달 본문 콘텐츠</p>
    </Modal>,
  )
}

afterEach(() => {
  // Reset body overflow after each test
  document.body.style.overflow = ''
})

// ─── A. Visibility ────────────────────────────────────────────────────────────

describe('A. Visibility', () => {
  it('renders dialog when open=true', () => {
    renderModal({ open: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render dialog when open=false', () => {
    renderModal({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders title and children when open', () => {
    renderModal({ open: true })
    expect(screen.getByText('테스트 모달')).toBeInTheDocument()
    expect(screen.getByText('모달 본문 콘텐츠')).toBeInTheDocument()
  })

  it('uncontrolled defaultOpen=true renders dialog on mount', () => {
    renderModal({ defaultOpen: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uncontrolled defaultOpen=false (default) does not render dialog', () => {
    renderModal()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ─── B. Close button ──────────────────────────────────────────────────────────

describe('B. Close button', () => {
  it('clicking the close (×) button calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderModal({ open: true, onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: '대화상자 닫기' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('clicking the close button in uncontrolled mode calls onOpenChange(false)', () => {
    // AnimatePresence keeps dialog in DOM during exit animation, so we verify
    // the state change via onOpenChange rather than DOM removal.
    const onOpenChange = vi.fn()
    renderModal({ defaultOpen: true, onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: '대화상자 닫기' }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── C. Backdrop close ────────────────────────────────────────────────────────

describe('C. Backdrop close', () => {
  it('clicking the backdrop scrim calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderModal({ open: true, onOpenChange })

    const backdrop = document.querySelector('[data-slot="modal-backdrop"]')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── D. Escape close ─────────────────────────────────────────────────────────

describe('D. Escape close', () => {
  it('Escape keydown on document calls onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderModal({ open: true, onOpenChange })

    // useDismissOnEscape attaches listener to document
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('Escape does nothing when modal is closed', () => {
    const onOpenChange = vi.fn()
    renderModal({ open: false, onOpenChange })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('Escape in uncontrolled mode calls onOpenChange(false)', () => {
    // AnimatePresence keeps dialog in DOM during exit animation, so we verify
    // the state change via onOpenChange rather than DOM removal.
    const onOpenChange = vi.fn()
    renderModal({ defaultOpen: true, onOpenChange })

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── E. onOpenChange ──────────────────────────────────────────────────────────

describe('E. onOpenChange', () => {
  it('called exactly once per close action', () => {
    const onOpenChange = vi.fn()
    renderModal({ open: true, onOpenChange })

    fireEvent.click(screen.getByRole('button', { name: '대화상자 닫기' }))

    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

// ─── F. ARIA ──────────────────────────────────────────────────────────────────

describe('F. ARIA', () => {
  it('has role="dialog" when open', () => {
    renderModal({ open: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('dialog has aria-modal="true"', () => {
    renderModal({ open: true })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('dialog is labelled by the title heading (aria-labelledby)', () => {
    renderModal({ open: true })

    const dialog = screen.getByRole('dialog')
    const labelledById = dialog.getAttribute('aria-labelledby')
    expect(labelledById).toBeTruthy()

    const titleEl = document.getElementById(labelledById!)
    expect(titleEl).not.toBeNull()
    expect(titleEl!.textContent).toBe('테스트 모달')
  })

  it('custom titleId is used for aria-labelledby', () => {
    renderModal({ open: true, titleId: 'my-title' })

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'my-title')
  })

  it('footer slot renders when provided', () => {
    renderModal({ open: true, footer: <button>확인</button> })
    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument()
  })
})

// ─── G. Body overflow ────────────────────────────────────────────────────────

describe('G. Body overflow', () => {
  it('sets document.body.style.overflow to "hidden" when open', () => {
    renderModal({ open: true })
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow when modal is closed', () => {
    const { rerender } = renderModal({ open: true })
    expect(document.body.style.overflow).toBe('hidden')

    rerender(
      <Modal open={false} title="테스트 모달">
        <p>콘텐츠</p>
      </Modal>,
    )

    expect(document.body.style.overflow).toBe('')
  })
  it('dialog takes the panel default width (w-full max-w-lg) — wrapper must carry w-full', () => {
    render(
      <Modal open onOpenChange={() => {}} title="폭">
        <p>본문</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog.className).toMatch(/\bw-full\b/)
    expect(dialog.className).toMatch(/\bmax-w-lg\b/)
    // 래퍼가 폭 없이 내용 크기면 패널의 퍼센트 폭이 무효가 된다
    expect(dialog.parentElement?.className).toMatch(/\bw-full\b/)
  })
})
