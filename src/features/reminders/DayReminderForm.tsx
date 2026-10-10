import { useState, type FormEvent } from 'react'
import { createDayReminder, deleteDayReminder, updateDayReminder } from '../../core/db/dayReminders'
import { db } from '../../core/db/schema'
import type { DateKey, DayReminder, DayReminderMode } from '../../core/models/types'
import { t } from '../../i18n'
import { formatDayShort } from '../../i18n/format'
import { useToast } from '../../ui/toastContext'

const MODES: DayReminderMode[] = ['thrice', 'time']

interface DayReminderFormProps {
  date: DateKey
  reminder?: DayReminder
  onDone: () => void
}

/** Text, "3 times that day" or "at a time", and the time. Used inside a Sheet. */
export function DayReminderForm({ date, reminder, onDone }: DayReminderFormProps) {
  const [text, setText] = useState(reminder?.text ?? '')
  const [mode, setMode] = useState<DayReminderMode>(reminder?.mode ?? 'thrice')
  const [time, setTime] = useState(reminder?.time ?? '09:00')
  const [error, setError] = useState<'text' | 'time' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!text.trim()) return setError('text')
    if (mode === 'time' && !time) return setError('time')
    const input = { date, text, mode, time: mode === 'time' ? time : null }
    if (reminder) await updateDayReminder(db, reminder.id, input)
    else await createDayReminder(db, input)
    toast.show(t('reminder.saved', { day: formatDayShort(date) }))
    onDone()
  }

  async function remove() {
    if (!reminder) return
    if (!confirmDelete) return setConfirmDelete(true)
    await deleteDayReminder(db, reminder.id)
    toast.show(t('reminder.deleted'))
    onDone()
  }

  return (
    <form onSubmit={save} noValidate>
      <label className="field">
        <span className="field__label">{t('reminder.text')}</span>
        <textarea
          className="input"
          value={text}
          rows={2}
          placeholder={t('reminder.textPlaceholder')}
          autoFocus={!reminder}
          aria-invalid={error === 'text'}
          onChange={(event) => {
            setText(event.target.value)
            setError(null)
          }}
        />
      </label>

      <div className="field">
        <span className="field__label">{t('reminder.mode')}</span>
        <div className="chips" role="group" aria-label={t('reminder.mode')}>
          {MODES.map((value) => (
            <button
              key={value}
              type="button"
              className="chip"
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value)
                setError(null)
              }}
            >
              {t(`reminder.mode.${value}`)}
            </button>
          ))}
        </div>
        {mode === 'thrice' ? (
          <p className="field__hint">{t('reminder.thriceHint')}</p>
        ) : (
          <label className="field reminder-time">
            <span className="field__label">{t('reminder.time')}</span>
            <input
              className="input"
              type="time"
              value={time}
              aria-invalid={error === 'time'}
              onChange={(event) => {
                setTime(event.target.value)
                setError(null)
              }}
            />
          </label>
        )}
      </div>

      {reminder && (
        <button type="button" className="btn btn--danger btn--block" onClick={() => void remove()}>
          {confirmDelete ? t('reminder.deleteConfirm') : t('reminder.delete')}
        </button>
      )}

      <div className="form-actions">
        {error && (
          <p className="form-error" role="alert">
            {t(error === 'text' ? 'reminder.error.text' : 'reminder.error.time')}
          </p>
        )}
        <button type="submit" className="btn btn--primary btn--block">
          {t('task.save')}
        </button>
      </div>
    </form>
  )
}
