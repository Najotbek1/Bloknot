import { expect, test } from './fixtures'

test('a focus timer counts down, pauses, hides into a pill and marks the plan done', async ({ page, pageErrors }) => {
  await page.clock.install({ time: new Date('2026-10-13T09:00:00') })
  await page.goto('/')

  await page.locator('.fab').click()
  const dialog = page.getByRole('dialog')
  await dialog.locator('input').first().fill('Sport')
  await dialog.getByRole('button', { name: 'Saqlash' }).click()
  await expect(dialog).toBeHidden()

  // From the plan's editor.
  await page.getByRole('button', { name: 'Sport', exact: true }).click()
  await page.getByRole('button', { name: 'Fokus taymer' }).click()
  const focus = page.getByRole('dialog', { name: 'Fokus' })
  await expect(focus.getByRole('heading', { name: 'Sport' })).toBeVisible()
  await focus.getByRole('button', { name: '25 daq' }).click()
  await focus.getByRole('button', { name: 'Boshlash' }).click()
  const timer = focus.getByRole('timer')
  await expect(timer).toHaveText('25:00')

  await page.clock.runFor(60_000)
  await expect(timer).toHaveText('24:00')

  // Paused time does not count.
  await focus.getByRole('button', { name: 'Pauza' }).click()
  await page.clock.runFor(5 * 60_000)
  await expect(timer).toHaveText('24:00')
  await expect(focus.getByText('Pauzada')).toBeVisible()
  await focus.getByRole('button', { name: 'Davom etish' }).click()

  // Closed, it keeps running as a pill that brings it back.
  await focus.getByRole('button', { name: 'Yopish' }).click()
  const pill = page.getByRole('button', { name: /Fokus: .* · Sport/ })
  await expect(pill).toBeVisible()
  await page.clock.runFor(24 * 60_000)
  await pill.click()

  await expect(focus.getByText('Barakalla! Fokus tugadi')).toBeVisible()
  await focus.getByRole('button', { name: 'Rejani bajarildi deb belgilash' }).click()
  await expect(focus).toBeHidden()
  await expect(page.getByRole('button', { name: 'Bajarilmagan deb belgilash' })).toBeVisible()
  await expect(pill).toBeHidden()
  expect(pageErrors).toEqual([])
})
