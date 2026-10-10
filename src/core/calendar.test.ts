import { describe, expect, it } from 'vitest'
import { daySummaries, getMonthSummaries, isInMonth, monthGrid } from './calendar'
import { createDayReminder } from './db/dayReminders'
import { buildTask, createTask, setOccurrenceStatus, setTaskStatus } from './db/tasks'
import { createTestDb } from './db/testing'
import type { Task } from './models/types'

function task(fields: Partial<Task> & Pick<Task, 'kind'>): Task {
  return {
    ...buildTask({ title: 'A', ...fields }),
    id: fields.id ?? crypto.randomUUID(),
    createdAt: 1,
    updatedAt: 1,
    deletedAt: null,
    ...fields,
  } as Task
}

describe('monthGrid', () => {
  it('starts on the Monday on or before the 1st and has six weeks', () => {
    const grid = monthGrid('2026-10') // 1 October 2026 is a Thursday
    expect(grid).toHaveLength(42)
    expect(grid[0]).toBe('2026-09-28')
    expect(grid[3]).toBe('2026-10-01')
    expect(grid[41]).toBe('2026-11-08')
  })

  it('starts on the 1st when the month begins on a Monday', () => {
    expect(monthGrid('2026-06')[0]).toBe('2026-06-01')
  })
})

describe('isInMonth', () => {
  it('matches only days of that month', () => {
    expect(isInMonth('2026-10-31', '2026-10')).toBe(true)
    expect(isInMonth('2026-11-01', '2026-10')).toBe(false)
  })
})

describe('daySummaries', () => {
  it('counts daily, recurring and range items, ignoring skipped ones', () => {
    const tasks = [
      task({ kind: 'daily', date: '2026-10-05', status: 'done' }),
      task({ kind: 'daily', date: '2026-10-05', status: 'skipped' }),
      task({ id: 'r', kind: 'daily', date: '2026-10-01', recurrence: { freq: 'daily', interval: 1 } }),
      task({ kind: 'range', startDate: '2026-10-04', endDate: '2026-10-06' }),
    ]
    const occurrences = [
      { id: 'o', taskId: 'r', date: '2026-10-05', status: 'done', completedAt: 1, createdAt: 1, updatedAt: 1, deletedAt: null },
    ] as const
    const result = daySummaries(tasks, [...occurrences], ['2026-10-03', '2026-10-05', '2026-10-07'])
    expect(result.get('2026-10-03')).toEqual({ date: '2026-10-03', total: 1, done: 0, inRange: false, reminders: 0 })
    expect(result.get('2026-10-05')).toEqual({ date: '2026-10-05', total: 3, done: 2, inRange: true, reminders: 0 })
    expect(result.get('2026-10-07')).toMatchObject({ total: 1, inRange: false })
  })
})

describe('getMonthSummaries', () => {
  it('reads tasks and occurrences from the database', async () => {
    const db = createTestDb()
    const done = await createTask(db, { title: 'Yugurish', kind: 'daily', date: '2026-10-09' })
    await setTaskStatus(db, done.id, 'done')
    const repeat = await createTask(db, {
      title: 'Kitob',
      kind: 'daily',
      date: '2026-10-01',
      recurrence: { freq: 'weekly', interval: 1, weekdays: [5] },
    })
    await setOccurrenceStatus(db, repeat.id, '2026-10-09', 'done')
    await createTask(db, { title: 'Eski', kind: 'weekly', weekStart: '2026-10-05' })
    await createDayReminder(db, { date: '2026-10-20', text: 'Dori', mode: 'thrice' })

    const summaries = await getMonthSummaries(db, '2026-10')
    expect(summaries.size).toBe(42)
    expect(summaries.get('2026-10-09')).toMatchObject({ total: 2, done: 2 })
    expect(summaries.get('2026-10-16')).toMatchObject({ total: 1, done: 0 })
    expect(summaries.get('2026-10-10')).toMatchObject({ total: 0 })
    expect(summaries.get('2026-10-20')).toMatchObject({ total: 0, reminders: 1 })
  })
})
