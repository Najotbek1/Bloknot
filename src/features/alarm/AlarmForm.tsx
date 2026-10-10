import { useState, type FormEvent } from 'react'
import { challengeTexts } from '../../core/alarms/challenge'
import { createAlarm, deleteAlarm, updateAlarm } from '../../core/db/alarms'
import { db } from '../../core/db/schema'
import type { Alarm, AlarmTextLength, Weekday } from '../../core/models/types'
import { weekdayShort } from '../../i18n/format'
import { t } from '../../i18n'
import { alarmsSupported, pickRingtone } from '../../platform/alarm'
import { useToast } from '../../ui/toastContext'

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7]
const LENGTHS: AlarmTextLength[] = ['short', 'medium', 'long']

interface AlarmFormProps {
  alarm?: Alarm
  onDone: () => void
}

export function AlarmForm({ alarm, onDone }: AlarmFormProps) {
  const [time, setTime] = useState(alarm?.time ?? '07:00')
  const [weekdays, setWeekdays] = useState<Weekday[]>(alarm?.weekdays ?? [])
  const [label, setLabel] = useState(alarm?.label ?? '')
  const [textLength, setTextLength] = useState<AlarmTextLength>(alarm?.textLength ?? 'short')
  const [ringtone, setRingtone] = useState({ uri: alarm?.ringtoneUri ?? null, title: alarm?.ringtoneTitle ?? null })
  const [error, setError] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()

  const toggleDay = (day: Weekday) =>
    setWeekdays((days) => (days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort((a, b) => a - b)))

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!/^\d{2}:\d{2}$/.test(time)) return setError(true)
    const fields = { time, weekdays, label, textLength, ringtoneUri: ringtone.uri, ringtoneTitle: ringtone.title }
    if (alarm) await updateAlarm(db, alarm.id, { ...fields, enabled: true })
    else await createAlarm(db, fields)
    toast.show(t('alarm.saved'))
    onDone()
  }

  async function remove() {
    if (!alarm) return
    if (!confirmDelete) return setConfirmDelete(true)
    await deleteAlarm(db, alarm.id)
    toast.show(t('alarm.deleted'))
    onDone()
  }

  async function chooseRingtone() {
    const picked = await pickRingtone(ringtone.uri)
    if (picked) setRingtone(picked)
  }

  return (
    <form onSubmit={save} noValidate>
      <label className="field">
        <span className="field__label">{t('alarm.time')}</span>
        <input
          className="input alarm-form__time"
          type="time"
          value={time}
          aria-invalid={error}
          onChange={(event) => {
            setTime(event.target.value)
            setError(false)
          }}
        />
      </label>

      <div className="field">
        <span className="field__label">{t('alarm.repeat')}</span>
        <div className="chips" role="group" aria-label={t('alarm.repeat')}>
          {WEEKDAYS.map((day) => (
            <button
              key={day}
              type="button"
              className="chip"
              aria-pressed={weekdays.includes(day)}
              onClick={() => toggleDay(day)}
            >
              {weekdayShort(day)}
            </button>
          ))}
        </div>
        <p className="field__hint">{t('alarm.repeatHint')}</p>
      </div>

      <label className="field">
        <span className="field__label">{t('alarm.label')}</span>
        <input
          className="input"
          value={label}
          placeholder={t('alarm.labelPlaceholder')}
          onChange={(event) => setLabel(event.target.value)}
        />
      </label>

      <div className="field">
        <span className="field__label">{t('alarm.textLength')}</span>
        <div className="chips" role="group" aria-label={t('alarm.textLength')}>
          {LENGTHS.map((length) => (
            <button
              key={length}
              type="button"
              className="chip"
              aria-pressed={textLength === length}
              onClick={() => setTextLength(length)}
            >
              {t(`alarm.textLength.${length}`)}
            </button>
          ))}
        </div>
        <p className="field__hint">{t('alarm.textSample', { text: challengeTexts(textLength)[0] })}</p>
      </div>

      {alarmsSupported && (
        <div className="field">
          <span className="field__label">{t('alarm.ringtone')}</span>
          <button type="button" className="btn btn--block alarm-form__ringtone" onClick={() => void chooseRingtone()}>
            🎵 {ringtone.title ?? t('alarm.ringtoneDefault')}
          </button>
        </div>
      )}

      {alarm && (
        <button type="button" className="btn btn--danger btn--block" onClick={() => void remove()}>
          {confirmDelete ? t('alarm.deleteConfirm') : t('alarm.delete')}
        </button>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary btn--block">
          {t('task.save')}
        </button>
      </div>
    </form>
  )
}
