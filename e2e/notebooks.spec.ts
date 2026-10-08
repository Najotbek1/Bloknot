import { expect, test } from './fixtures'

const nav = (name: string) => `.bottom-nav >> role=button[name="${name}"]`

test('notebooks: create, write with autosave, search, link to a task, delete', async ({ page, pageErrors }) => {
  await page.goto('/')

  // A task to link to later.
  await page.getByRole('button', { name: 'Reja qo‘shish' }).click()
  await page.getByLabel('Nomi').fill('Imtihonga tayyorlanish')
  await page.getByRole('button', { name: 'Saqlash' }).click()

  // Create a notebook; it opens right away.
  await page.locator(nav('Bloknot')).click()
  await expect(page.getByText('Hali bloknot yo‘q')).toBeVisible()
  await page.getByRole('button', { name: 'Bloknot qo‘shish' }).click()
  await page.getByLabel('Nomi').fill('O‘qish')
  await page.getByRole('radio').nth(3).click()
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.locator('.screen__title')).toHaveText('O‘qish')

  // Write a note; it saves itself.
  await page.getByRole('button', { name: 'Yozuv qo‘shish' }).click()
  await page.getByLabel('Sarlavha').fill('Kitob ro‘yxati')
  await page.getByLabel('Yozishni boshlang…').fill('Birinchi: «O‘tkan kunlar». Keyin matematika darsligi.')
  await expect(page.getByText('Saqlandi')).toBeVisible()

  // Link it to the task.
  await page.getByRole('button', { name: 'Rejaga bog‘lash' }).click()
  await page.getByLabel('Rejalardan qidirish').fill('imtihon')
  await page.getByRole('button', { name: /Imtihonga tayyorlanish/ }).click()
  await expect(page.locator('.link-chip')).toContainText('Imtihonga tayyorlanish')

  // Reload: the note is still there.
  await page.reload()
  await page.locator(nav('Bloknot')).click()
  await expect(page.locator('.notebook-card')).toContainText('1 ta yozuv')

  // Search with a different apostrophe.
  await page.getByLabel('Yozuvlardan qidirish').fill("o'tkan")
  await expect(page.locator('.note-card')).toContainText('Kitob ro‘yxati')
  await expect(page.locator('.note-card')).toContainText('O‘qish bloknotida')
  await page.getByLabel('Yozuvlardan qidirish').fill('')

  // From the task editor, open the linked note.
  await page.locator(nav('Bugun')).click()
  await page.getByText('Imtihonga tayyorlanish').click()
  await page.getByRole('button', { name: 'Kitob ro‘yxati' }).click()
  await expect(page.getByLabel('Sarlavha')).toHaveValue('Kitob ro‘yxati')

  // An empty new note is thrown away on the way out.
  await page.getByRole('button', { name: 'Orqaga' }).click()
  await page.getByRole('button', { name: 'Yozuv qo‘shish' }).click()
  await page.getByRole('button', { name: 'Orqaga' }).click()
  await expect(page.locator('.note-card')).toHaveCount(1)

  // Delete the notebook with its note.
  await page.getByRole('button', { name: 'Bloknotni tahrirlash' }).click()
  await page.getByRole('button', { name: 'Bloknotni o‘chirish' }).click()
  await page.getByRole('button', { name: /1 ta yozuv o‘chiriladi/ }).click()
  await expect(page.getByText('Hali bloknot yo‘q')).toBeVisible()

  expect(pageErrors).toEqual([])
})
