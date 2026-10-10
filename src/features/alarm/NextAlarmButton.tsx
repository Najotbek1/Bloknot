import { useLiveQuery } from 'dexie-react-hooks'
import { nextAlarm } from '../../core/alarms/schedule'
import { addDays, toDateKey } from '../../core/dates'
import { listAlarms } from '../../core/db/alarms'
import { db } from '../../core/db/schema'
import { t } from '../../i18n'
import { formatDayShort } from '../../i18n/format'
import { AlarmIcon } from '../../ui/icons'
import { useToday } from '../../ui/useToday'
import './alarm.css'

/** ⏰ on Today: the next alarm ("06:30, ertaga"), or just the icon; opens the alarm list. */
export function NextAlarmButton({ onClick }: { onClick: () => void }) {
  const today = useToday()
  // Re-evaluated when alarms change and when the day changes.
  const next = useLiveQuery(async () => nextAlarm(await listAlarms(db), new Date()), [today])

  let text: string | null = null
  if (next) {
    const day = toDateKey(next.at)
    const when =
      day === today ? t('alarm.next.today') : day === addDays(today, 1) ? t('alarm.next.tomorrow') : formatDayShort(day)
    text = `${next.alarm.time}, ${when}`
  }

  return (
    <button type="button" className="next-alarm" onClick={onClick} aria-label={t('alarm.open')}>
      <AlarmIcon size={18} />
      {text && <span>{text}</span>}
    </button>
  )
}
