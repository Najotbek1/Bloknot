import { addDays, parseDateKey, toDateKey, weekdayOf } from '../dates'
import type { Alarm, DateKey, TimeOfDay } from '../models/types'

/** Android keeps every pending alarm; a week ahead is plenty since the plan is redone on every change and launch. */
export const PLAN_DAYS = 8
export const MAX_PLANNED_ALARMS = 64

export interface PlannedAlarm {
  /** 1-based position in the plan; the native side cancels and re-creates all of them each time. */
  nativeId: number
  at: Date
  alarmId: string
  label: string
}

function at(date: DateKey, time: TimeOfDay): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const result = parseDateKey(date)
  result.setHours(hours, minutes, 0, 0)
  return result
}

/** When `alarm` rings in the next `days` days after `now`. A one-time alarm rings once, at the next `time`. */
export function nextRings(alarm: Alarm, now: Date, days: number = PLAN_DAYS): Date[] {
  if (!alarm.enabled || alarm.deletedAt !== null) return []
  const today = toDateKey(now)
  const rings: Date[] = []
  for (let offset = 0; offset <= days; offset++) {
    const date = addDays(today, offset)
    const ring = at(date, alarm.time)
    if (ring <= now) continue
    if (alarm.weekdays.length === 0) return [ring]
    if (alarm.weekdays.includes(weekdayOf(date))) rings.push(ring)
  }
  return rings
}

/** Every ring of every enabled alarm in the coming days, soonest first. */
export function planAlarms(alarms: Alarm[], now: Date, days: number = PLAN_DAYS): PlannedAlarm[] {
  return alarms
    .flatMap((alarm) => nextRings(alarm, now, days).map((ring) => ({ at: ring, alarmId: alarm.id, label: alarm.label })))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_PLANNED_ALARMS)
    .map((item, index) => ({ ...item, nativeId: index + 1 }))
}

/** The soonest ring of all alarms, for the "next alarm" line on Today. */
export function nextAlarm(alarms: Alarm[], now: Date): { at: Date; alarm: Alarm } | null {
  let best: { at: Date; alarm: Alarm } | null = null
  for (const alarm of alarms) {
    const ring = nextRings(alarm, now)[0]
    if (ring && (!best || ring < best.at)) best = { at: ring, alarm }
  }
  return best
}
