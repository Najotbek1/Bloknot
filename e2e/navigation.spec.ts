import { expect, test } from './fixtures'

const TABS = ['Bugun', 'Kalendar', 'Bloknot', 'Statistika', 'Sozlamalar']

test('every bottom tab opens without breaking the app', async ({ page, pageErrors }) => {
  await page.goto('/')
  for (const tab of [...TABS, ...TABS]) {
    await page.locator('.bottom-nav').getByRole('button', { name: tab, exact: true }).click()
    await expect(page.locator('.screen__title')).toBeVisible()
    await expect(page.locator('.bottom-nav')).toBeVisible()
  }
  expect(pageErrors).toEqual([])
})

test('a task can be added, completed and found again after switching tabs', async ({ page, pageErrors }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reja qo‘shish' }).click()
  await page.getByLabel('Nomi').fill('Kitob o‘qish')
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.getByText('Reja qo‘shildi')).toBeVisible()

  await page.getByRole('button', { name: 'Bajarildi deb belgilash' }).click()
  await expect(page.getByText('Barakalla!')).toBeVisible()

  await page.locator('.bottom-nav').getByRole('button', { name: 'Kalendar', exact: true }).click()
  await expect(page.getByText('Kitob o‘qish')).toBeVisible()
  await page.locator('.bottom-nav').getByRole('button', { name: 'Bugun', exact: true }).click()
  await expect(page.getByText('Kitob o‘qish')).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('closing the editor with typed text asks before discarding', async ({ page, pageErrors }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reja qo‘shish' }).click()
  await page.getByLabel('Nomi').fill('Yo‘qolmasin')
  await page.keyboard.press('Escape')
  await expect(page.getByText('O‘zgarishlar saqlanmagan')).toBeVisible()
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.locator('.task__title', { hasText: 'Yo‘qolmasin' })).toBeVisible()
  expect(pageErrors).toEqual([])
})

test('the calendar shows a day’s plans, and Settings can switch to lists', async ({ page, pageErrors }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Reja qo‘shish' }).click()
  await page.getByLabel('Nomi').fill('Sport zali')
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.getByText('Reja qo‘shildi')).toBeVisible()

  await page.locator('.bottom-nav').getByRole('button', { name: 'Kalendar', exact: true }).click()
  // Today's cell reports one plan and the list under the grid shows it.
  await expect(page.locator('.calendar__day--today')).toHaveAttribute('aria-label', /1 ta reja/)
  await expect(page.locator('.task__title', { hasText: 'Sport zali' })).toBeVisible()

  // Another day of the month has no plans.
  const otherDay = page.locator('.calendar__day:not(.calendar__day--today):not(.calendar__day--outside)').first()
  await otherDay.click()
  await expect(page.getByText('Bu kun uchun reja yo‘q.')).toBeVisible()

  await page.locator('.bottom-nav').getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await page.getByRole('button', { name: 'Ro‘yxat' }).click()
  await page.getByRole('radio', { name: 'Tim qora' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'black')

  await page.locator('.bottom-nav').getByRole('button', { name: 'Kalendar', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'Hafta' })).toBeVisible()
  await expect(page.locator('.calendar')).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
