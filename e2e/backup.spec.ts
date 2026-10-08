import { readFile } from 'node:fs/promises'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

const nav = (page: Page, name: string) => page.locator('.bottom-nav').getByRole('button', { name, exact: true })

async function addTask(page: Page, title: string) {
  await nav(page, 'Bugun').click()
  await page.getByRole('button', { name: 'Reja qo‘shish' }).click()
  await page.getByLabel('Nomi').fill(title)
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.locator('.task__title', { hasText: title })).toBeVisible()
}

async function importFile(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await nav(page, 'Sozlamalar').click()
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Import qilish' }).click()
  await (await chooser).setFiles(file)
}

test('export on one device, merge on another, re-import changes nothing', async ({ page, browser, pageErrors }, testInfo) => {
  // Device A ("phone"): a task, a notebook and a note.
  await page.goto('/')
  await addTask(page, 'Telefondagi reja')
  await nav(page, 'Bloknot').click()
  await page.getByRole('button', { name: 'Bloknot qo‘shish' }).click()
  await page.getByLabel('Nomi').fill('Ish')
  await page.getByRole('button', { name: 'Saqlash' }).click()
  await page.getByRole('button', { name: 'Yozuv qo‘shish' }).click()
  await page.getByLabel('Sarlavha').fill('Muhim yozuv')
  await expect(page.getByText('Saqlandi')).toBeVisible()
  await page.getByRole('button', { name: 'Orqaga' }).click()

  await nav(page, 'Sozlamalar').click()
  await expect(page.getByText('Hali eksport qilinmagan')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Eksport qilish' }).click()
  const file = await download
  expect(file.suggestedFilename()).toMatch(/^bloknot-\d{4}-\d{2}-\d{2}\.bloknot$/)
  const buffer = await readFile(await file.path())
  expect(JSON.parse(buffer.toString()).format).toBe('bloknot')
  await expect(page.getByText(/Oxirgi eksport: bugun/)).toBeVisible()

  // Device B ("computer"): its own task, then the phone's file.
  const other = await browser.newContext({ ...testInfo.project.use })
  const pc = await other.newPage()
  const pcErrors: string[] = []
  pc.on('pageerror', (error) => pcErrors.push(error.message))
  await pc.goto('/')
  await addTask(pc, 'Kompyuterdagi reja')

  const backup = { name: file.suggestedFilename(), mimeType: 'application/octet-stream', buffer }
  await importFile(pc, backup)
  await expect(pc.getByText('Faylda: 1 ta reja, 1 ta bloknot, 1 ta yozuv')).toBeVisible()
  await pc.getByRole('button', { name: 'Birlashtirish' }).click()
  await expect(pc.getByText(/Qo‘shildi: 3/)).toBeVisible()
  await pc.getByRole('button', { name: 'Yopish' }).last().click()

  await nav(pc, 'Bugun').click()
  await expect(pc.locator('.task__title', { hasText: 'Telefondagi reja' })).toBeVisible()
  await expect(pc.locator('.task__title', { hasText: 'Kompyuterdagi reja' })).toBeVisible()
  await nav(pc, 'Bloknot').click()
  await expect(pc.locator('.notebook-card')).toContainText('1 ta yozuv')

  // The same file again: nothing new.
  await importFile(pc, backup)
  await pc.getByRole('button', { name: 'Birlashtirish' }).click()
  await expect(pc.getByText(/Qo‘shildi: 0 · Yangilandi: 0 · O‘chirildi: 0 · O‘zgarmadi: 3/)).toBeVisible()
  await pc.getByRole('button', { name: 'Yopish' }).last().click()

  // Not a Maqsad backup file.
  await importFile(pc, { name: 'rasm.txt', mimeType: 'text/plain', buffer: Buffer.from('salom') })
  await expect(pc.getByText('Bu fayl Maqsad ilovasining fayli emas yoki buzilgan.')).toBeVisible()

  await other.close()
  expect(pageErrors).toEqual([])
  expect(pcErrors).toEqual([])
})
