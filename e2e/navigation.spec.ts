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

test('a reminder can be pinned to a calendar day and shows on Today', async ({ page, pageErrors }) => {
  await page.goto('/')
  const nav = (name: string) => page.locator('.bottom-nav').getByRole('button', { name, exact: true })
  await nav('Kalendar').click()

  await page.getByRole('button', { name: 'Eslatma qo‘shish' }).click()
  await page.getByLabel('Nimani eslatay?').fill('Onamga qo‘ng‘iroq')
  await page.getByRole('button', { name: 'Belgilangan vaqtda' }).click()
  await page.getByLabel('Vaqt').fill('18:30')
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.getByText('Eslatma saqlandi')).toBeVisible()

  await expect(page.locator('.reminder-row', { hasText: 'Onamga qo‘ng‘iroq' })).toContainText('18:30')
  await expect(page.locator('.calendar__day--today')).toHaveAttribute('aria-label', /1 ta eslatma/)
  await expect(page.locator('.calendar__day--today .calendar__bell')).toBeVisible()

  await nav('Bugun').click()
  await expect(page.locator('.reminder-row', { hasText: 'Onamga qo‘ng‘iroq' })).toBeVisible()

  // Edit: switch to "3 times", then delete.
  await page.locator('.reminder-row').click()
  await page.getByRole('button', { name: 'Kun davomida 3 marta' }).click()
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.locator('.reminder-row')).toContainText('09:00, 14:00, 20:00')
  await page.locator('.reminder-row').click()
  await page.getByRole('button', { name: 'Eslatmani o‘chirish' }).click()
  await page.getByRole('button', { name: 'O‘chirish uchun yana bir marta bosing' }).click()
  await expect(page.locator('.reminder-row')).toHaveCount(0)

  await nav('Sozlamalar').click()
  const coach = page.getByRole('switch', { name: /Murabbiy ohangi/ })
  await expect(coach).toHaveAttribute('aria-checked', 'true')
  await coach.click()
  await expect(coach).toHaveAttribute('aria-checked', 'false')
  expect(pageErrors).toEqual([])
})
