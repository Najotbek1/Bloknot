import { expect, test } from './fixtures'

test('statistics show the score, tiles, charts and table', async ({ page, pageErrors }) => {
  await page.goto('/')
  const nav = (name: string) => page.locator('.bottom-nav').getByRole('button', { name, exact: true })

  await nav('Statistika').click()
  await expect(page.getByText('Bu davrda reja yo‘q edi')).toBeVisible()
  await expect(page.locator('.score__value')).toHaveText('—')

  // Two tasks for today, one done.
  await nav('Bugun').click()
  for (const title of ['Birinchi', 'Ikkinchi']) {
    await page.getByRole('button', { name: 'Reja qo‘shish' }).click()
    await page.getByLabel('Nomi').fill(title)
    await page.getByRole('button', { name: 'Saqlash' }).click()
    await expect(page.locator('.task__title', { hasText: title })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Bajarildi deb belgilash' }).first().click()
  await expect(page.getByText('1 / 2 bajarildi')).toBeVisible()

  await nav('Statistika').click()
  // 100 × (0.5 × 1/2 + 0.3 × 1 + 0.2 × 1/7) = 58.
  await expect(page.locator('.score__value')).toHaveText('58')
  await expect(page.locator('.stat-tile', { hasText: 'Bajarildi' })).toContainText('50%')
  await expect(page.locator('.stat-tile', { hasText: 'Muddatida' })).toContainText('100%')
  await expect(page.locator('.stat-tile', { hasText: 'Ketma-ket' })).toContainText('1 kun')

  // Tap today's column and the latest calendar cell.
  await page.locator('.chart-hit').last().click()
  await expect(page.locator('.chart-detail').first()).toContainText('1 / 2 bajarildi')
  await page.locator('button.heatmap__cell:not([disabled])').last().click()
  await expect(page.locator('.chart-detail').last()).toContainText('1 ta bajarildi')

  await page.getByRole('button', { name: '30 kun' }).click()
  await expect(page.locator('.chart-hit')).toHaveCount(30)

  await page.getByRole('button', { name: 'Jadval ko‘rinishi' }).click()
  await expect(page.locator('.stats-table tbody tr')).toHaveCount(30)

  expect(pageErrors).toEqual([])
})
