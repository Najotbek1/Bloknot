import { expect, test as base } from '@playwright/test'

/**
 * `page` collects uncaught errors in `pageErrors`. In the "new-webview" project scroll methods return
 * a Promise, as in recent Chrome / Android WebView, where the app once went blank on tab switch.
 */
const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: async ({ page }, use, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    if (testInfo.project.metadata.promiseScroll) {
      await page.addInitScript(() => {
        for (const name of ['scrollTo', 'scroll', 'scrollBy'] as const) {
          const original = window[name].bind(window) as (...args: unknown[]) => void
          ;(window as unknown as Record<string, unknown>)[name] = (...args: unknown[]) => {
            original(...args)
            return Promise.resolve()
          }
        }
      })
    }
    await use(errors)
  },
})

const TABS = ['Bugun', 'Reja', 'Bloknot', 'Statistika', 'Sozlamalar']

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

  await page.locator('.bottom-nav').getByRole('button', { name: 'Reja', exact: true }).click()
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
