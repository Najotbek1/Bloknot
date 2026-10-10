import { addDays, parseDateKey, toDateKey } from '../dates'
import { coachPhrase, type CoachTone } from '../coach'
import { reminderTimes } from '../db/dayReminders'
import type { DateKey, DayReminder, Settings, Task, TaskOccurrence, TimeOfDay } from '../models/types'
import { buildDayAgenda } from '../queries'
import { occurrencesBetween } from '../recurrence'
import { t } from '../../i18n'
import { formatDayShort, formatMonth, formatWeek } from '../../i18n/format'

export type NotificationKind = 'task' | 'morning' | 'evening' | 'deadline' | 'day-reminder'

export interface PlannedNotification {
  /** 1-based position in the plan; the whole plan is rescheduled each time, so ids never clash. */
  id: number
  at: Date
  kind: NotificationKind
  title: string
  body: string
  /** Set for notifications about one task, so its "Bajarildi" button can complete it. */
  taskId?: string
  /** The day of the task the notification is about (for recurring tasks, that day's occurrence). */
  date?: DateKey
}

export interface NotificationSnapshot {
  tasks: Task[]
  occurrences: TaskOccurrence[]
  dayReminders?: DayReminder[]
}

/** Android can hold a few hundred alarms per app; stay well below that. */
export const MAX_NOTIFICATIONS = 200
const MORNING_LIST_LENGTH = 4

function at(date: DateKey, time: TimeOfDay): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const result = parseDateKey(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

function isOpen(status: Task['status']): boolean {
  return status === 'todo' || status === 'in_progress'
}

/** The days a task's reminders count back from, with that day's status. */
function reminderBases(
  task: Task,
  occurrences: TaskOccurrence[],
  from: DateKey,
  to: DateKey,
): { date: DateKey; open: boolean }[] {
  switch (task.kind) {
    case 'daily':
      if (!task.date) return []
      if (!task.recurrence) return [{ date: task.date, open: isOpen(task.status) }]
      return occurrencesBetween(task.recurrence, task.date, from, to).map((date) => {
        const occurrence = occurrences.find(
          (o) => o.taskId === task.id && o.date === date && o.deletedAt === null,
        )
        return { date, open: isOpen(occurrence?.status ?? 'todo') }
      })
    case 'weekly':
      return task.weekStart ? [{ date: task.weekStart, open: isOpen(task.status) }] : []
    case 'monthly':
      return task.month ? [{ date: `${task.month}-01`, open: isOpen(task.status) }] : []
    case 'range':
      return task.endDate ? [{ date: task.endDate, open: isOpen(task.status) }] : []
    case 'general':
      return []
  }
}

function taskBody(task: Task, base: DateKey, daysBefore: number): string {
  switch (task.kind) {
    case 'weekly':
      return t('notify.task.weekly', { when: formatWeek(base) })
    case 'monthly':
      return t('notify.task.monthly', { when: formatMonth(base.slice(0, 7)) })
    case 'range':
      return daysBefore === 0
        ? t('notify.task.rangeToday')
        : t('notify.task.rangeInDays', { days: daysBefore })
    default:
      return daysBefore === 0
        ? t('notify.task.today')
        : t('notify.task.inDays', { days: daysBefore, when: formatDayShort(base) })
  }
}

/**
 * Every notification to show in the next `days` days, soonest first, built from the current data.
 * Called again after every change, so content such as "3 tasks left" is always up to date.
 */
export function planNotifications(
  snapshot: NotificationSnapshot,
  settings: Settings,
  now: Date,
  days = 30,
  /** Wording of summaries and task reminders (src/core/coach.ts); 'normal' adds nothing. */
  tone: CoachTone = 'normal',
): PlannedNotification[] {
  const tasks = snapshot.tasks.filter((task) => task.deletedAt === null)
  const today = toDateKey(now)
  const last = addDays(today, days - 1)
  const planned: Omit<PlannedNotification, 'id'>[] = []
  const add = (item: Omit<PlannedNotification, 'id'>) => {
    if (item.at > now && toDateKey(item.at) <= last) planned.push(item)
  }

  // 1. Each task's own reminders.
  for (const task of tasks) {
    if (task.reminders.length === 0) continue
    const longestLead = Math.max(...task.reminders.map((reminder) => reminder.daysBefore))
    for (const base of reminderBases(task, snapshot.occurrences, today, addDays(last, longestLead))) {
      if (!base.open) continue
      for (const reminder of task.reminders) {
        const day = addDays(base.date, -reminder.daysBefore)
        const phrase = coachPhrase(tone, day, 2)
        const body = taskBody(task, base.date, reminder.daysBefore)
        add({
          at: at(day, reminder.time),
          kind: 'task',
          title: task.title,
          body: phrase ? `${body} · ${phrase}` : body,
          taskId: task.id,
          date: base.date,
        })
      }
    }
  }

  // 2–4. Daily summaries and deadline warnings.
  for (let day = today; day <= last; day = addDays(day, 1)) {
    const agenda = buildDayAgenda(tasks, snapshot.occurrences, day).filter((item) => item.status !== 'skipped')
    const open = agenda.filter((item) => isOpen(item.status))

    if (settings.morningSummary && open.length > 0) {
      const names = open.slice(0, MORNING_LIST_LENGTH).map((item) => item.task.title)
      if (open.length > MORNING_LIST_LENGTH) {
        names.push(t('notify.morning.more', { count: open.length - MORNING_LIST_LENGTH }))
      }
      const title = t('notify.morning.title', { count: open.length })
      const phrase = coachPhrase(tone, day, 0)
      add({
        at: at(day, settings.morningSummaryTime),
        kind: 'morning',
        // With a coach phrase, it becomes the headline and the count moves into the text.
        title: phrase ?? title,
        body: phrase ? `${title}: ${names.join(', ')}` : names.join(', '),
      })
    }

    if (settings.eveningSummary && agenda.length > 0) {
      const phrase = coachPhrase(tone, day, 1)
      if (open.length > 0) {
        const title = t('notify.evening.leftTitle', { count: open.length })
        const names = open.map((item) => item.task.title).join(', ')
        add({
          at: at(day, settings.eveningSummaryTime),
          kind: 'evening',
          title: phrase ?? title,
          body: phrase ? `${title}: ${names}` : names,
        })
      } else {
        // Everything done: only the cheering coach has something to add.
        const body = t('notify.evening.doneBody', { count: agenda.length })
        add({
          at: at(day, settings.eveningSummaryTime),
          kind: 'evening',
          title: t('notify.evening.doneTitle'),
          body: tone === 'inspiring' && phrase ? `${body} ${phrase}` : body,
        })
      }
    }

    if (settings.deadlineWarnings) {
      for (const task of tasks) {
        if (task.kind !== 'range' || !task.endDate || !isOpen(task.status)) continue
        const body =
          task.endDate === day
            ? t('notify.deadline.today')
            : task.endDate === addDays(day, 1)
              ? t('notify.deadline.tomorrow')
              : null
        if (body) {
          add({
            at: at(day, settings.morningSummaryTime),
            kind: 'deadline',
            title: task.title,
            body,
            taskId: task.id,
            date: task.endDate,
          })
        }
      }
    }
  }

  // 5. Reminders pinned to calendar days.
  for (const reminder of snapshot.dayReminders ?? []) {
    if (reminder.deletedAt !== null) continue
    for (const time of reminderTimes(reminder)) {
      add({ at: at(reminder.date, time), kind: 'day-reminder', title: t('notify.dayReminder.title'), body: reminder.text })
    }
  }

  return planned
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_NOTIFICATIONS)
    .map((item, index) => ({ ...item, id: index + 1 }))
}
