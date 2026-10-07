import { addDays, parseDateKey, weekdayOf } from '../core/dates'
import type { DateKey, MonthKey } from '../core/models/types'
import { uzMonths, uzWeekdays } from './uz'

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "7-oktabr", with the year added when it differs from `currentYear`. */
export function formatDayShort(key: DateKey, currentYear?: number): string {
  const date = parseDateKey(key)
  const text = `${date.getDate()}-${uzMonths[date.getMonth()]}`
  return currentYear !== undefined && date.getFullYear() !== currentYear ? `${text}, ${date.getFullYear()}` : text
}

/** "Chorshanba, 7-oktabr" */
export function formatDayLong(key: DateKey): string {
  return `${uzWeekdays[weekdayOf(key) - 1]}, ${formatDayShort(key)}`
}

/** "Oktabr 2026" */
export function formatMonth(month: MonthKey): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return `${capitalize(uzMonths[monthNumber - 1])} ${year}`
}

/** "5–11-oktabr" or "28-dekabr – 3-yanvar" for the week starting on `weekStart`. */
export function formatWeek(weekStart: DateKey): string {
  const start = parseDateKey(weekStart)
  const end = parseDateKey(addDays(weekStart, 6))
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()}-${uzMonths[end.getMonth()]}`
  }
  return `${formatDayShort(weekStart)} – ${formatDayShort(addDays(weekStart, 6))}`
}

/** "1-oktabr – 31-dekabr" */
export function formatRange(startDate: DateKey, endDate: DateKey): string {
  const year = parseDateKey(startDate).getFullYear()
  return `${formatDayShort(startDate, year)} – ${formatDayShort(endDate, year)}`
}
