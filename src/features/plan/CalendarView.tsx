import { useLiveQuery } from 'dexie-react-hooks'
import { getMonthSummaries, isInMonth, monthGrid } from '../../core/calendar'
import { db } from '../../core/db/schema'
import { monthKeyOf, parseDateKey, shiftMonth, weekStartOf } from '../../core/dates'
import type { DateKey } from '../../core/models/types'
import { getMonthTasks, getWeekTasks } from '../../core/queries'
import { t } from '../../i18n'
import { formatDayLong, formatMonth, formatWeek } from '../../i18n/format'
import { uzWeekdaysShort } from '../../i18n/uz'
import { Fab } from '../../ui/Fab'
import { BellIcon } from '../../ui/icons'
import { PeriodNav } from '../../ui/PeriodNav'
import { useToday } from '../../ui/useToday'
import { useTaskEditor } from '../tasks/editorContext'
import { taskRows } from '../tasks/rows'
import { TaskRows } from '../tasks/TaskRows'
import { DayReminders } from '../reminders/DayReminders'
import { DayList, GeneralList, RangeList } from './lists'
import type { PlanState } from './PlanScreen'
import './calendar.css'

export type CalendarTab = 'calendar' | 'range' | 'general'

const TABS: CalendarTab[] = ['calendar', 'range', 'general']

const TAB_LABELS = {
  calendar: 'plan.tab.calendar',
  range: 'plan.tab.range',
  general: 'plan.tab.general',
} as const

interface CalendarViewProps {
  state: PlanState
  onChange: (state: PlanState) => void
}

/** Month grid with a dot per plan; tapping a day lists that day's plans below. */
export function CalendarView({ state, onChange }: CalendarViewProps) {
  const today = useToday()
  const editor = useTaskEditor()
  const { calendarTab: tab, day } = state
  const month = monthKeyOf(day)
  const setDay = (next: DateKey) => onChange({ ...state, day: next })

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('plan.title')}</h1>
      </header>

      <div className="segmented" role="tablist" aria-label={t('plan.title')}>
        {TABS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="segmented__item"
            aria-selected={tab === id}
            onClick={() => onChange({ ...state, calendarTab: id })}
          >
            {t(TAB_LABELS[id])}
          </button>
        ))}
      </div>

      {tab === 'calendar' && (
        <>
          <PeriodNav
            label={formatMonth(month)}
            isCurrent={month === monthKeyOf(today) && day === today}
            onPrevious={() => setDay(shiftMonth(month, -1))}
            onNext={() => setDay(shiftMonth(month, 1))}
            onCurrent={() => setDay(today)}
          />
          <MonthGrid month={month} selected={day} today={today} onSelect={setDay} />

          <section className="section">
            <h2 className="section__title">{formatDayLong(day)}</h2>
            <DayList day={day} today={today} />
          </section>
          <DayReminders date={day} />
          <PeriodTasks day={day} />
        </>
      )}

      {tab === 'range' && <RangeList today={today} />}
      {tab === 'general' && <GeneralList />}

      <Fab
        label={t('task.add')}
        onClick={() =>
          editor.openNew({ kind: tab === 'calendar' ? 'daily' : tab, date: tab === 'calendar' ? day : today })
        }
      />
    </main>
  )
}

interface MonthGridProps {
  month: string
  selected: DateKey
  today: DateKey
  onSelect: (day: DateKey) => void
}

function MonthGrid({ month, selected, today, onSelect }: MonthGridProps) {
  const summaries = useLiveQuery(() => getMonthSummaries(db, month), [month])
  const days = monthGrid(month)

  return (
    <div className="card calendar">
      <div className="calendar__weekdays" aria-hidden="true">
        {uzWeekdaysShort.map((name) => (
          <span key={name}>{name}</span>
        ))}
      </div>
      <div className="calendar__grid">
        {days.map((date) => {
          const summary = summaries?.get(date)
          const total = summary?.total ?? 0
          const done = summary?.done ?? 0
          const classes = [
            'calendar__day',
            !isInMonth(date, month) && 'calendar__day--outside',
            date === today && 'calendar__day--today',
            summary?.inRange && 'calendar__day--range',
            total > 0 && done === total && 'calendar__day--done',
          ]
          const reminders = summary?.reminders ?? 0
          const dayLabel =
            total > 0
              ? t('plan.calendar.label', { day: formatDayLong(date), total, done })
              : t('plan.calendar.labelEmpty', { day: formatDayLong(date) })
          return (
            <button
              key={date}
              type="button"
              className={classes.filter(Boolean).join(' ')}
              aria-pressed={date === selected}
              aria-label={reminders > 0 ? t('plan.calendar.labelReminders', { label: dayLabel, count: reminders }) : dayLabel}
              onClick={() => onSelect(date)}
            >
              <span className="calendar__number">{parseDateKey(date).getDate()}</span>
              {reminders > 0 && <BellIcon size={11} className="calendar__bell" />}
              <span className="calendar__dots" aria-hidden="true">
                {Array.from({ length: Math.min(total, 3) }, (_, index) => (
                  <i key={index} />
                ))}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** The week's and the month's plans for the selected day; hidden when there are none. */
function PeriodTasks({ day }: { day: DateKey }) {
  const week = useLiveQuery(() => getWeekTasks(db, day), [day])
  const month = useLiveQuery(() => getMonthTasks(db, monthKeyOf(day)), [day])
  return (
    <>
      {week && week.length > 0 && (
        <section className="section">
          <h2 className="section__title">
            {t('plan.tab.weekly')} · {formatWeek(weekStartOf(day))}
          </h2>
          <TaskRows rows={taskRows(week)} />
        </section>
      )}
      {month && month.length > 0 && (
        <section className="section">
          <h2 className="section__title">
            {t('plan.tab.monthly')} · {formatMonth(monthKeyOf(day))}
          </h2>
          <TaskRows rows={taskRows(month)} />
        </section>
      )}
    </>
  )
}
