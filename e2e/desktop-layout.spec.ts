import { expect, test } from './fixtures'

// A computer-sized window: the same app with a side menu and two columns.
test.use({ viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false })

const fakeWindowsApp = () => {
  // The main process keeps these between screens, as the real one does.
  const state = { autoStart: false, closeToTray: true }
  ;(window as unknown as Record<string, unknown>).maqsadDesktop = {
    platform: 'win32',
    scheduleNotifications: async () => {},
    notifyNow: async () => {},
    setLabels: async () => {},
    getAutoStart: async () => state.autoStart,
    setAutoStart: async (enabled: boolean) => {
      state.autoStart = enabled
    },
    getCloseToTray: async () => state.closeToTray,
    setCloseToTray: async (enabled: boolean) => {
      state.closeToTray = enabled
    },
    startSync: async () => ({ hosts: ['192.168.1.5'], port: 47123 }),
    stopSync: async () => {},
    onSyncRequest: () => () => {},
  }
}

test('the menu is a full-height side panel and the calendar sits beside the day', async ({ page, pageErrors }) => {
  await page.goto('/')
  const nav = page.locator('.bottom-nav')
  const box = (await nav.boundingBox())!
  expect(box.x).toBe(0)
  expect(box.height).toBe(800)
  expect(box.width).toBeLessThan(300)
  // Settings sits at the bottom of the panel.
  const settings = (await nav.getByRole('button', { name: 'Sozlamalar', exact: true }).boundingBox())!
  expect(settings.y).toBeGreaterThan(650)

  // Ctrl+N opens the new plan as a centred dialog; it is saved and listed.
  await page.keyboard.press('Control+n')
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const dialogBox = (await dialog.boundingBox())!
  expect(Math.abs(dialogBox.x + dialogBox.width / 2 - 640)).toBeLessThan(4)
  await dialog.locator('input').first().fill('Sport')
  await dialog.getByRole('button', { name: 'Saqlash' }).click()
  await expect(page.getByText('Sport')).toBeVisible()

  // Ctrl+2: the calendar, with the selected day's plans to its side.
  await page.keyboard.press('Control+2')
  const calendar = (await page.locator('.calendar').boundingBox())!
  const day = (await page.getByRole('heading', { name: /12-oktabr|oktabr/ }).first().boundingBox())!
  expect(day.x).toBeGreaterThan(calendar.x + calendar.width)
  expect(pageErrors).toEqual([])
})

test('inside a notebook the note list stays beside the open note', async ({ page, pageErrors }) => {
  await page.goto('/')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Bloknot', exact: true }).click()
  await page.locator('.fab').click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input').first().fill('Ish')
  await dialog.getByRole('button').last().click()
  await expect(page.getByText('Chapdan yozuvni tanlang yoki yangisini qo‘shing.')).toBeVisible()

  await page.locator('.fab').click()
  await page.getByLabel('Sarlavha').fill('Uchrashuv')
  await page.locator('.note-editor__body').fill('Soat 10 da')
  // The list shows the note being written and marks it as open.
  await expect(page.locator('.note-card[aria-current="true"]')).toContainText('Uchrashuv')
  expect(pageErrors).toEqual([])
})

test('the Windows app has no alarm button, and Arabic puts the menu on the right', async ({ page }) => {
  await page.addInitScript(fakeWindowsApp)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Bugun' })).toBeVisible()
  await expect(page.locator('.next-alarm')).toHaveCount(0)

  await page.keyboard.press('Control+5')
  await page.getByLabel('Til').selectOption('ar')
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect
    .poll(async () => {
      const box = await page.locator('.bottom-nav').boundingBox()
      return box && box.x + box.width
    })
    .toBe(1280)
})

test('Windows settings speak of the computer and remember their switches', async ({ page, pageErrors }) => {
  await page.addInitScript(fakeWindowsApp)
  await page.goto('/')
  const nav = page.locator('.bottom-nav')
  await nav.getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await expect(page.getByLabel('Til').locator('option[value="auto"]')).toHaveText('Kompyuter tili')
  await expect(page.getByRole('radio', { name: 'Kompyuter bo‘yicha' })).toBeVisible()

  const autoStart = page.getByRole('switch', { name: /Windows bilan birga ochilish/ })
  const tray = page.getByRole('switch', { name: /Yopganda tepsida qolsin/ })
  await expect(tray).toHaveAttribute('aria-checked', 'true')
  await autoStart.click()
  await tray.click()
  await expect(page.getByText('Oynani yopsangiz, Maqsad to‘liq yopiladi', { exact: false })).toBeVisible()

  // Away and back: both switches still show what was chosen.
  await nav.getByRole('button', { name: 'Bugun', exact: true }).click()
  await nav.getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await expect(autoStart).toHaveAttribute('aria-checked', 'true')
  await expect(tray).toHaveAttribute('aria-checked', 'false')
  expect(pageErrors).toEqual([])
})

test('on a Mac the computer settings speak of the Mac and its menu bar', async ({ page, pageErrors }) => {
  await page.addInitScript(fakeWindowsApp)
  await page.addInitScript(() => {
    ;(window as unknown as { maqsadDesktop: { platform: string } }).maqsadDesktop.platform = 'darwin'
  })
  await page.goto('/')
  await page.locator('.bottom-nav').getByRole('button', { name: 'Sozlamalar', exact: true }).click()
  await expect(page.getByRole('switch', { name: /Mac bilan birga ochilish/ })).toBeVisible()
  await expect(page.getByText('menyu satrida', { exact: false })).toBeVisible()
  await expect(page.getByText('Windows', { exact: false })).toHaveCount(0)
  expect(pageErrors).toEqual([])
})
