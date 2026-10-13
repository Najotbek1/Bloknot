import { expect, test } from './fixtures'

test('the Windows app shows a QR code for Wi-Fi sync and ignores a stranger’s request', async ({ page, pageErrors }) => {
  // The Electron preload, faked: one local address, and phone requests handed to the page.
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>
    w.maqsadDesktop = {
      platform: 'win32',
      scheduleNotifications: async () => {},
      notifyNow: async () => {},
      setLabels: async () => {},
      getAutoStart: async () => false,
      setAutoStart: async () => {},
      getCloseToTray: async () => true,
      setCloseToTray: async () => {},
      startSync: async () => ({ hosts: ['192.168.1.5'], port: 47123 }),
      stopSync: async () => {},
      onSyncRequest: (handler: unknown) => {
        w.__syncHandler = handler
        return () => {}
      },
    }
  })
  await page.goto('/')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await page.getByRole('button', { name: 'Telefon bilan sinxronlash' }).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('img', { name: 'Sinxronlash uchun QR kod' })).toBeVisible()
  await expect(sheet.getByRole('status')).toContainText('amal qiladi')

  // A request sealed with some other key is refused, and the code keeps waiting.
  const status = await page.evaluate(async () => {
    const handler = (window as unknown as { __syncHandler: (body: string) => Promise<{ status: number }> }).__syncHandler
    const answer = await handler(JSON.stringify({ v: 1, iv: 'AAAAAAAAAAAAAAAA', data: 'AAAAAAAAAAAAAAAAAAAAAAAA' }))
    return answer.status
  })
  expect(status).toBe(403)
  await expect(sheet.getByRole('status')).toContainText('amal qiladi')
  expect(pageErrors).toEqual([])
})

test('the browser version has no Wi-Fi sync section', async ({ page }) => {
  await page.goto('/')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Ma’lumotlar' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Wi-Fi orqali sinxronlash' })).toHaveCount(0)
})
