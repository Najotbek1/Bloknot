import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import type { DateKey, MonthKey } from '../../core/models/types'
import { getDayAgenda, getGeneralTasks, getMonthTasks, getRangeTasks, getWeekTasks } from '../../core/queries'
import { t } from '../../i18n'
import { formatRange } from '../../i18n/format'
import { rangeElapsed, rangeHint, rangePhase, type RangePhase } from '../tasks/labels'
import { agendaRows, taskRows, type TaskRow } from '../tasks/rows'
import { TaskRows } from '../tasks/TaskRows'

/** Plan lists shared by the list view and the calendar view of the Calendar tab. */


export function Rows({ rows, empty }: { rows: TaskRow[] | undefined; empty: string }) {
  if (!rows) return null
  if (rows.length === 0) return <p className="card empty">{empty}</p>
  return <TaskRows rows={rows} />
}

export function DayList({ day, today }: { day: DateKey; today: DateKey }) {
  const agenda = useLiveQuery(() => getDayAgenda(db, day), [day])
  return <Rows rows={agenda && agendaRows(agenda, today)} empty={t('plan.empty.daily')} />
}

export function WeekList({ day }: { day: DateKey }) {
  const tasks = useLiveQuery(() => getWeekTasks(db, day), [day])
  return <Rows rows={tasks && taskRows(tasks)} empty={t('plan.empty.weekly')} />
}

export function MonthList({ month }: { month: MonthKey }) {
  const tasks = useLiveQuery(() => getMonthTasks(db, month), [month])
  return <Rows rows={tasks && taskRows(tasks)} empty={t('plan.empty.monthly')} />
}

const PHASES: { phase: RangePhase; title: Parameters<typeof t>[0] }[] = [
  { phase: 'active', title: 'plan.activeRange' },
  { phase: 'upcoming', title: 'plan.upcomingRange' },
  { phase: 'finished', title: 'plan.finishedRange' },
]

export function RangeList({ today }: { today: DateKey }) {
  const tasks = useLiveQuery(() => getRangeTasks(db), [])
  if (!tasks) return null
  if (tasks.length === 0) return <p className="card empty section">{t('plan.empty.range')}</p>

  return (
    <>
      {PHASES.map(({ phase, title }) => {
        const rows = tasks
          .filter((task) => rangePhase(task, today) === phase)
          .map((task) => ({
            task,
            status: task.status,
            meta: [formatRange(task.startDate!, task.endDate!), task.status === 'done' ? '' : rangeHint(task, today)]
              .filter(Boolean)
              .join(' · '),
            progress: rangeElapsed(task, today),
          }))
        if (rows.length === 0) return null
        return (
          <section key={phase} className="section">
            <h2 className="section__title">{t(title)}</h2>
            <TaskRows rows={rows} />
          </section>
        )
      })}
    </>
  )
}

export function GeneralList() {
  const tasks = useLiveQuery(() => getGeneralTasks(db), [])
  return (
    <div className="section">
      <Rows rows={tasks && taskRows(tasks)} empty={t('plan.empty.general')} />
    </div>
  )
}
