import { expect, test } from './fixtures'

test('with one-tap done off, the circle steps a plan through «Jarayonda» to «Bajarildi»', async ({ page, pageErrors }) => {
  await page.goto('/')
  await page.locator('.fab').click()
  const dialog = page.getByRole('dialog')
  // The kind and the repeat rule explain themselves.
  await expect(dialog.getByText('Aniq bir kun uchun reja', { exact: false })).toBeVisible()
  await expect(dialog.getByText('Reja faqat tanlangan kunning o‘zida bo‘ladi.')).toBeVisible()
  await dialog.getByRole('button', { name: 'Haftalik', exact: true }).click()
  await expect(dialog.getByText('Tanlangan hafta ichida istalgan kuni', { exact: false })).toBeVisible()
  await dialog.getByRole('button', { name: 'Kunlik', exact: true }).click()
  await dialog.locator('input').first().fill('Dars')
  await dialog.getByRole('button', { name: 'Saqlash' }).click()
  await expect(dialog).toBeHidden()

  // Default: one tap marks it done.
  await page.getByRole('button', { name: 'Bajarildi deb belgilash' }).click()
  await expect(page.getByRole('button', { name: 'Bajarilmagan deb belgilash' })).toBeVisible()
  await page.getByRole('button', { name: 'Bajarilmagan deb belgilash' }).click()

  // Turn it off in Settings; the coach is off by default.
  const nav = page.locator('.bottom-nav')
  await nav.getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await expect(page.getByRole('switch', { name: /Murabbiy ohangi/ })).toHaveAttribute('aria-checked', 'false')
  const oneTap = page.getByRole('switch', { name: /Bir bosishda bajarish/ })
  await expect(oneTap).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('uzoq vaqt dars qiladiganlar', { exact: false })).toBeVisible()
  await oneTap.click()
  await expect(oneTap).toHaveAttribute('aria-checked', 'false')

  await nav.getByRole('button', { name: 'Bugun', exact: true }).click()
  await page.getByRole('button', { name: 'Jarayonda deb belgilash' }).click()
  await expect(page.locator('.task__status--in_progress')).toHaveText('Jarayonda')
  await page.getByRole('button', { name: 'Bajarildi deb belgilash' }).click()
  await expect(page.getByRole('button', { name: 'Bajarilmagan deb belgilash' })).toBeVisible()
  expect(pageErrors).toEqual([])
})
