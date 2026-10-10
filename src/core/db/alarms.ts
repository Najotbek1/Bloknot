import type { Alarm, AlarmTextLength, TimeOfDay, Weekday } from '../models/types'
import { createRecord, listActive, softDelete, updateRecord, type RecordChanges } from './repository'
import type { BloknotDB } from './schema'

export interface AlarmInput {
  time: TimeOfDay
  weekdays?: Weekday[]
  label?: string
  textLength?: AlarmTextLength
  ringtoneUri?: string | null
  ringtoneTitle?: string | null
}

// async so invalid input rejects the promise instead of throwing at the call.
export async function createAlarm(db: BloknotDB, input: AlarmInput, now: number = Date.now()): Promise<Alarm> {
  if (!/^\d{2}:\d{2}$/.test(input.time)) throw new Error('Alarm time is required')
  return createRecord(
    db.alarms,
    {
      time: input.time,
      weekdays: [...new Set(input.weekdays ?? [])].sort((a, b) => a - b),
      enabled: true,
      label: (input.label ?? '').trim(),
      textLength: input.textLength ?? 'short',
      ringtoneUri: input.ringtoneUri ?? null,
      ringtoneTitle: input.ringtoneTitle ?? null,
    },
    now,
  )
}

export async function updateAlarm(
  db: BloknotDB,
  id: string,
  changes: RecordChanges<Alarm>,
  now: number = Date.now(),
): Promise<Alarm> {
  if (changes.time !== undefined && !/^\d{2}:\d{2}$/.test(changes.time)) throw new Error('Alarm time is required')
  const cleaned = { ...changes }
  if (cleaned.weekdays) cleaned.weekdays = [...new Set(cleaned.weekdays)].sort((a, b) => a - b)
  if (cleaned.label !== undefined) cleaned.label = cleaned.label.trim()
  return updateRecord(db.alarms, id, cleaned, now)
}

export function deleteAlarm(db: BloknotDB, id: string, now: number = Date.now()): Promise<void> {
  return softDelete(db.alarms, id, now)
}

/** Active alarms, earliest time of day first. */
export async function listAlarms(db: BloknotDB): Promise<Alarm[]> {
  return (await listActive(db.alarms)).sort((a, b) => a.time.localeCompare(b.time) || a.createdAt - b.createdAt)
}
