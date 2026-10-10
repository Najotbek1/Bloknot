import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { addDays, monthKeyOf, shiftMonth, weekStartOf } from '../../core/dates'
import { getSettings } from '../../core/db/tasks'
import type { DateKey, TaskKind } from '../../core/models/types'
import { t } from '../../i18n'
import { formatDayLong, formatMonth, formatWeek } from '../../i18n/format'
import { Fab } from '../../ui/Fab'
import { PeriodNav } from '../../ui/PeriodNav'
import { useToday } from '../../ui/useToday'
import { useTaskEditor } from '../tasks/editorContext'
import { CalendarView, type CalendarTab } from './CalendarView'
import { DayList, GeneralList, MonthList, RangeList, WeekList } from './lists'

/** What the Calendar tab shows. Kept by the parent so it survives switching bottom tabs. */
export interface PlanState {
  /** Tab of the list view. */
  tab: TaskKind
  /** Tab of the calendar view. */
  calendarTab: CalendarTab
  /** Selected day; the week and month views show the week and month containing it. */
  day: DateKey
}

const TABS: TaskKind[] = ['daily', 'weekly', 'monthly', 'range', 'general']

interface PlanScreenProps {
  state: PlanState
  onChange: (state: PlanState) => void
}

export function PlanScreen({ state, onChange }: PlanScreenProps) {
  const settings = useLiveQuery(() => getSettings(db), [])
  if (!settings) return null
  return settings.planView === 'list' ? (
    <ListView state={state} onChange={onChange} />
  ) : (
    <CalendarView state={state} onChange={onChange} />
  )
}

/** The plans as lists by day, week, month, range and general. */
function ListView({ state, onChange }: PlanScreenProps) {
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
