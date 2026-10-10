import { describe, expect, it } from 'vitest'
import { buildTask, DEFAULT_SETTINGS } from '../db/tasks'
import type { DayReminder, Reminder, Settings, Task, TaskOccurrence } from '../models/types'
import { MAX_NOTIFICATIONS, planNotifications } from './plan'

let nextId = 1
function task(input: Parameters<typeof buildTask>[0]): Task {
  return { ...buildTask(input), id: `t${nextId++}`, createdAt: 0, updatedAt: 0, deletedAt: null }
}

function occurrence(taskId: string, date: string, status: TaskOccurrence['status']): TaskOccurrence {
  return { id: `o-${taskId}-${date}`, taskId, date, status, completedAt: null, createdAt: 0, updatedAt: 0, deletedAt: null }
}

const quiet: Settings = { ...DEFAULT_SETTINGS, morningSummary: false, eveningSummary: false, deadlineWarnings: false }
const at9 = (daysBefore = 0): Reminder => ({ time: '09:00', daysBefore })
// Wednesday 2026-10-07, 08:00 local time.
const now = new Date(2026, 9, 7, 8, 0)

const summary = (list: ReturnType<typeof planNotifications>) =>
  list.map((n) => `${n.at.getMonth() + 1}/${n.at.getDate()} ${String(n.at.getHours()).padStart(2, '0')}:${String(n.at.getMinutes()).padStart(2, '0')} ${n.kind} ${n.title} | ${n.body}`)

describe('task reminders', () => {
  it('reminds on the day and days before', () => {
    const a = task({ title: 'Imtihon', kind: 'daily', date: '2026-10-10', reminders: [at9(0), at9(2)] })
    expect(summary(planNotifications({ tasks: [a], occurrences: [] }, quiet, now))).toEqual([
      '10/8 09:00 task Imtihon | 2 kundan keyin · 10-oktabr',
      '10/10 09:00 task Imtihon | Bugungi reja',
    ])
  })

  it('carries the task id and day for the "done" button, and numbers ids from 1', () => {
    const a = task({ title: 'A', kind: 'daily', date: '2026-10-07', reminders: [at9()] })
    const [n] = planNotifications({ tasks: [a], occurrences: [] }, quiet, now)
    expect(n).toMatchObject({ id: 1, taskId: a.id, date: '2026-10-07' })
  })

  it('skips times already passed, done tasks and deleted tasks', () => {
    const past = task({ title: 'Past', kind: 'daily', date: '2026-10-07', reminders: [{ time: '07:00', daysBefore: 0 }] })
    const done = task({ title: 'Done', kind: 'daily', date: '2026-10-08', reminders: [at9()], status: 'done' })
    const deleted = { ...task({ title: 'Del', kind: 'daily', date: '2026-10-08', reminders: [at9()] }), deletedAt: 1 }
    expect(planNotifications({ tasks: [past, done, deleted], occurrences: [] }, quiet, now)).toEqual([])
  })

  it('repeats for each occurrence and skips days already done', () => {
    const sport = task({
      title: 'Sport',
      kind: 'daily',
      date: '2026-10-01',
      recurrence: { freq: 'daily', interval: 1 },
      reminders: [{ time: '07:30', daysBefore: 0 }],
    })
    const list = planNotifications(
      { tasks: [sport], occurrences: [occurrence(sport.id, '2026-10-08', 'done')] },
      quiet,
      now,
      4,
    )
    // 10-07 07:30 is in the past, 10-08 is done.
    expect(list.map((n) => n.date)).toEqual(['2026-10-09', '2026-10-10'])
  })

  it('counts weekly from Monday, monthly from the 1st and range from the end date', () => {
    const tasks = [
      task({ title: 'W', kind: 'weekly', weekStart: '2026-10-12', reminders: [at9()] }),
      task({ title: 'M', kind: 'monthly', month: '2026-11', reminders: [at9(1)] }),
      task({ title: 'R', kind: 'range', startDate: '2026-10-01', endDate: '2026-10-20', reminders: [at9(3)] }),
      task({ title: 'G', kind: 'general', reminders: [at9()] }),
    ]
    expect(summary(planNotifications({ tasks, occurrences: [] }, quiet, now, 60))).toEqual([
      '10/12 09:00 task W | Haftalik reja · 12–18-oktabr',
      '10/17 09:00 task R | Muddat tugashiga 3 kun qoldi',
      '10/31 09:00 task M | Oylik reja · Noyabr 2026',
    ])
  })

  it('keeps only the soonest notifications', () => {
    const many = task({
      title: 'Ko‘p',
      kind: 'daily',
      date: '2026-10-08',
      recurrence: { freq: 'daily', interval: 1 },
      reminders: Array.from({ length: 10 }, (_, i) => ({ time: `1${i}:00`, daysBefore: 0 })),
    })
    const list = planNotifications({ tasks: [many], occurrences: [] }, quiet, now, 30)
    expect(list).toHaveLength(MAX_NOTIFICATIONS)
    expect(list.at(-1)!.id).toBe(MAX_NOTIFICATIONS)
    expect(list.every((n, i) => i === 0 || n.at >= list[i - 1].at)).toBe(true)
  })
})

describe('daily summaries', () => {
  const settings: Settings = { ...quiet, morningSummary: true, eveningSummary: true }

  it('lists open tasks in the morning and counts what is left in the evening', () => {
    const tasks = [
      task({ title: 'Ingliz tili', kind: 'daily', date: '2026-10-07' }),
      task({ title: 'Sport', kind: 'daily', date: '2026-10-07', status: 'done' }),
      task({ title: 'Kitob', kind: 'daily', date: '2026-10-07' }),
    ]
    const nowEarly = new Date(2026, 9, 7, 6, 0)
    expect(summary(planNotifications({ tasks, occurrences: [] }, settings, nowEarly, 1))).toEqual([
      '10/7 08:00 morning Bugun 2 ta reja | Ingliz tili, Kitob',
      '10/7 21:00 evening 2 ta reja bajarilmadi | Ingliz tili, Kitob',
    ])
  })

  it('praises a finished day and stays silent on an empty one', () => {
    const tasks = [task({ title: 'A', kind: 'daily', date: '2026-10-07', status: 'done' })]
    expect(summary(planNotifications({ tasks, occurrences: [] }, settings, now, 2))).toEqual([
      '10/7 21:00 evening Barakalla! 🎉 | Bugungi 1 ta reja bajarildi.',
    ])
  })

  it('shortens a long morning list', () => {
    const tasks = Array.from({ length: 6 }, (_, i) => task({ title: `T${i}`, kind: 'daily', date: '2026-10-08' }))
    const [morning] = planNotifications({ tasks, occurrences: [] }, settings, now, 2)
    expect(morning.body).toBe('T0, T1, T2, T3, va yana 2 ta')
  })

  it('follows the times and switches in settings', () => {
    const tasks = [task({ title: 'A', kind: 'daily', date: '2026-10-08' })]
    const custom = { ...settings, morningSummaryTime: '07:15', eveningSummary: false }
    expect(summary(planNotifications({ tasks, occurrences: [] }, custom, now, 2))).toEqual([
      '10/8 07:15 morning Bugun 1 ta reja | A',
    ])
  })
})

describe('deadline warnings', () => {
  it('warns the day before and on the last day at the morning time', () => {
    const settings = { ...quiet, deadlineWarnings: true }
    const tasks = [
      task({ title: 'Kurs ishi', kind: 'range', startDate: '2026-10-01', endDate: '2026-10-09' }),
      task({ title: 'Tugagan', kind: 'range', startDate: '2026-10-01', endDate: '2026-10-09', status: 'done' }),
    ]
    expect(summary(planNotifications({ tasks, occurrences: [] }, settings, now))).toEqual([
      '10/8 08:00 deadline Kurs ishi | Ertaga muddati tugaydi',
      '10/9 08:00 deadline Kurs ishi | Bugun oxirgi kun',
    ])
  })
})

describe('day reminders', () => {
  const reminder = (fields: Partial<DayReminder>): DayReminder => ({
    id: `r${nextId++}`,
    date: '2026-10-07',
    text: 'Dorini ich',
    mode: 'thrice',
    time: null,
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
    ...fields,
  })

  it('rings three times on the day, or once at the chosen time, skipping passed times', () => {
    const late = new Date(2026, 9, 7, 10, 0)
    const dayReminders = [
      reminder({}),
      reminder({ date: '2026-10-08', text: 'Uchrashuv', mode: 'time', time: '18:30' }),
      reminder({ date: '2026-10-08', text: 'O‘chirilgan', deletedAt: 5 }),
    ]
    expect(summary(planNotifications({ tasks: [], occurrences: [], dayReminders }, quiet, late, 3))).toEqual([
      '10/7 14:00 day-reminder 🔔 Eslatma | Dorini ich',
      '10/7 20:00 day-reminder 🔔 Eslatma | Dorini ich',
      '10/8 18:30 day-reminder 🔔 Eslatma | Uchrashuv',
    ])
  })
})

describe('coach tone', () => {
  const settings: Settings = { ...quiet, morningSummary: true, eveningSummary: true }
  const tasks = () => [
    task({ title: 'Ingliz tili', kind: 'daily', date: '2026-10-07', reminders: [at9()] }),
    task({ title: 'Sport', kind: 'daily', date: '2026-10-07' }),
  ]
  const nowEarly = new Date(2026, 9, 7, 6, 0)

  it('adds nothing in the neutral tone', () => {
    const plain = planNotifications({ tasks: tasks(), occurrences: [] }, settings, nowEarly, 1)
    expect(plain.find((n) => n.kind === 'morning')).toMatchObject({ title: 'Bugun 2 ta reja', body: 'Ingliz tili, Sport' })
  })

  it('a strict coach headlines the summaries and adds to task reminders', () => {
    const plan = planNotifications({ tasks: tasks(), occurrences: [] }, settings, nowEarly, 1, 'strict')
    const morning = plan.find((n) => n.kind === 'morning')!
    const evening = plan.find((n) => n.kind === 'evening')!
    const reminder = plan.find((n) => n.kind === 'task')!
    expect(morning.title).not.toBe('Bugun 2 ta reja')
    expect(morning.body).toBe('Bugun 2 ta reja: Ingliz tili, Sport')
    expect(evening.body).toBe('2 ta reja bajarilmadi: Ingliz tili, Sport')
    expect(reminder.body).toMatch(/^Bugungi reja · .+/)
  })

  it('only cheers a finished day', () => {
    const done = [task({ title: 'A', kind: 'daily', date: '2026-10-07', status: 'done' })]
    const strict = planNotifications({ tasks: done, occurrences: [] }, settings, nowEarly, 1, 'strict')
    const cheer = planNotifications({ tasks: done, occurrences: [] }, settings, nowEarly, 1, 'inspiring')
    expect(strict[0].body).toBe('Bugungi 1 ta reja bajarildi.')
    expect(cheer[0].body.startsWith('Bugungi 1 ta reja bajarildi. ')).toBe(true)
  })
})
