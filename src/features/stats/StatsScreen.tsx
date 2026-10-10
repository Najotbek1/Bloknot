import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { listActive } from '../../core/db/repository'
import { db } from '../../core/db/schema'
import { coachTone } from '../../core/coach'
import { getSettings } from '../../core/db/tasks'
import {
  completionCounts,
  computeStats,
  dayPartCounts,
  heatmap,
  overdueTasks,
  previousStats,
  weekdayStats,
} from '../../core/stats'
import { t } from '../../i18n'
import { formatDayShort } from '../../i18n/format'
import { useToday } from '../../ui/useToday'
import { taskRows } from '../tasks/rows'
import { TaskRows } from '../tasks/TaskRows'
import { DailyBars } from './DailyBars'
import { DayParts } from './DayParts'
import { Heatmap } from './Heatmap'
import { KindBreakdown } from './KindBreakdown'
import { ScoreRing } from './ScoreRing'
import { StatTile } from './StatTile'
import { WeekdayChart } from './WeekdayChart'
import './stats.css'

const PERIODS = [7, 30] as const

const percent = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`)

export function StatsScreen() {
  const today = useToday()
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7)
  const [showTable, setShowTable] = useState(false)
  const [showOverdue, setShowOverdue] = useState(false)
  const settings = useLiveQuery(() => getSettings(db), [])
  const snapshot = useLiveQuery(async () => {
    const [tasks, occurrences] = await Promise.all([listActive(db.tasks), listActive(db.occurrences)])
    return { tasks, occurrences }
  }, [])

  const stats = useMemo(() => snapshot && computeStats(snapshot, today, days), [snapshot, today, days])
  const cells = useMemo(() => snapshot && heatmap(completionCounts(snapshot), today), [snapshot, today])
  const extra = useMemo(
    () =>
      snapshot && {
        previous: previousStats(snapshot, today, days),
        // The coach always judges the last 7 days, whatever period is shown.
        coachScore: computeStats(snapshot, today, 7).score,
        weekdays: weekdayStats(snapshot, today, days),
        dayParts: dayPartCounts(snapshot, today, days),
        overdue: overdueTasks(snapshot, today),
      },
    [snapshot, today, days],
  )

  return (
    <main className="screen">
      <header className="screen__header">
        <h1 className="screen__title">{t('stats.title')}</h1>
      </header>

      <div className="segmented" role="group" aria-label={t('stats.period')}>
        {PERIODS.map((period) => (
          <button
            key={period}
            type="button"
            className="segmented__item"
            aria-pressed={days === period}
            onClick={() => setDays(period)}
          >
            {t('stats.days', { days: period })}
          </button>
        ))}
      </div>

      {stats && cells && extra && (
        <>
          <div className="section">
            <ScoreRing score={stats.score} />
            <div className="score-notes">
              <ScoreDelta now={stats.score} before={extra.previous.score} days={days} />
              <p>
                {settings?.coachMode === false
                  ? t('stats.coach.off')
                  : [t(`stats.coach.${coachTone(extra.coachScore)}`), days === 7 ? null : t('stats.coach.weekNote')]
                      .filter(Boolean)
                      .join(' ')}
              </p>
              {stats.pendingToday > 0 && <p>{t('stats.pendingToday', { count: stats.pendingToday })}</p>}
            </div>
          </div>

          {stats.planned === 0 && stats.activeDays === 0 ? (
            <p className="card empty section">{t('stats.empty')}</p>
          ) : (
            <>
              <div className="stat-grid section">
                <StatTile
                  label={t('stats.completion')}
                  value={percent(stats.completionRate)}
                  sub={t('stats.completionSub', { done: stats.done, planned: stats.planned })}
                />
                <StatTile label={t('stats.onTime')} value={percent(stats.onTimeRate)} sub={t('stats.onTimeSub')} />
                <StatTile
                  label={t('stats.activeDays')}
                  value={`${stats.activeDays}`}
                  sub={
                    stats.activeSpan < days
                      ? t('stats.activeDaysSubSince', { days: stats.activeSpan })
                      : t('stats.activeDaysSub', { days })
                  }
                />
                <StatTile
                  label={t('stats.streak')}
                  value={t('stats.streakValue', { days: stats.streak })}
                  sub={t('stats.streakSub', { best: stats.bestStreak })}
                />
              </div>

              <section className="section">
                <h2 className="section__title">{t('stats.daily')}</h2>
                <div className="card chart-card">
                  <DailyBars series={stats.series} />
                </div>
              </section>

              <section className="section">
                <h2 className="section__title">{t('stats.byKind')}</h2>
                <KindBreakdown byKind={stats.byKind} />
              </section>

              <section className="section">
                <h2 className="section__title">{t('stats.weekdays')}</h2>
                <div className="card">
                  <WeekdayChart rows={extra.weekdays} />
                </div>
              </section>

              {Object.values(extra.dayParts).some((count) => count > 0) && (
                <section className="section">
                  <h2 className="section__title">{t('stats.dayParts')}</h2>
                  <DayParts counts={extra.dayParts} />
                </section>
              )}
            </>
          )}

          <section className="section">
            <h2 className="section__title">{t('stats.overdue')}</h2>
            {extra.overdue.length === 0 ? (
              <p className="card empty">{t('stats.overdueNone')}</p>
            ) : (
              <>
                <button
                  type="button"
                  className="card overdue-card"
                  aria-expanded={showOverdue}
                  onClick={() => setShowOverdue(!showOverdue)}
                >
                  <span className="overdue-card__count">{extra.overdue.length}</span>
                  <span className="overdue-card__text">
                    {t('stats.overdueCount', { count: extra.overdue.length })}
                  </span>
                </button>
                {showOverdue && (
                  <div className="overdue-list">
                    <TaskRows rows={taskRows(extra.overdue)} />
                  </div>
                )}
              </>
            )}
          </section>

          <section className="section">
            <h2 className="section__title">{t('stats.heatmap')}</h2>
            <div className="card chart-card">
              <Heatmap columns={cells} />
            </div>
          </section>

          <section className="section">
            <button type="button" className="btn btn--block" onClick={() => setShowTable(!showTable)}>
              {showTable ? t('stats.hideTable') : t('stats.showTable')}
            </button>
            {showTable && (
              <table className="card stats-table">
                <thead>
                  <tr>
                    <th scope="col">{t('stats.table.date')}</th>
                    <th scope="col">{t('stats.planned')}</th>
                    <th scope="col">{t('stats.doneLegend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...stats.series].reverse().map((day) => (
                    <tr key={day.date}>
                      <td>{formatDayShort(day.date)}</td>
                      <td>{day.planned}</td>
                      <td>{day.done}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </main>
  )
}

/** "+12 o'tgan 7 kunga nisbatan": the score against the period before; hidden without both. */
function ScoreDelta({ now, before, days }: { now: number | null; before: number | null; days: number }) {
  if (now === null || before === null) return null
  const diff = now - before
  if (diff === 0) return <p>{t('stats.delta.same', { days })}</p>
  return (
    <p className={diff > 0 ? 'score-delta--up' : 'score-delta--down'}>
      {t(diff > 0 ? 'stats.delta.up' : 'stats.delta.down', { value: Math.abs(diff), days })}
    </p>
  )
}
