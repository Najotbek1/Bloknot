import { useEffect, useMemo, useState } from 'react'
import { correctPrefixLength, matchesChallenge, normalizeTyped, pickChallenge } from '../../core/alarms/challenge'
import { getActive } from '../../core/db/repository'
import { updateAlarm } from '../../core/db/alarms'
import { db } from '../../core/db/schema'
import type { AlarmTextLength } from '../../core/models/types'
import { t } from '../../i18n'
import { getRingingAlarm, onAlarmRinging, stopAlarm, type RingingAlarm } from '../../platform/alarm'
import { pushBackHandler } from '../../platform/backButton'
import { useToast } from '../../ui/toastContext'
import { pushAdBlocker } from '../ads/blockers'
import './alarm.css'

/** Watches for a ringing alarm and, while one rings, covers the whole app with the typing challenge. */
export function AlarmRinging() {
  const [ringing, setRinging] = useState<RingingAlarm | null>(null)

  useEffect(() => {
    let active = true
    const refresh = () => {
      void getRingingAlarm().then((current) => {
        if (active) setRinging(current)
      })
    }
    refresh()
    const removeListener = onAlarmRinging((current) => setRinging(current))
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      removeListener()
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  if (!ringing) return null
  return <RingingScreen key={ringing.since} ringing={ringing} onStopped={() => setRinging(null)} />
}

function RingingScreen({ ringing, onStopped }: { ringing: RingingAlarm; onStopped: () => void }) {
  const [length, setLength] = useState<AlarmTextLength | null>(ringing.alarmId === 'test' ? 'short' : null)
  const clock = useClock()
  const [typed, setTyped] = useState('')
  const [stopping, setStopping] = useState(false)
  const toast = useToast()

  // The text depends on the alarm's chosen length; a test ring uses a short one.
  useEffect(() => {
    if (ringing.alarmId === 'test') return
    let active = true
    void getActive(db.alarms, ringing.alarmId).then((alarm) => {
      if (active) setLength(alarm?.textLength ?? 'short')
    })
    return () => {
      active = false
    }
  }, [ringing.alarmId])

  // Nothing else may be reached while it rings: no back button, no ad over the keyboard.
  useEffect(() => {
    const releaseBack = pushBackHandler(() => {})
    const releaseAd = pushAdBlocker()
    document.body.classList.add('alarm-open')
    return () => {
      releaseBack()
      releaseAd()
      document.body.classList.remove('alarm-open')
    }
  }, [])

  const target = useMemo(() => (length ? pickChallenge(length, ringing.since) : ''), [length, ringing.since])
  const correct = target ? correctPrefixLength(typed, target) : 0
  const percent = target ? Math.round((normalizeTyped(target.slice(0, correct)).length / normalizeTyped(target).length) * 100) : 0

  async function onInput(value: string) {
    setTyped(value)
    if (stopping || !target || !matchesChallenge(value, target)) return
    setStopping(true)
    await stopAlarm()
    // A one-time alarm has done its job.
    if (ringing.alarmId !== 'test') {
      const alarm = await getActive(db.alarms, ringing.alarmId)
      if (alarm && alarm.weekdays.length === 0) await updateAlarm(db, alarm.id, { enabled: false })
    }
    toast.show(t('alarm.ringing.done'))
    onStopped()
  }

  return (
    <div className="alarm-ringing" role="alertdialog" aria-modal="true" aria-labelledby="alarm-ringing-title">
      <p className="alarm-ringing__clock">{clock}</p>
      <h1 id="alarm-ringing-title" className="alarm-ringing__title">
        {t('alarm.ringing.title')}
      </h1>
      {ringing.label && <p className="alarm-ringing__label">{ringing.label}</p>}

      <p className="alarm-ringing__instruction">{t('alarm.ringing.instruction')}</p>
      <p className="alarm-ringing__target" data-testid="alarm-target">
        <span className="alarm-ringing__done">{target.slice(0, correct)}</span>
        {target.slice(correct)}
      </p>

      <textarea
        className="input alarm-ringing__input"
        value={typed}
        rows={3}
        autoFocus
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-label={t('alarm.ringing.input')}
        placeholder={t('alarm.ringing.input')}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        onChange={(event) => void onInput(event.target.value)}
      />
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="progress__bar" style={{ width: `${percent}%` }} />
      </div>
      <p className="alarm-ringing__hint">
        {t('alarm.ringing.progress', { percent })} · {t('alarm.ringing.hint')}
      </p>
    </div>
  )
}

/** "06:31", updated every few seconds. */
function useClock(): string {
  const format = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }
  const [clock, setClock] = useState(format)
  useEffect(() => {
    const timer = window.setInterval(() => setClock(format()), 5000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])
  return clock
}
