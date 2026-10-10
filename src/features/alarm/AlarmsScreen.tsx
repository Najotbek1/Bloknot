import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { listAlarms, updateAlarm } from '../../core/db/alarms'
import { db } from '../../core/db/schema'
import type { Alarm } from '../../core/models/types'
import { t } from '../../i18n'
import {
  alarmsSupported,
  getAlarmStatus,
  openAlarmSettings,
  testAlarm,
  type AlarmSettingsScreen,
  type AlarmStatus,
} from '../../platform/alarm'
import { pushBackHandler } from '../../platform/backButton'
import { Fab } from '../../ui/Fab'
import { ChevronLeftIcon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { useToast } from '../../ui/toastContext'
import { AlarmForm } from './AlarmForm'
import { describeWeekdays } from './labels'
import './alarm.css'

type Editing = { alarm?: Alarm } | null

/** The alarm list, opened from the ⏰ button on Today. */
export function AlarmsScreen({ onBack }: { onBack: () => void }) {
  const alarms = useLiveQuery(() => listAlarms(db), [])
  const [editing, setEditing] = useState<Editing>(null)
  const toast = useToast()

  // The Android back button returns to Today.
  useEffect(() => {
    const release = pushBackHandler(onBack)
    return release
  }, [onBack])

  async function test() {
    await testAlarm({
      seconds: 10,
      label: t('alarm.testLabel'),
      title: t('alarm.ringing.title'),
      body: t('alarm.testLabel'),
      ringtone: null,
    })
    toast.show(t('alarm.testStarted'))
  }

  return (
    <main className="screen">
      <header className="screen__header subpage-header">
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t('alarm.back')}>
          <ChevronLeftIcon />
        </button>
        <h1 className="screen__title subpage-header__title">{t('alarm.title')}</h1>
      </header>

      {alarmsSupported ? <PermissionNotices /> : <p className="notice">{t('alarm.unsupported')}</p>}

      <section className="section">
        {alarms?.length === 0 && <p className="card empty">{t('alarm.empty')}</p>}
        {alarms && alarms.length > 0 && (
          <ul className="card alarm-list">
            {alarms.map((alarm) => (
              <li key={alarm.id} className={`alarm-row ${alarm.enabled ? '' : 'alarm-row--off'}`}>
                <button type="button" className="alarm-row__body" onClick={() => setEditing({ alarm })}>
                  <span className="alarm-row__time">{alarm.time}</span>
                  <span className="alarm-row__meta">
                    {[describeWeekdays(alarm.weekdays), alarm.label].filter(Boolean).join(' · ')}
                  </span>
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={alarm.enabled}
                  aria-label={t('alarm.enabledLabel', { time: alarm.time })}
                  className="switch-row alarm-row__switch"
                  onClick={() => void updateAlarm(db, alarm.id, { enabled: !alarm.enabled })}
                >
                  <span className="switch" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="section">
        <button type="button" className="btn btn--block" onClick={() => void test()}>
          {t('alarm.test')}
        </button>
      </section>

      <Fab label={t('alarm.add')} onClick={() => setEditing({})} />

      <Sheet
        open={editing !== null}
        title={editing?.alarm ? t('alarm.edit') : t('alarm.new')}
        onClose={() => setEditing(null)}
        closeLabel={t('task.cancel')}
      >
        {editing && <AlarmForm key={editing.alarm?.id ?? 'new'} alarm={editing.alarm} onDone={() => setEditing(null)} />}
      </Sheet>
    </main>
  )
}

const NOTICES: { key: keyof AlarmStatus; screen: AlarmSettingsScreen; text: 'alarm.perm.exact' | 'alarm.perm.fullScreen' | 'alarm.perm.notifications' }[] = [
  { key: 'notifications', screen: 'notifications', text: 'alarm.perm.notifications' },
  { key: 'exact', screen: 'exact', text: 'alarm.perm.exact' },
  { key: 'fullScreen', screen: 'fullScreen', text: 'alarm.perm.fullScreen' },
]

/** What the phone still has to allow for alarms to ring on time and over the lock screen. */
function PermissionNotices() {
  const [status, setStatus] = useState<AlarmStatus | null>(null)

  useEffect(() => {
    let active = true
    const refresh = () => {
      void getAlarmStatus().then((next) => {
        if (active) setStatus(next)
      })
    }
    refresh()
    // Coming back from the system settings screen.
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!status) return null
  return (
    <>
      {NOTICES.filter(({ key }) => !status[key]).map(({ key, screen, text }) => (
        <div key={key} className="notice notice--warning">
          <p>{t(text)}</p>
          <button type="button" className="btn btn--primary" onClick={() => void openAlarmSettings(screen)}>
            {t('alarm.perm.open')}
          </button>
        </div>
      ))}
      <details className="notice alarm-battery">
        <summary>{t('alarm.perm.batteryTitle')}</summary>
        <p>{t('alarm.perm.battery')}</p>
        <button type="button" className="btn" onClick={() => void openAlarmSettings('app')}>
          {t('alarm.perm.open')}
        </button>
      </details>
    </>
  )
}
