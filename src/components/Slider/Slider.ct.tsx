import { expect, test } from '@playwright/experimental-ct-react'

import { SliderFixture } from './Slider.ct.fixture'

/**
 * Slider Playwright CT — native range input의 pointer drag를 실 브라우저에서 검증.
 * Storybook play + userEvent로는 range input의 mouse drag를 신뢰성 있게 시뮬레이션하기
 * 어렵기 때문에 Playwright CT를 사용한다.
 */

test('ArrowRight 키 → value가 1 증가', async ({ mount, page }) => {
  await mount(<SliderFixture initialValue={50} />)
  await page.locator('input[type=range]').focus()
  await page.keyboard.press('ArrowRight')
  const value = await page.locator('[data-testid="wrapper"]').getAttribute('data-value')
  expect(Number(value)).toBe(51)
})

test('ArrowLeft 키 → value가 1 감소', async ({ mount, page }) => {
  await mount(<SliderFixture initialValue={50} />)
  await page.locator('input[type=range]').focus()
  await page.keyboard.press('ArrowLeft')
  const value = await page.locator('[data-testid="wrapper"]').getAttribute('data-value')
  expect(Number(value)).toBe(49)
})

test('mouse drag → value가 변경된다', async ({ mount, page }) => {
  await mount(<SliderFixture initialValue={25} />)
  const input = page.locator('input[type=range]')
  const box = await input.boundingBox()
  expect(box).not.toBeNull()

  // 25% 지점(현재 값 위치)에서 75% 지점으로 드래그
  const startX = box!.x + box!.width * 0.25
  const endX = box!.x + box!.width * 0.75
  const y = box!.y + box!.height / 2

  await page.mouse.move(startX, y)
  await page.mouse.down()
  await page.mouse.move(endX, y, { steps: 10 })
  await page.mouse.up()

  const rawValue = await page.locator('[data-testid="wrapper"]').getAttribute('data-value')
  expect(Number(rawValue)).toBeGreaterThan(50)
})

test('min/max 경계: ArrowLeft에서 0 이하로 내려가지 않는다', async ({ mount, page }) => {
  await mount(<SliderFixture initialValue={0} />)
  await page.locator('input[type=range]').focus()
  await page.keyboard.press('ArrowLeft')
  const value = await page.locator('[data-testid="wrapper"]').getAttribute('data-value')
  expect(Number(value)).toBe(0)
})
