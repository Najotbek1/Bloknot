import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { listActive } from '../../core/db/repository'
import { db } from '../../core/db/schema'
import { completionCounts, computeStats, heatmap } from '../../core/stats'
import { t } from '../../i18n'
import { formatDayShort } from '../../i18n/format'
import { useToday } from '../../ui/useToday'
import { DailyBars } from './DailyBars'
import { Heatmap } from './Heatmap'
import { KindBreakdown } from './KindBreakdown'
import { ScoreRing } from './ScoreRing'
import { StatTile } from './StatTile'
import './stats.css'

const PERIODS = [7, 30] as const

const percent = (rate: number | null) => (rate === null ? '—' : `${Math.round(rate * 100)}%`)

export function StatsScreen() {
  const today = useToday()
  const [days, setDays] = useState<(typeof PERIODS)[number]>(7)
  const [showTable, setShowTable] = useState(false)
  const snapshot = useLiveQuery(async () => {
    const [tasks, occurrences] = await Promise.all([listActive(db.tasks), listActive(db.occurrences)])
    return { tasks, occurrences }
  }, [])

  const stats = useMemo(() => snapshot && computeStats(snapshot, today, days), [snapshot, today, days])
  const cells = useMemo(() => snapshot && heatmap(completionCounts(snapshot), today), [snapshot, today])

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

      {stats && cells && (
        <>
          <div className="section">
            <ScoreRing score={stats.score} />
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
                  sub={t('stats.activeDaysSub', { days })}
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
            </>
          )}

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
