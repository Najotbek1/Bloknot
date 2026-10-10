import { differenceInCalendarDays } from 'date-fns'
import { parseDateKey, weekdayOf } from '../../core/dates'
import type { DateKey, RecurrenceRule, Task } from '../../core/models/types'
import { weekdayShort } from '../../i18n/format'
import { t } from '../../i18n'

/** "Har kuni", "Har hafta: Du, Ch", "Har oyning 15-kuni", … */
export function recurrenceSummary(rule: RecurrenceRule, anchor: DateKey): string {
  const n = Math.max(1, rule.interval)
  switch (rule.freq) {
    case 'daily':
      return n === 1 ? t('repeat.summary.daily') : t('repeat.summary.everyNDays', { n })
    case 'weekly': {
      const weekdays = rule.weekdays?.length ? [...rule.weekdays].sort() : [weekdayOf(anchor)]
      const days = weekdays.map((day) => weekdayShort(day)).join(', ')
      return n === 1 ? t('repeat.summary.weekly', { days }) : t('repeat.summary.everyNWeeks', { n, days })
    }
    case 'monthly': {
      const day = rule.monthDay ?? parseDateKey(anchor).getDate()
      return n === 1 ? t('repeat.summary.monthly', { day }) : t('repeat.summary.everyNMonths', { n, day })
    }
  }
}

export type RangePhase = 'upcoming' | 'active' | 'finished'

export function rangePhase(task: Pick<Task, 'startDate' | 'endDate'>, today: DateKey): RangePhase {
  if (task.startDate && today < task.startDate) return 'upcoming'
  if (task.endDate && today > task.endDate) return 'finished'
  return 'active'
}

/** "12 kun qoldi", "Bugun oxirgi kun", "3 kundan keyin boshlanadi", "Muddati o‘tgan". */
export function rangeHint(task: Pick<Task, 'startDate' | 'endDate'>, today: DateKey): string {
  if (!task.startDate || !task.endDate) return ''
  const now = parseDateKey(today)
  switch (rangePhase(task, today)) {
    case 'upcoming':
      return t('task.startsIn', { days: differenceInCalendarDays(parseDateKey(task.startDate), now) })
    case 'finished':
      return t('task.overdue')
    case 'active': {
      const days = differenceInCalendarDays(parseDateKey(task.endDate), now)
      return days === 0 ? t('task.lastDay') : t('task.daysLeft', { days })
    }
  }
}

/** Share of the range's days that have passed, 0–1. */
export function rangeElapsed(task: Pick<Task, 'startDate' | 'endDate'>, today: DateKey): number {
  if (!task.startDate || !task.endDate) return 0
  const total = differenceInCalendarDays(parseDateKey(task.endDate), parseDateKey(task.startDate)) + 1
  const passed = differenceInCalendarDays(parseDateKey(today), parseDateKey(task.startDate)) + 1
  return Math.min(1, Math.max(0, passed / total))
}
