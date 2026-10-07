import { differenceInCalendarDays, differenceInCalendarMonths } from 'date-fns'
import { addDays, parseDateKey, weekStartOf, weekdayOf } from '../dates'
import type { DateKey, RecurrenceRule } from '../models/types'

/** Whether a task that starts on `anchor` and repeats by `rule` occurs on `date`. */
export function occursOn(rule: RecurrenceRule, anchor: DateKey, date: DateKey): boolean {
  if (date < anchor) return false
  if (rule.until && date > rule.until) return false

  const interval = Math.max(1, Math.floor(rule.interval))
  const day = parseDateKey(date)
  const start = parseDateKey(anchor)

  switch (rule.freq) {
    case 'daily':
      return differenceInCalendarDays(day, start) % interval === 0

    case 'weekly': {
      const weekdays = rule.weekdays?.length ? rule.weekdays : [weekdayOf(anchor)]
      if (!weekdays.includes(weekdayOf(date))) return false
      const weeks =
        differenceInCalendarDays(parseDateKey(weekStartOf(date)), parseDateKey(weekStartOf(anchor))) / 7
      return weeks % interval === 0
    }

    case 'monthly': {
      const monthDay = rule.monthDay ?? start.getDate()
      if (day.getDate() !== monthDay) return false
      return differenceInCalendarMonths(day, start) % interval === 0
    }
  }
}

/** All dates between `from` and `to` (inclusive) on which the task occurs, in order. */
export function occurrencesBetween(
  rule: RecurrenceRule,
  anchor: DateKey,
  from: DateKey,
  to: DateKey,
): DateKey[] {
  const first = from > anchor ? from : anchor
  const last = rule.until && rule.until < to ? rule.until : to
  const dates: DateKey[] = []
  for (let date = first; date <= last; date = addDays(date, 1)) {
    if (occursOn(rule, anchor, date)) dates.push(date)
  }
  return dates
}
