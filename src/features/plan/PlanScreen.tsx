import { addMonths } from 'date-fns'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { addDays, monthKeyOf, parseDateKey, toDateKey, weekStartOf } from '../../core/dates'
import type { DateKey, MonthKey, TaskKind } from '../../core/models/types'
import { getDayAgenda, getGeneralTasks, getMonthTasks, getRangeTasks, getWeekTasks } from '../../core/queries'
import { t } from '../../i18n'
import { formatDayLong, formatMonth, formatRange, formatWeek } from '../../i18n/format'
import { Fab } from '../../ui/Fab'
import { PeriodNav } from '../../ui/PeriodNav'
import { useToday } from '../../ui/useToday'
import { useTaskEditor } from '../tasks/editorContext'
import { rangeElapsed, rangeHint, rangePhase, type RangePhase } from '../tasks/labels'
import { agendaRows, taskRows, type TaskRow } from '../tasks/rows'
import { TaskRows } from '../tasks/TaskRows'

/** What the Plan screen shows. Kept by the parent so it survives switching bottom tabs. */
export interface PlanState {
  tab: TaskKind
  /** Selected day (Kun tab); the Hafta and Oy tabs show the week and month containing it. */
  day: DateKey
}

const TABS: TaskKind[] = ['daily', 'weekly', 'monthly', 'range', 'general']

function shiftMonth(month: MonthKey, months: number): DateKey {
  return toDateKey(addMonths(parseDateKey(`${month}-01`), months))
}

interface PlanScreenProps {
  state: PlanState
  onChange: (state: PlanState) => void
}

export function PlanScreen({ state, onChange }: PlanScreenProps) {
  const today = useToday()
  const editor = useTaskEditor()
  const { tab, day } = state
  const setDay = (next: DateKey) => onChange({ ...state, day: next })

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('plan.title')}</h1>
      </header>

      <div className="segmented" role="tablist" aria-label={t('plan.title')}>
        {TABS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            className="segmented__item"
            aria-selected={tab === kind}
            onClick={() => onChange({ ...state, tab: kind })}
          >
            {t(`plan.tab.${kind}`)}
          </button>
        ))}
      </div>

      {tab === 'daily' && (
        <>
          <PeriodNav
            label={formatDayLong(day)}
            isCurrent={day === today}
            onPrevious={() => setDay(addDays(day, -1))}
            onNext={() => setDay(addDays(day, 1))}
            onCurrent={() => setDay(today)}
          />
          <DayList day={day} today={today} />
        </>
      )}

      {tab === 'weekly' && (
        <>
          <PeriodNav
            label={formatWeek(weekStartOf(day))}
            isCurrent={weekStartOf(day) === weekStartOf(today)}
            onPrevious={() => setDay(addDays(day, -7))}
            onNext={() => setDay(addDays(day, 7))}
            onCurrent={() => setDay(today)}
          />
          <WeekList day={day} />
        </>
      )}

      {tab === 'monthly' && (
        <>
          <PeriodNav
            label={formatMonth(monthKeyOf(day))}
            isCurrent={monthKeyOf(day) === monthKeyOf(today)}
            onPrevious={() => setDay(shiftMonth(monthKeyOf(day), -1))}
            onNext={() => setDay(shiftMonth(monthKeyOf(day), 1))}
            onCurrent={() => setDay(today)}
          />
          <MonthList month={monthKeyOf(day)} />
        </>
      )}

      {tab === 'range' && <RangeList today={today} />}
      {tab === 'general' && <GeneralList />}

      <Fab
        label={t('task.add')}
        onClick={() => editor.openNew({ kind: tab, date: tab === 'range' || tab === 'general' ? today : day })}
      />
    </main>
  )
}

function Rows({ rows, empty }: { rows: TaskRow[] | undefined; empty: string }) {
  if (!rows) return null
  if (rows.length === 0) return <p className="card empty">{empty}</p>
  return <TaskRows rows={rows} />
}

function DayList({ day, today }: { day: DateKey; today: DateKey }) {
  const agenda = useLiveQuery(() => getDayAgenda(db, day), [day])
  return <Rows rows={agenda && agendaRows(agenda, today)} empty={t('plan.empty.daily')} />
}

function WeekList({ day }: { day: DateKey }) {
  const tasks = useLiveQuery(() => getWeekTasks(db, day), [day])
  return <Rows rows={tasks && taskRows(tasks)} empty={t('plan.empty.weekly')} />
}

function MonthList({ month }: { month: MonthKey }) {
  const tasks = useLiveQuery(() => getMonthTasks(db, month), [month])
  return <Rows rows={tasks && taskRows(tasks)} empty={t('plan.empty.monthly')} />
}

const PHASES: { phase: RangePhase; title: Parameters<typeof t>[0] }[] = [
  { phase: 'active', title: 'plan.activeRange' },
  { phase: 'upcoming', title: 'plan.upcomingRange' },
  { phase: 'finished', title: 'plan.finishedRange' },
]

function RangeList({ today }: { today: DateKey }) {
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

function GeneralList() {
  const tasks = useLiveQuery(() => getGeneralTasks(db), [])
  return (
    <div className="section">
      <Rows rows={tasks && taskRows(tasks)} empty={t('plan.empty.general')} />
    </div>
  )
}
