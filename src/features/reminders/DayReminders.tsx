import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { listDayReminders } from '../../core/db/dayReminders'
import { db } from '../../core/db/schema'
import type { DateKey, DayReminder } from '../../core/models/types'
import { t } from '../../i18n'
import { BellIcon, PlusIcon } from '../../ui/icons'
import { Sheet } from '../../ui/Sheet'
import { DayReminderForm } from './DayReminderForm'
import './reminders.css'

interface DayRemindersProps {
  date: DateKey
  /** Show the "add" button (the calendar); the Today screen only lists what is there. */
  canAdd?: boolean
}

type Editing = { reminder?: DayReminder } | null

/** The reminders pinned to `date`, each opening its editor, plus an "add" button. */
export function DayReminders({ date, canAdd = true }: DayRemindersProps) {
  const reminders = useLiveQuery(() => listDayReminders(db, date), [date])
  const [editing, setEditing] = useState<Editing>(null)

  if (!reminders || (!canAdd && reminders.length === 0)) return null

  return (
    <section className="section">
      <h2 className="section__title">{t('reminder.title')}</h2>
      {reminders.length > 0 && (
        <ul className="card reminder-list">
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              <button type="button" className="reminder-row" onClick={() => setEditing({ reminder })}>
                <BellIcon size={20} className="reminder-row__icon" />
                <span className="reminder-row__body">
                  <span className="reminder-row__text">{reminder.text}</span>
                  <span className="reminder-row__when">
                    {reminder.mode === 'thrice' ? t('reminder.when.thrice') : reminder.time}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <button type="button" className="btn btn--block reminder-add" onClick={() => setEditing({})}>
          <PlusIcon size={20} />
          {t('reminder.add')}
        </button>
      )}

      <Sheet
        open={editing !== null}
        title={editing?.reminder ? t('reminder.edit') : t('reminder.new')}
        onClose={() => setEditing(null)}
        closeLabel={t('task.cancel')}
      >
        {editing && (
          <DayReminderForm
            key={editing.reminder?.id ?? 'new'}
            date={date}
            reminder={editing.reminder}
            onDone={() => setEditing(null)}
          />
        )}
      </Sheet>
    </section>
  )
}
