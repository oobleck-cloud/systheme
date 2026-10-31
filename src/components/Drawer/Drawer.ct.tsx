import { expect, test } from '@playwright/experimental-ct-react'

import { FocusTrapDrawer, OpenDrawer, ScrollLockDrawer } from './Drawer.ct.fixture'

/**
 * Drawer Playwright CT — Storybook play 함수만으로 검증하기 어려운
 * 실 브라우저 동작들을 격리된 fixture로 검증.
 */

test('dialog에 role=dialog + aria-modal=true', async ({ mount, page }) => {
  await mount(<OpenDrawer />)
  const dialog = page.locator('[role=dialog]')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
})

test('aria-labelledby가 title의 id를 가리킨다', async ({ mount, page }) => {
  await mount(<OpenDrawer />)
  const dialog = page.locator('[role=dialog]')
  const labelledby = await dialog.getAttribute('aria-labelledby')
  expect(labelledby).toBeTruthy()
  await expect(page.locator(`#${labelledby}`)).toHaveText('테스트 드로어')
})

test('Esc 키로 drawer가 닫힌다', async ({ mount, page }) => {
  await mount(<OpenDrawer />)
  await expect(page.locator('[role=dialog]')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
})

test('backdrop 클릭으로 drawer가 닫힌다', async ({ mount, page }) => {
  await mount(<OpenDrawer />)
  await expect(page.locator('[role=dialog]')).toBeVisible()
  await page.locator('[data-slot="drawer-backdrop"]').dispatchEvent('click')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
})

test('Close 버튼으로 닫힌다', async ({ mount, page }) => {
  await mount(<OpenDrawer />)
  await page.locator('[data-slot="drawer-close"]').dispatchEvent('click')
  await expect(page.locator('[role=dialog]')).toHaveCount(0)
})

test('open 동안 body scroll lock이 활성화', async ({ mount, page }) => {
  await mount(<ScrollLockDrawer />)
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
  await page.locator('[data-testid=trigger]').click()
  await expect(page.locator('[role=dialog]')).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')
})

test('side=left: 패널이 화면 왼쪽에 있다', async ({ mount, page }) => {
  await mount(<OpenDrawer side="left" />)
  const panel = page.locator('[data-slot="drawer-panel"]')
  await expect(panel).toBeVisible()
  // slide-in 애니메이션(spring.expressive) 완료 후 위치 검증
  await expect
    .poll(async () => {
      const box = await panel.boundingBox()
      return box?.x ?? -9999
    })
    .toBeCloseTo(0, 0)
})

test('side=right: 패널이 화면 오른쪽에 있다', async ({ mount, page }) => {
  await mount(<OpenDrawer side="right" />)
  const panel = page.locator('[data-slot="drawer-panel"]')
  await expect(panel).toBeVisible()
  const viewportWidth = page.viewportSize()?.width ?? 1280
  // slide-in 애니메이션(spring.expressive) 완료 후 위치 검증
  await expect
    .poll(async () => {
      const box = await panel.boundingBox()
      if (!box) return -1
      return box.x + box.width
    })
    .toBeCloseTo(viewportWidth, -1)
})

test('side=bottom: 패널이 visible이다', async ({ mount, page }) => {
  await mount(<OpenDrawer side="bottom" />)
  const panel = page.locator('[data-slot="drawer-panel"]')
  await expect(panel).toBeVisible()
  // bottom drawer는 inset-x-0 bottom-0 으로 하단에 고정됨 — 가시성으로 충분히 검증
  const box = await panel.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.y).toBeGreaterThan(0)
})

test('focus trap: 마지막 요소에서 Tab → 첫 요소(Close)로 돌아온다', async ({ mount, page }) => {
  await mount(<FocusTrapDrawer />)
  await expect(page.locator('[role=dialog]')).toBeVisible()

  // 마지막 버튼에 포커스
  await page.locator('[data-testid="btn-c"]').focus()
  await page.keyboard.press('Tab')

  // focus trap: 마지막 → 첫 번째(Close 버튼)
  const activeSlot = await page.evaluate(() => document.activeElement?.getAttribute('data-slot'))
  expect(activeSlot).toBe('drawer-close')
})

test('focus trap: 첫 요소(Close)에서 Shift+Tab → 마지막 요소로 돌아온다', async ({
  mount,
  page,
}) => {
  await mount(<FocusTrapDrawer />)
  await expect(page.locator('[role=dialog]')).toBeVisible()

  // 첫 번째 요소(Close)에 포커스
  await page.locator('[data-slot="drawer-close"]').focus()
  await page.keyboard.press('Shift+Tab')

  // focus trap: 첫 번째 ← 마지막 버튼(btn-c)
  const activeTestId = await page.evaluate(() =>
    document.activeElement?.getAttribute('data-testid'),
  )
  expect(activeTestId).toBe('btn-c')
})
