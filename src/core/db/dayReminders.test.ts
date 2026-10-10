import { describe, expect, it } from 'vitest'
import {
  createDayReminder,
  deleteDayReminder,
  listDayReminders,
  listDayRemindersBetween,
  reminderTimes,
  updateDayReminder,
} from './dayReminders'
import { createTestDb } from './testing'

describe('day reminders', () => {
  it('creates, lists by time, updates and deletes', async () => {
    const db = createTestDb()
    const late = await createDayReminder(db, { date: '2026-10-12', text: ' Dorini ich ', mode: 'time', time: '21:30' })
    const thrice = await createDayReminder(db, { date: '2026-10-12', text: 'Suv ich', mode: 'thrice', time: '08:00' })
    await createDayReminder(db, { date: '2026-10-13', text: 'Ertaga', mode: 'time', time: '07:00' })

    expect(late.text).toBe('Dorini ich')
    expect(thrice.time).toBeNull() // A time only matters for 'time' reminders.
    expect((await listDayReminders(db, '2026-10-12')).map((r) => r.text)).toEqual(['Suv ich', 'Dorini ich'])
    expect(await listDayRemindersBetween(db, '2026-10-12', '2026-10-13')).toHaveLength(3)

    await updateDayReminder(db, late.id, { date: '2026-10-12', text: 'Dori', mode: 'time', time: '06:00' })
    expect((await listDayReminders(db, '2026-10-12')).map((r) => r.text)).toEqual(['Dori', 'Suv ich'])

    await deleteDayReminder(db, thrice.id)
    expect(await listDayReminders(db, '2026-10-12')).toHaveLength(1)
    expect((await db.dayReminders.get(thrice.id))?.deletedAt).not.toBeNull()
  })

  it('rejects an empty text and a time reminder without a time', async () => {
    const db = createTestDb()
    await expect(createDayReminder(db, { date: '2026-10-12', text: '  ', mode: 'thrice' })).rejects.toThrow()
    await expect(createDayReminder(db, { date: '2026-10-12', text: 'A', mode: 'time' })).rejects.toThrow()
  })

  it('rings three times or once', () => {
    expect(reminderTimes({ mode: 'thrice', time: null })).toEqual(['09:00', '14:00', '20:00'])
    expect(reminderTimes({ mode: 'time', time: '18:30' })).toEqual(['18:30'])
  })
})
