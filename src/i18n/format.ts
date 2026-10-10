import { addDays, parseDateKey, toDateKey, weekdayOf } from '../core/dates'
import { getLanguage, t } from './index'
import { languageInfo } from './languages'
import type { DateKey, MonthKey, Weekday } from '../core/models/types'
import { uzMonths, uzWeekdays, uzWeekdaysShort } from './uz'

/**
 * Dates in the current language. Uzbek keeps its hand-written forms ("7-oktabr"); the other
 * languages use the phone's Intl data, which knows their grammar.
 */

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const isUzbek = () => getLanguage() === 'uz'
const locale = () => languageInfo(getLanguage()).locale

function intl(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale(), options)
}

/** A Monday, to read weekday names from Intl. */
const MONDAY = new Date(2024, 0, 1)

/** "Du", "Mon", "Пн"… for 1 = Monday … 7 = Sunday. */
export function weekdayShort(day: Weekday): string {
  if (isUzbek()) return uzWeekdaysShort[day - 1]
  const date = new Date(MONDAY)
  date.setDate(MONDAY.getDate() + day - 1)
  return capitalize(intl({ weekday: 'short' }).format(date))
}

/** "Dushanba", "Monday", "понедельник"… */
export function weekdayName(day: Weekday): string {
  if (isUzbek()) return uzWeekdays[day - 1]
  const date = new Date(MONDAY)
  date.setDate(MONDAY.getDate() + day - 1)
  return capitalize(intl({ weekday: 'long' }).format(date))
}

/** "7-oktabr" / "October 7", with the year added when it differs from `currentYear`. */
export function formatDayShort(key: DateKey, currentYear?: number): string {
  const date = parseDateKey(key)
  const withYear = currentYear !== undefined && date.getFullYear() !== currentYear
  if (!isUzbek()) {
    return intl({ day: 'numeric', month: 'long', ...(withYear ? { year: 'numeric' } : {}) }).format(date)
  }
  const text = `${date.getDate()}-${uzMonths[date.getMonth()]}`
  return withYear ? `${text}, ${date.getFullYear()}` : text
}

/** "Chorshanba, 7-oktabr" / "Wednesday, October 7" */
export function formatDayLong(key: DateKey): string {
  if (!isUzbek()) return capitalize(intl({ weekday: 'long', day: 'numeric', month: 'long' }).format(parseDateKey(key)))
  return `${uzWeekdays[weekdayOf(key) - 1]}, ${formatDayShort(key)}`
}

/** "Oktabr 2026" / "October 2026" */
export function formatMonth(month: MonthKey): string {
  const [year, monthNumber] = month.split('-').map(Number)
  if (!isUzbek()) return capitalize(intl({ month: 'long', year: 'numeric' }).format(new Date(year, monthNumber - 1, 1)))
  return `${capitalize(uzMonths[monthNumber - 1])} ${year}`
}

/** "5–11-oktabr" / "October 5 – 11" for the week starting on `weekStart`. */
export function formatWeek(weekStart: DateKey): string {
  const start = parseDateKey(weekStart)
  const end = parseDateKey(addDays(weekStart, 6))
  if (!isUzbek()) return intl({ day: 'numeric', month: 'long' }).formatRange(start, end)
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()}-${uzMonths[end.getMonth()]}`
  }
  return `${formatDayShort(weekStart)} – ${formatDayShort(addDays(weekStart, 6))}`
}

/** "1-oktabr – 31-dekabr" */
export function formatRange(startDate: DateKey, endDate: DateKey): string {
  const year = parseDateKey(startDate).getFullYear()
  if (!isUzbek()) {
    const sameYear = parseDateKey(endDate).getFullYear() === year && year === new Date().getFullYear()
    return intl({ day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) }).formatRange(
      parseDateKey(startDate),
      parseDateKey(endDate),
    )
  }
  return `${formatDayShort(startDate, year)} – ${formatDayShort(endDate, year)}`
}

/** "bugun 14:05", "kecha 09:30", or "7-oktabr" for a moment in the past. */
export function formatUpdated(timestamp: number, now: Date = new Date()): string {
  const date = new Date(timestamp)
  const day = toDateKey(date)
  const today = toDateKey(now)
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  if (day === today) return t('time.today', { time })
  if (day === addDays(today, -1)) return t('time.yesterday', { time })
  return formatDayShort(day, now.getFullYear())
}
