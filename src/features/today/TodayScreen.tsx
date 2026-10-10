import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { monthKeyOf } from '../../core/dates'
import { getDayAgenda, getMonthTasks, getWeekTasks } from '../../core/queries'
import { t } from '../../i18n'
import { formatDayLong } from '../../i18n/format'
import { Fab } from '../../ui/Fab'
import { useToday } from '../../ui/useToday'
import { useNotificationPermission } from '../notifications/usePermission'
import { useTaskEditor } from '../tasks/editorContext'
import { agendaRows, taskRows } from '../tasks/rows'
import { TaskRows } from '../tasks/TaskRows'

export function TodayScreen() {
  const today = useToday()
  const editor = useTaskEditor()
  const { permission, request } = useNotificationPermission()
  const agenda = useLiveQuery(() => getDayAgenda(db, today), [today])
  const week = useLiveQuery(() => getWeekTasks(db, today), [today])
  const month = useLiveQuery(() => getMonthTasks(db, monthKeyOf(today)), [today])

  const counted = agenda?.filter((item) => item.status !== 'skipped') ?? []
  const done = counted.filter((item) => item.status === 'done').length
  const total = counted.length

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('today.title')}</h1>
        <p className="screen__subtitle">{formatDayLong(today)}</p>
      </header>

      {permission === 'prompt' && (
        <div className="notice">
          <p>{t('today.enableNotifications')}</p>
          <button type="button" className="btn btn--primary" onClick={() => void request()}>
            {t('settings.notify.allow')}
          </button>
        </div>
      )}

      {agenda && agenda.length > 0 && (
        <div className="card summary-card">
          <p className="summary-card__text">
            {total > 0 && done === total ? t('today.allDone') : t('today.progress', { done, total })}
          </p>
          <div
            className="progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <div className="progress__bar" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      <section className="section">
        {agenda?.length === 0 && <p className="card empty">{t('today.empty')}</p>}
        {agenda && agenda.length > 0 && <TaskRows rows={agendaRows(agenda, today)} />}
      </section>

      {week && week.length > 0 && (
        <section className="section">
          <h2 className="section__title">{t('today.thisWeek')}</h2>
          <TaskRows rows={taskRows(week)} />
        </section>
      )}

      {month && month.length > 0 && (
        <section className="section">
          <h2 className="section__title">{t('today.thisMonth')}</h2>
          <TaskRows rows={taskRows(month)} />
        </section>
      )}

      <Fab label={t('task.add')} onClick={() => editor.openNew({ kind: 'daily', date: today })} />
    </main>
  )
}
