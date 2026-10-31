import { expect, test } from '@playwright/experimental-ct-react'

import { FocusTrapModal, OpenModal, ScrollLockModal } from './Modal.ct.fixture'

/**
 * Modal Playwright CT — Storybook play 함수만으로 검증하기 어려운
 * 실 브라우저 동작들을 격리된 fixture로 검증.
 *
 * 각 테스트는 필요한 최소 fixture만 마운트해 DOM 좌표 충돌을 방지.
 */

test('dialog에 role=dialog + aria-modal=true', async ({ mount, page }) => {
  await mount(<OpenModal />)
  const dialog = page.locator('[role=dialog]')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
})

test('aria-labelledby가 title의 id를 가리킨다', async ({ mount, page }) => {
  await mount(<OpenModal />)
  const dialog = page.locator('[role=dialog]')
  const labelledby = await dialog.getAttribute('aria-labelledby')
  expect(labelledby).toBeTruthy()
  await expect(page.locator(`#${labelledby}`)).toHaveText('알림')
})

test('Esc 키로 modal이 닫힌다', async ({ mount, page }) => {
  await mount(<OpenModal />)
  await expect(page.locator('[role=dialog]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
})

test('Close 버튼으로 닫힌다', async ({ mount, page }) => {
  await mount(<OpenModal />)
  // Playwright CT의 mount viewport가 좁아 dialog 헤더가 잘릴 수 있으므로
  // JavaScript 클릭으로 visibility 우회
  await page.locator('[aria-label="대화상자 닫기"]').dispatchEvent('click')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
})

test('open 동안 body scroll lock이 활성화', async ({ mount, page }) => {
  await mount(<ScrollLockModal />)
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  await page.locator('[data-testid=trigger]').click()
  await expect(page.locator('[role=dialog]')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')
})

test('backdrop 클릭으로 modal이 닫힌다', async ({ mount, page }) => {
  await mount(<OpenModal />)
  await expect(page.locator('[role=dialog]')).toBeVisible()
  await page.locator('[data-slot="modal-backdrop"]').dispatchEvent('click')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
})

test('focus trap: 마지막 요소에서 Tab → 첫 요소(Close)로 돌아온다', async ({ mount, page }) => {
  await mount(<FocusTrapModal />)
  await expect(page.locator('[role=dialog]')).toBeVisible()

  // 마지막 버튼에 포커스
  await page.locator('[data-testid="btn-c"]').focus()
  await page.keyboard.press('Tab')

  // focus trap: 마지막 → 첫 번째(Close 버튼)
  const activeSlot = await page.evaluate(() => document.activeElement?.getAttribute('data-slot'))
  expect(activeSlot).toBe('modal-close')
})

test('focus trap: 첫 요소(Close)에서 Shift+Tab → 마지막 요소로 돌아온다', async ({
  mount,
  page,
}) => {
  await mount(<FocusTrapModal />)
  await expect(page.locator('[role=dialog]')).toBeVisible()

  // 첫 번째 요소(Close)에 포커스
  await page.locator('[data-slot="modal-close"]').focus()
  await page.keyboard.press('Shift+Tab')

  // focus trap: 첫 번째 ← 마지막 버튼(btn-c)
  const activeTestId = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-testid'),
  )
  expect(activeTestId).toBe('btn-c')
})
