import { liveQuery } from 'dexie'
import { useEffect } from 'react'
import { planAlarms } from '../../core/alarms/schedule'
import { listAlarms } from '../../core/db/alarms'
import { db } from '../../core/db/schema'
import type { Alarm } from '../../core/models/types'
import { t } from '../../i18n'
import { alarmsSupported, setAlarmSchedule } from '../../platform/alarm'

/**
 * Keeps the phone's alarm clock in line with the alarms: the next week of rings is planned again
 * whenever alarms change and when the app comes back to the foreground (to roll the week on).
 */
export function useAlarmSync() {
  useEffect(() => {
    if (!alarmsSupported) return
    let latest: Alarm[] | null = null
    const run = () => {
      if (!latest) return
      const byId = new Map(latest.map((alarm) => [alarm.id, alarm]))
      const plan = planAlarms(latest, new Date()).map((ring) => ({
        id: ring.nativeId,
        at: ring.at.getTime(),
        alarmId: ring.alarmId,
        label: ring.label,
        title: t('alarm.ringing.title'),
        body: ring.label || t('alarm.title'),
        ringtone: byId.get(ring.alarmId)?.ringtoneUri ?? '',
      }))
      void setAlarmSchedule(plan)
    }
    const subscription = liveQuery(() => listAlarms(db)).subscribe({
      next: (alarms) => {
        latest = alarms
        run()
      },
      error: (error: unknown) => console.error('Alarm query failed', error),
    })
    const onVisible = () => {
      if (document.visibilityState === 'visible') run()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
