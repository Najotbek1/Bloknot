import { describe, expect, it } from 'vitest'
import {
  buildTask,
  createTask,
  getOccurrence,
  getSettings,
  setOccurrenceStatus,
  setTaskStatus,
  updateSettings,
} from './tasks'
import { createTestDb } from './testing'

describe('buildTask', () => {
  it('fills defaults and trims the title', () => {
    const task = buildTask({ title: '  Kitob o‘qish ', kind: 'general' })
    expect(task).toMatchObject({ title: 'Kitob o‘qish', status: 'todo', priority: 'normal', reminders: [] })
  })

  it('requires the dates of its kind', () => {
    expect(() => buildTask({ title: 'A', kind: 'daily' })).toThrow()
    expect(() => buildTask({ title: 'A', kind: 'weekly' })).toThrow()
    expect(() => buildTask({ title: 'A', kind: 'monthly' })).toThrow()
    expect(() => buildTask({ title: 'A', kind: 'range', startDate: '2026-10-01' })).toThrow()
    expect(() =>
      buildTask({ title: 'A', kind: 'range', startDate: '2026-10-10', endDate: '2026-10-01' }),
    ).toThrow()
  })

  it('rejects an empty title', () => {
    expect(() => buildTask({ title: '   ', kind: 'general' })).toThrow()
  })

  it('normalizes the week to Monday and the month to YYYY-MM', () => {
    expect(buildTask({ title: 'A', kind: 'weekly', weekStart: '2026-10-08' }).weekStart).toBe('2026-10-05')
    expect(buildTask({ title: 'A', kind: 'monthly', month: '2026-10-15' }).month).toBe('2026-10')
    expect(buildTask({ title: 'A', kind: 'monthly', month: '2026-10' }).month).toBe('2026-10')
  })

  it('allows repeating only for daily tasks', () => {
    const recurrence = { freq: 'daily', interval: 1 } as const
    expect(() => buildTask({ title: 'A', kind: 'daily', date: '2026-10-05', recurrence })).not.toThrow()
    expect(() => buildTask({ title: 'A', kind: 'weekly', weekStart: '2026-10-05', recurrence })).toThrow()
  })
})

describe('setTaskStatus', () => {
  it('sets completedAt when done and clears it when reopened', async () => {
    const db = createTestDb()
    const task = await createTask(db, { title: 'A', kind: 'general' }, 1000)

    const done = await setTaskStatus(db, task.id, 'done', 2000)
    expect(done).toMatchObject({ status: 'done', completedAt: 2000 })

    const again = await setTaskStatus(db, task.id, 'done', 3000)
    expect(again.completedAt).toBe(2000)

    const reopened = await setTaskStatus(db, task.id, 'todo', 4000)
    expect(reopened).toMatchObject({ status: 'todo', completedAt: null })
  })

  it('refuses recurring tasks', async () => {
    const db = createTestDb()
    const task = await createTask(db, {
      title: 'Sport',
      kind: 'daily',
      date: '2026-10-05',
      recurrence: { freq: 'daily', interval: 1 },
    })
    await expect(setTaskStatus(db, task.id, 'done')).rejects.toThrow()
  })
})

describe('setOccurrenceStatus', () => {
  it('creates and then updates the status of one day', async () => {
    const db = createTestDb()
    const task = await createTask(db, {
      title: 'Sport',
      kind: 'daily',
      date: '2026-10-05',
      recurrence: { freq: 'daily', interval: 1 },
    })

    const first = await setOccurrenceStatus(db, task.id, '2026-10-06', 'done', 2000)
    expect(first).toMatchObject({ taskId: task.id, date: '2026-10-06', status: 'done', completedAt: 2000 })

    const second = await setOccurrenceStatus(db, task.id, '2026-10-06', 'skipped', 3000)
    expect(second.id).toBe(first.id)
    expect(second).toMatchObject({ status: 'skipped', completedAt: null })

    expect(await db.occurrences.count()).toBe(1)
    expect(await getOccurrence(db, task.id, '2026-10-07')).toBeUndefined()
  })

  it('refuses days the task does not occur on', async () => {
    const db = createTestDb()
    const task = await createTask(db, {
      title: 'Hisobot',
      kind: 'daily',
      date: '2026-10-05',
      recurrence: { freq: 'weekly', interval: 1, weekdays: [1] },
    })
    await expect(setOccurrenceStatus(db, task.id, '2026-10-06', 'done')).rejects.toThrow()
  })
})

describe('settings', () => {
  it('returns defaults until changed, then keeps changes', async () => {
    const db = createTestDb()
    expect(await getSettings(db)).toMatchObject({ theme: 'system', morningSummaryTime: '08:00' })

    await updateSettings(db, { theme: 'dark' }, 1000)
    await updateSettings(db, { eveningSummaryTime: '22:00' }, 2000)
    expect(await getSettings(db)).toMatchObject({
      theme: 'dark',
      eveningSummaryTime: '22:00',
      createdAt: 1000,
      updatedAt: 2000,
    })
  })
})
