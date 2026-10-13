import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

async function addTask(page: Page, title: string) {
  await page.locator('.fab').click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input').first().fill(title)
  await dialog.getByRole('button', { name: 'Saqlash' }).click()
  await expect(dialog).toBeHidden()
}

const titles = (page: Page) => page.locator('.task__title').allTextContents()

test('plans can be dragged into a new order, which survives a reload', async ({ page, pageErrors }) => {
  await page.goto('/')
  for (const title of ['Birinchi', 'Ikkinchi', 'Uchinchi']) await addTask(page, title)
  await expect.poll(() => titles(page)).toEqual(['Birinchi', 'Ikkinchi', 'Uchinchi'])

  // Drag "Uchinchi" by its grip above "Birinchi".
  const grip = page.getByRole('button', { name: 'Tartibini o‘zgartirish: Uchinchi' })
  const from = (await grip.boundingBox())!
  const first = (await page.locator('.task').first().boundingBox())!
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2, first.y + 4, { steps: 8 })
  await page.mouse.up()
  await expect.poll(() => titles(page)).toEqual(['Uchinchi', 'Birinchi', 'Ikkinchi'])

  // The keyboard works too: ↓ on "Uchinchi" moves it one place down.
  await page.getByRole('button', { name: 'Tartibini o‘zgartirish: Uchinchi' }).press('ArrowDown')
  await expect.poll(() => titles(page)).toEqual(['Birinchi', 'Uchinchi', 'Ikkinchi'])

  await page.reload()
  await expect.poll(() => titles(page)).toEqual(['Birinchi', 'Uchinchi', 'Ikkinchi'])
  expect(pageErrors).toEqual([])
})
