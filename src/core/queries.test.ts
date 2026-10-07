import { describe, expect, it } from 'vitest'
import { softDelete } from './db/repository'
import { createTask, setOccurrenceStatus } from './db/tasks'
import { createTestDb } from './db/testing'
import { getDayAgenda, getGeneralTasks, getMonthTasks, getRangeTasks, getWeekTasks } from './queries'

describe('getDayAgenda', () => {
  it('collects daily, recurring and range tasks for the day', async () => {
    const db = createTestDb()
    await createTask(db, { title: 'Bugungi', kind: 'daily', date: '2026-10-07', order: 1 })
    await createTask(db, { title: 'Ertangi', kind: 'daily', date: '2026-10-08' })
    const sport = await createTask(db, {
      title: 'Sport',
      kind: 'daily',
      date: '2026-10-01',
      recurrence: { freq: 'daily', interval: 1 },
      order: 0,
    })
    await createTask(db, {
      title: 'Faqat dushanba',
      kind: 'daily',
      date: '2026-10-05',
      recurrence: { freq: 'weekly', interval: 1, weekdays: [1] },
    })
    await createTask(db, { title: 'Loyiha', kind: 'range', startDate: '2026-10-01', endDate: '2026-10-31' })
    await createTask(db, { title: 'O‘tgan', kind: 'range', startDate: '2026-09-01', endDate: '2026-09-30' })
    await createTask(db, { title: 'Haftalik', kind: 'weekly', weekStart: '2026-10-05' })
    await setOccurrenceStatus(db, sport.id, '2026-10-07', 'done', 5000)

    const agenda = await getDayAgenda(db, '2026-10-07') // Wednesday
    expect(agenda.map((item) => item.task.title)).toEqual(['Sport', 'Loyiha', 'Bugungi'])
    expect(agenda[0]).toMatchObject({ recurring: true, status: 'done', completedAt: 5000 })

    const nextDay = await getDayAgenda(db, '2026-10-08')
    expect(nextDay.find((item) => item.task.title === 'Sport')).toMatchObject({ status: 'todo' })
  })

  it('hides deleted tasks', async () => {
    const db = createTestDb()
    const task = await createTask(db, { title: 'A', kind: 'daily', date: '2026-10-07' })
    await softDelete(db.tasks, task.id)
    expect(await getDayAgenda(db, '2026-10-07')).toEqual([])
  })
})

describe('list queries', () => {
  it('filters by week, month, range and general', async () => {
    const db = createTestDb()
    await createTask(db, { title: 'Bu hafta', kind: 'weekly', weekStart: '2026-10-05' })
    await createTask(db, { title: 'Keyingi hafta', kind: 'weekly', weekStart: '2026-10-12' })
    await createTask(db, { title: 'Oktabr', kind: 'monthly', month: '2026-10' })
    await createTask(db, { title: 'Noyabr', kind: 'monthly', month: '2026-11' })
    await createTask(db, { title: 'Kech', kind: 'range', startDate: '2026-11-01', endDate: '2026-11-30' })
    await createTask(db, { title: 'Erta', kind: 'range', startDate: '2026-10-01', endDate: '2026-12-31' })
    await createTask(db, { title: 'Umumiy', kind: 'general' })

    const titles = (tasks: { title: string }[]) => tasks.map((task) => task.title)
    expect(titles(await getWeekTasks(db, '2026-10-09'))).toEqual(['Bu hafta'])
    expect(titles(await getMonthTasks(db, '2026-10'))).toEqual(['Oktabr'])
    expect(titles(await getRangeTasks(db))).toEqual(['Erta', 'Kech'])
    expect(titles(await getGeneralTasks(db))).toEqual(['Umumiy'])
  })
})
