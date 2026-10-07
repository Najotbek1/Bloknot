import { addDays as addDaysToDate, format, isValid, parse, startOfISOWeek } from 'date-fns'
import type { DateKey, MonthKey, Weekday } from './models/types'

const DATE_FORMAT = 'yyyy-MM-dd'
const MONTH_FORMAT = 'yyyy-MM'

/** Formats a `Date` as a local `YYYY-MM-DD` key. */
export function toDateKey(date: Date): DateKey {
  return format(date, DATE_FORMAT)
}

/** Parses a `YYYY-MM-DD` key into a `Date` at local midnight. Throws on invalid input. */
export function parseDateKey(key: DateKey): Date {
  const date = parse(key, DATE_FORMAT, new Date(2000, 0, 1))
  if (!isValid(date) || toDateKey(date) !== key) {
    throw new Error(`Invalid date key: ${key}`)
  }
  return date
}

export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now)
}

/** Monday of the week containing `key`. */
export function weekStartOf(key: DateKey): DateKey {
  return toDateKey(startOfISOWeek(parseDateKey(key)))
}

export function monthKeyOf(key: DateKey): MonthKey {
  return format(parseDateKey(key), MONTH_FORMAT)
}

export function addDays(key: DateKey, days: number): DateKey {
  return toDateKey(addDaysToDate(parseDateKey(key), days))
}

/** ISO weekday of `key`: 1 = Monday … 7 = Sunday. */
export function weekdayOf(key: DateKey): Weekday {
  const day = parseDateKey(key).getDay()
  return (day === 0 ? 7 : day) as Weekday
}

/** Whether `key` lies between `from` and `to`, both inclusive. */
export function isDateInRange(key: DateKey, from: DateKey, to: DateKey): boolean {
  // YYYY-MM-DD keys sort the same way as the dates they represent.
  return key >= from && key <= to
}
