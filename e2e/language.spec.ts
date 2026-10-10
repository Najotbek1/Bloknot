import { expect, test } from './fixtures'

test('the language follows the setting, and Arabic turns the layout right-to-left', async ({ page, pageErrors }) => {
  await page.goto('/')
  const nav = page.locator('.bottom-nav')
  await nav.getByRole('button', { name: 'Sozlamalar', exact: true }).click()

  await page.getByLabel('Til').selectOption('en')
  await expect(nav.getByRole('button', { name: 'Settings', exact: true })).toBeVisible()
  await nav.getByRole('button', { name: 'Today', exact: true }).click()
  await expect(page.locator('.screen__title')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await nav.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.locator('select').first().selectOption('ar')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')

  // Back to the phone's language (Uzbek in these tests); the choice survives a reload.
  await page.locator('select').first().selectOption('auto')
  await expect(nav.getByRole('button', { name: 'Sozlamalar', exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await page.locator('select').first().selectOption('ru')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru')
  expect(pageErrors).toEqual([])
})

test('Settings shows the contact email and the privacy policy', async ({ page, pageErrors }) => {
  await page.goto('/')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await expect(page.getByRole('link', { name: /Biz bilan bog‘lanish/ })).toHaveAttribute(
    'href',
    'mailto:contact.najotbek@gmail.com',
  )
  await expect(page.getByRole('link', { name: /Maxfiylik siyosati/ })).toHaveAttribute(
    'href',
    'https://najotbek1.github.io/Bloknot/privacy.html',
  )
  expect(pageErrors).toEqual([])
})
