import { useState, type FormEvent } from 'react'
import { db } from '../../core/db/schema'
import { buildTask, createTask, updateTask } from '../../core/db/tasks'
import { monthKeyOf, parseDateKey, todayKey, weekStartOf, weekdayOf } from '../../core/dates'
import type {
  DateKey,
  RecurrenceRule,
  Task,
  TaskKind,
  TaskPriority,
  TaskStatus,
  Weekday,
} from '../../core/models/types'
import { t, type MessageKey } from '../../i18n'
import { formatWeek } from '../../i18n/format'
import { uzWeekdaysShort } from '../../i18n/uz'
import { changeStatus, deleteTask } from './actions'

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
}

const KINDS: TaskKind[] = ['daily', 'weekly', 'monthly', 'range', 'general']
const PRIORITIES: TaskPriority[] = ['low', 'normal', 'high']
const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done', 'skipped']
const REPEAT_MODES: RepeatMode[] = ['none', 'daily', 'weekly', 'monthly']
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7]

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
  })
}

interface TaskFormProps {
  task?: Task
  defaults: TaskDefaults
  onDone: () => void
}

export function TaskForm({ task, defaults, onDone }: TaskFormProps) {
  const [draft, setDraft] = useState(() => draftFrom(task, defaults))
  const [error, setError] = useState<MessageKey | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setError(null)
  }

  const isRecurring = draft.kind === 'daily' && draft.repeat !== 'none'

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
      } else {
        await createTask(db, { ...fields, order: Date.now() })
      }
      onDone()
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!task) return
    if (!confirmDelete) return setConfirmDelete(true)
    await deleteTask(db, task.id)
    onDone()
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

      <label className="field">
        <span className="field__label">{t('task.notes')}</span>
        <textarea
          className="input"
          value={draft.notes}
          onChange={(event) => set('notes', event.target.value)}
          placeholder={t('task.notesPlaceholder')}
        />
      </label>

      {error && (
        <p className="form-error" role="alert">
          {t(error)}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {t('task.save')}
        </button>
        {task && (
          <button type="button" className="btn btn--danger btn--block" onClick={remove}>
            {confirmDelete ? t('task.deleteConfirm') : t('task.delete')}
          </button>
        )}
      </div>
    </form>
  )
}
