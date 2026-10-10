import { expect, test } from './fixtures'

test('alarms: add, edit, and a test ring stops only after the text is typed', async ({ page, pageErrors }) => {
  await page.clock.install()
  await page.goto('/')

  await page.getByRole('button', { name: 'Uyg‘otgichlar' }).click()
  await expect(page.locator('.screen__title')).toHaveText('Uyg‘otgich')
  await expect(page.getByText('faqat telefondagi ilovada ishlaydi')).toBeVisible()

  // Add a workday alarm.
  await page.getByRole('button', { name: 'Uyg‘otgich qo‘shish' }).click()
  await page.getByLabel('Vaqt').fill('06:30')
  for (const day of ['Du', 'Se', 'Ch', 'Pa', 'Ju']) await page.getByRole('button', { name: day, exact: true }).click()
  await page.getByLabel('Nomi (ixtiyoriy)').fill('Ish kuni')
  await page.getByRole('button', { name: 'O‘rta' }).click()
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.locator('.alarm-row')).toContainText('06:30')
  await expect(page.locator('.alarm-row')).toContainText('Ish kunlari · Ish kuni')

  // Switch it off and on.
  const toggle = page.getByRole('switch', { name: '06:30 uyg‘otgichi' })
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-checked', 'true')

  // Back to Today: the next alarm is shown on the button.
  await page.getByRole('button', { name: 'Orqaga' }).click()
  await expect(page.getByRole('button', { name: 'Uyg‘otgichlar' })).toContainText('06:30')

  // A test ring covers the app; a wrong text does not stop it, the right one does.
  await page.getByRole('button', { name: 'Uyg‘otgichlar' }).click()
  await page.getByRole('button', { name: /Sinab ko‘rish/ }).click()
  await page.clock.runFor(11_000)
  const ringing = page.getByRole('alertdialog')
  await expect(ringing).toBeVisible()
  const target = (await page.getByTestId('alarm-target').textContent()) ?? ''
  const input = page.getByLabel('Matnni shu yerga yozing')
  await input.fill('noto‘g‘ri matn')
  await expect(ringing).toBeVisible()
  // Typed without the special apostrophe and in lower case: still accepted.
  await input.fill(target.toLowerCase().replace(/[‘’]/g, "'"))
  await expect(ringing).toBeHidden()
  await expect(page.getByText('Xayrli tong!')).toBeVisible()
  expect(pageErrors).toEqual([])
})
