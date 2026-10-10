import { addDays, weekStartOf } from './dates'
import type { BloknotDB } from './db/schema'
import type { DateKey, DayReminder, MonthKey, Task, TaskOccurrence } from './models/types'
import { buildDayAgenda } from './queries'

/** The 42 days (6 weeks, Monday first) shown for `month`, including the edges of the months around it. */
export function monthGrid(month: MonthKey): DateKey[] {
  const first = weekStartOf(`${month}-01`)
  return Array.from({ length: 42 }, (_, index) => addDays(first, index))
}

/** What a calendar cell shows about its day. Skipped items are not counted. */
export interface DaySummary {
  date: DateKey
  total: number
  done: number
  /** A range task (start–end) covers this day. */
  inRange: boolean
  /** Day reminders pinned to this day. */
  reminders: number
}

/** Summaries for `days`, from daily, recurring and range tasks. Pure. */
export function daySummaries(
  tasks: Task[],
  occurrences: TaskOccurrence[],
  days: DateKey[],
  dayReminders: DayReminder[] = [],
): Map<DateKey, DaySummary> {
  const reminderCounts = new Map<DateKey, number>()
  for (const reminder of dayReminders) {
    if (reminder.deletedAt === null) reminderCounts.set(reminder.date, (reminderCounts.get(reminder.date) ?? 0) + 1)
  }
  const result = new Map<DateKey, DaySummary>()
  for (const date of days) {
    const items = buildDayAgenda(tasks, occurrences, date).filter((item) => item.status !== 'skipped')
    result.set(date, {
      date,
      total: items.length,
      done: items.filter((item) => item.status === 'done').length,
      inRange: items.some((item) => item.task.kind === 'range'),
      reminders: reminderCounts.get(date) ?? 0,
    })
  }
  return result
}

/** Loads what `daySummaries` needs for one month's grid. */
export async function getMonthSummaries(db: BloknotDB, month: MonthKey): Promise<Map<DateKey, DaySummary>> {
  const days = monthGrid(month)
  const [tasks, occurrences, dayReminders] = await Promise.all([
    db.tasks
      .where('kind')
      .anyOf(['daily', 'range'])
      .filter((task) => task.deletedAt === null)
      .toArray(),
    db.occurrences.where('date').between(days[0], days[days.length - 1], true, true).toArray(),
    db.dayReminders.where('date').between(days[0], days[days.length - 1], true, true).toArray(),
  ])
  return daySummaries(tasks, occurrences, days, dayReminders)
}

/** Whether `date` belongs to `month` (cells of neighbouring months are drawn dimmed). */
export function isInMonth(date: DateKey, month: MonthKey): boolean {
  return date.startsWith(`${month}-`)
}
