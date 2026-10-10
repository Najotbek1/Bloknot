import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { db } from '../../core/db/schema'
import { buildTask, createTask, updateTask } from '../../core/db/tasks'
import { monthKeyOf, parseDateKey, todayKey, weekStartOf, weekdayOf } from '../../core/dates'
import type {
  DateKey,
  RecurrenceRule,
  Reminder,
  Task,
  TaskKind,
  TaskPriority,
  TaskStatus,
  Weekday,
} from '../../core/models/types'
import { t, type MessageKey } from '../../i18n'
import { formatWeek } from '../../i18n/format'
import { uzWeekdaysShort } from '../../i18n/uz'
import { getPermission, requestPermission } from '../../platform/notifications'
import { CloseIcon } from '../../ui/icons'
import { useToast } from '../../ui/toastContext'
import { changeStatus, deleteTask } from './actions'
import { describeTaskPlace } from './describe'
import { TaskNotes } from './TaskNotes'

/** Values a new task starts with, e.g. the tab and day the user was looking at. */
export interface TaskDefaults {
  kind: TaskKind
  date?: DateKey
}

type RepeatMode = 'none' | RecurrenceRule['freq']

interface Draft {
  title: string
  notes: string
  kind: TaskKind
  date: DateKey
  week: DateKey
  month: string
  startDate: DateKey
  endDate: DateKey
  priority: TaskPriority
  status: TaskStatus
  repeat: RepeatMode
  interval: number
  weekdays: Weekday[]
  until: string
  reminders: Reminder[]
}

const KINDS: TaskKind[] = ['daily', 'weekly', 'monthly', 'range', 'general']
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high']
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'skipped']
const REPEAT_MODES: RepeatMode[] = ['none', 'daily', 'weekly', 'monthly']
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7]
const REMINDER_LEADS = [0, 1, 2, 3, 7]
const NEW_REMINDER: Reminder = { time: '09:00', daysBefore: 0 }

function draftFrom(task: Task | undefined, defaults: TaskDefaults): Draft {
  const day = defaults.date ?? todayKey()
  const date = task?.date ?? task?.startDate ?? day
  return {
    title: task?.title ?? '',
    notes: task?.notes ?? '',
    kind: task?.kind ?? defaults.kind,
    date,
    week: task?.weekStart ?? weekStartOf(day),
    month: task?.month ?? monthKeyOf(day),
    startDate: task?.startDate ?? day,
    endDate: task?.endDate ?? day,
    priority: task?.priority ?? 'normal',
    status: task?.status ?? 'todo',
    repeat: task?.recurrence?.freq ?? 'none',
    interval: task?.recurrence?.interval ?? 1,
    weekdays: [...(task?.recurrence?.weekdays ?? [weekdayOf(date)])],
    until: task?.recurrence?.until ?? '',
    reminders: (task?.reminders ?? []).map((reminder) => ({ ...reminder })),
  }
}

function recurrenceFrom(draft: Draft): RecurrenceRule | null {
  if (draft.kind !== 'daily' || draft.repeat === 'none') return null
  const rule: RecurrenceRule = { freq: draft.repeat, interval: Math.max(1, Math.floor(draft.interval) || 1) }
  if (draft.repeat === 'weekly') rule.weekdays = [...draft.weekdays].sort()
  if (draft.repeat === 'monthly') rule.monthDay = parseDateKey(draft.date).getDate()
  if (draft.until) rule.until = draft.until
  return rule
}

/** Turns the form into task fields; only the date fields of the chosen kind are kept. */
function taskFieldsFrom(draft: Draft) {
  return buildTask({
    title: draft.title,
    notes: draft.notes.trim(),
    kind: draft.kind,
    priority: draft.priority,
    date: draft.kind === 'daily' ? draft.date : null,
    weekStart: draft.kind === 'weekly' ? draft.week : null,
    month: draft.kind === 'monthly' ? draft.month : null,
    startDate: draft.kind === 'range' ? draft.startDate : null,
    endDate: draft.kind === 'range' ? draft.endDate : null,
    recurrence: recurrenceFrom(draft),
    reminders: draft.kind === 'general' ? [] : draft.reminders,
  })
}

interface TaskFormProps {
  task?: Task
  defaults: TaskDefaults
  onDone: () => void
  /** Reports whether the form has unsaved changes, so closing the sheet can ask first. */
  onDirtyChange: (dirty: boolean) => void
  /** True while the "unsaved changes" panel is shown. */
  confirmingClose: boolean
  onKeepEditing: () => void
}

export function TaskForm({
  task,
  defaults,
  onDone,
  onDirtyChange,
  confirmingClose,
  onKeepEditing,
}: TaskFormProps) {
  const initial = useMemo(() => draftFrom(task, defaults), [task, defaults])
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState<MessageKey | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)
  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
    setSaveError(null)
  }

  const isRecurring = draft.kind === 'daily' && draft.repeat !== 'none'

  const setReminder = (index: number, changes: Partial<Reminder>) =>
    set(
      'reminders',
      draft.reminders.map((reminder, i) => (i === index ? { ...reminder, ...changes } : reminder)),
    )

  async function addReminder() {
    set('reminders', [...draft.reminders, { ...NEW_REMINDER }])
    // Ask for notification permission the first time it is actually needed.
    if ((await getPermission()) === 'prompt') await requestPermission()
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!draft.title.trim()) return setError('task.error.title')
    if (draft.kind === 'range' && draft.endDate < draft.startDate) return setError('task.error.range')
    // A weekly repeat with no weekday picked falls back to the task's own weekday.
    const final =
      draft.repeat === 'weekly' && draft.weekdays.length === 0
        ? { ...draft, weekdays: [weekdayOf(draft.date)] }
        : draft

    setSaving(true)
    try {
      const fields = taskFieldsFrom(final)
      if (task) {
        const { status: _status, completedAt: _completedAt, order: _order, ...changes } = fields
        const updated = await updateTask(db, task.id, changes)
        if (!updated.recurrence && final.status !== task.status) {
          await changeStatus(db, updated, final.status)
        }
        toast.show(t('task.saved'))
      } else {
        const created = await createTask(db, { ...fields, order: Date.now() })
        toast.show(t('task.added', { where: describeTaskPlace(created) }))
      }
      onDone()
    } catch (err) {
      setSaveError(t('task.saveFailed', { error: err instanceof Error ? err.message : String(err) }))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!task) return
    if (!confirmDelete) return setConfirmDelete(true)
    try {
      await deleteTask(db, task.id)
      toast.show(t('task.deleted'))
      onDone()
    } catch (err) {
      setSaveError(t('task.saveFailed', { error: err instanceof Error ? err.message : String(err) }))
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <label className="field">
        <span className="field__label">{t('task.title')}</span>
        <input
          className="input"
          value={draft.title}
          onChange={(event) => set('title', event.target.value)}
          placeholder={t('task.titlePlaceholder')}
          autoFocus={!task}
          enterKeyHint="done"
          aria-invalid={error === 'task.error.title'}
        />
      </label>

      <div className="field">
        <span className="field__label">{t('task.kind')}</span>
        <div className="chips" role="group" aria-label={t('task.kind')}>
          {KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              className="chip"
              aria-pressed={draft.kind === kind}
              onClick={() => set('kind', kind)}
            >
              {t(`kind.${kind}`)}
            </button>
          ))}
        </div>
      </div>

      {draft.kind === 'daily' && (
        <label className="field">
          <span className="field__label">{t('task.date')}</span>
          <input
            className="input"
            type="date"
            required
            value={draft.date}
            onChange={(event) => event.target.value && set('date', event.target.value)}
          />
        </label>
      )}

      {draft.kind === 'weekly' && (
        <label className="field">
          <span className="field__label">{t('task.week')}</span>
          <input
            className="input"
            type="date"
            required
            value={draft.week}
            onChange={(event) => event.target.value && set('week', weekStartOf(event.target.value))}
          />
          <span className="field__hint">{formatWeek(draft.week)}</span>
        </label>
      )}

      {draft.kind === 'monthly' && (
        <label className="field">
          <span className="field__label">{t('task.month')}</span>
          <input
            className="input"
            type="month"
            required
            value={draft.month}
            onChange={(event) => event.target.value && set('month', event.target.value)}
          />
        </label>
      )}

      {draft.kind === 'range' && (
        <div className="field-row">
          <label className="field">
            <span className="field__label">{t('task.startDate')}</span>
            <input
              className="input"
              type="date"
              required
              value={draft.startDate}
              onChange={(event) => event.target.value && set('startDate', event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">{t('task.endDate')}</span>
            <input
              className="input"
              type="date"
              required
              min={draft.startDate}
              value={draft.endDate}
              aria-invalid={error === 'task.error.range'}
              onChange={(event) => event.target.value && set('endDate', event.target.value)}
            />
          </label>
        </div>
      )}

      {draft.kind === 'daily' && (
        <div className="field">
          <span className="field__label">{t('task.repeat')}</span>
          <div className="chips" role="group" aria-label={t('task.repeat')}>
            {REPEAT_MODES.map((mode) => (
              <button
                key={mode}
                type="button"
                className="chip"
                aria-pressed={draft.repeat === mode}
                onClick={() => set('repeat', mode)}
              >
                {t(`repeat.${mode}`)}
              </button>
            ))}
          </div>

          {draft.repeat === 'weekly' && (
            <div className="chips" role="group" aria-label={t('repeat.weekly')}>
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  className="chip"
                  aria-pressed={draft.weekdays.includes(day)}
                  onClick={() =>
                    set(
                      'weekdays',
                      draft.weekdays.includes(day)
                        ? draft.weekdays.filter((d) => d !== day)
                        : [...draft.weekdays, day],
                    )
                  }
                >
                  {uzWeekdaysShort[day - 1]}
                </button>
              ))}
            </div>
          )}

          {draft.repeat !== 'none' && (
            <div className="field-row">
              <label className="field">
                <span className="field__label">{t(`repeat.interval.${draft.repeat}`)}</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={365}
                  value={draft.interval}
                  onChange={(event) => set('interval', Number(event.target.value))}
                />
              </label>
              <label className="field">
                <span className="field__label">{t('repeat.until')}</span>
                <input
                  className="input"
                  type="date"
                  min={draft.date}
                  value={draft.until}
                  onChange={(event) => set('until', event.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {draft.kind !== 'general' && (
        <div className="field">
          <span className="field__label">{t('task.reminders')}</span>
          <span className="field__hint">{t(`task.reminderHint.${draft.kind}`)}</span>
          {draft.reminders.map((reminder, index) => (
            <div key={index} className="reminder-row">
              <input
                className="input"
                type="time"
                aria-label={t('task.reminderTime')}
                value={reminder.time}
                onChange={(event) => event.target.value && setReminder(index, { time: event.target.value })}
              />
              <select
                className="input"
                aria-label={t('task.reminderWhen')}
                value={reminder.daysBefore}
                onChange={(event) => setReminder(index, { daysBefore: Number(event.target.value) })}
              >
                {REMINDER_LEADS.map((days) => (
                  <option key={days} value={days}>
                    {days === 0 ? t('reminder.sameDay') : t('reminder.daysBefore', { days })}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="icon-btn"
                aria-label={t('task.removeReminder')}
                onClick={() => set('reminders', draft.reminders.filter((_, i) => i !== index))}
              >
                <CloseIcon size={20} />
              </button>
            </div>
          ))}
          <button type="button" className="btn add-reminder" onClick={() => void addReminder()}>
            {t('task.addReminder')}
          </button>
        </div>
      )}

      <div className="field">
        <span className="field__label">{t('task.priority')}</span>
        <div className="chips" role="group" aria-label={t('task.priority')}>
          {PRIORITIES.map((priority) => (
            <button
              key={priority}
              type="button"
              className="chip"
              aria-pressed={draft.priority === priority}
              onClick={() => set('priority', priority)}
            >
              {t(`priority.${priority}`)}
            </button>
          ))}
        </div>
      </div>

      {task && !isRecurring && (
        <div className="field">
          <span className="field__label">{t('task.status')}</span>
          <div className="chips" role="group" aria-label={t('task.status')}>
            {STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className="chip"
                aria-pressed={draft.status === status}
                onClick={() => set('status', status)}
              >
                {t(`status.${status}`)}
              </button>
            ))}
          </div>
        </div>
      )}
      {task && isRecurring && <p className="field__hint field__hint--block">{t('task.recurringStatusNote')}</p>}

      {task && <TaskNotes taskId={task.id} dirty={dirty} onLeave={onDone} />}

      <label className="field">
        <span className="field__label">{t('task.notes')}</span>
        <textarea
          className="input"
          value={draft.notes}
          onChange={(event) => set('notes', event.target.value)}
          placeholder={t('task.notesPlaceholder')}
        />
      </label>

      {task && (
        <button type="button" className="btn btn--danger btn--block" onClick={remove}>
          {confirmDelete ? t('task.deleteConfirm') : t('task.delete')}
        </button>
      )}

      <div className="form-actions">
        {(error || saveError) && (
          <p className="form-error" role="alert">
            {error ? t(error) : saveError}
          </p>
        )}
        {confirmingClose && (
          <div className="unsaved" role="alertdialog" aria-labelledby="unsaved-title">
            <p id="unsaved-title" className="unsaved__title">
              {t('task.unsaved')}
            </p>
            <p className="field__hint">{t('task.unsavedHint')}</p>
            <div className="unsaved__buttons">
              <button type="button" className="btn" onClick={onKeepEditing}>
                {t('task.keepEditing')}
              </button>
              <button type="button" className="btn btn--danger" onClick={onDone}>
                {t('task.discard')}
              </button>
            </div>
          </div>
        )}
        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {t('task.save')}
        </button>
      </div>
    </form>
  )
}
