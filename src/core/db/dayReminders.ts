import type { DateKey, DayReminder, DayReminderMode, TimeOfDay } from '../models/types'
import { createRecord, softDelete, updateRecord } from './repository'
import type { BloknotDB } from './schema'

/** Times a 'thrice' reminder rings on its day. */
export const THRICE_TIMES: readonly TimeOfDay[] = ['09:00', '14:00', '20:00']

export interface DayReminderInput {
  date: DateKey
  text: string
  mode: DayReminderMode
  time?: TimeOfDay | null
}

/** Checks and normalizes the editable fields; throws on an empty text or a missing time. */
function clean(input: DayReminderInput): Omit<DayReminder, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
  const text = input.text.trim()
  if (!text) throw new Error('Reminder text is required')
  if (input.mode === 'time' && !input.time) throw new Error('Reminder time is required')
  return { date: input.date, text, mode: input.mode, time: input.mode === 'time' ? (input.time ?? null) : null }
}

// async so invalid input rejects the promise instead of throwing at the call.
export async function createDayReminder(
  db: BloknotDB,
  input: DayReminderInput,
  now: number = Date.now(),
): Promise<DayReminder> {
  return createRecord(db.dayReminders, clean(input), now)
}

export async function updateDayReminder(
  db: BloknotDB,
  id: string,
  input: DayReminderInput,
  now: number = Date.now(),
): Promise<DayReminder> {
  return updateRecord(db.dayReminders, id, clean(input), now)
}

export function deleteDayReminder(db: BloknotDB, id: string, now: number = Date.now()): Promise<void> {
  return softDelete(db.dayReminders, id, now)
}

/** When a reminder rings during its day, earliest first. */
export function reminderTimes(reminder: Pick<DayReminder, 'mode' | 'time'>): TimeOfDay[] {
  return reminder.mode === 'thrice' ? [...THRICE_TIMES] : reminder.time ? [reminder.time] : []
}

function byFirstTime(a: DayReminder, b: DayReminder): number {
  return (reminderTimes(a)[0] ?? '').localeCompare(reminderTimes(b)[0] ?? '') || a.createdAt - b.createdAt
}

/** Active reminders between `from` and `to` (inclusive), by day and then by time. */
export async function listDayRemindersBetween(db: BloknotDB, from: DateKey, to: DateKey): Promise<DayReminder[]> {
  const rows = await db.dayReminders.where('date').between(from, to, true, true).toArray()
  return rows
    .filter((row) => row.deletedAt === null)
    .sort((a, b) => a.date.localeCompare(b.date) || byFirstTime(a, b))
}

export function listDayReminders(db: BloknotDB, date: DateKey): Promise<DayReminder[]> {
  return listDayRemindersBetween(db, date, date)
}
