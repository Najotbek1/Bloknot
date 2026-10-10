import { useState } from 'react'
import type { WeekdayStat } from '../../core/stats'
import { t } from '../../i18n'
import { uzWeekdays, uzWeekdaysShort } from '../../i18n/uz'

/** Completion rate per weekday as seven columns; the best day is highlighted, tap for numbers. */
export function WeekdayChart({ rows }: { rows: WeekdayStat[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  const rate = (row: WeekdayStat) => (row.total > 0 ? row.done / row.total : null)
  const best = rows.reduce<WeekdayStat | null>((top, row) => {
    const value = rate(row)
    if (value === null || value === 0) return top
    return top === null || value > (rate(top) ?? 0) ? row : top
  }, null)
  const current = rows.find((row) => row.weekday === selected)
  const name = (row: WeekdayStat) => uzWeekdays[row.weekday - 1]

  return (
    <div>
      <div className="weekday-chart" role="group" aria-label={t('stats.weekdays')}>
        {rows.map((row) => {
          const value = rate(row)
          const label =
            row.total > 0
              ? t('stats.weekdayDetail', { day: name(row), done: row.done, total: row.total })
              : t('stats.weekdayNone', { day: name(row) })
          return (
            <button
              key={row.weekday}
              type="button"
              className="weekday-chart__col"
              aria-label={label}
              aria-pressed={selected === row.weekday}
              onClick={() => setSelected(selected === row.weekday ? null : row.weekday)}
            >
              <span className="weekday-chart__value">{value === null ? '—' : `${Math.round(value * 100)}%`}</span>
              <span className="weekday-chart__track">
                <span
                  className={`weekday-chart__bar ${best?.weekday === row.weekday ? 'is-best' : ''}`}
                  style={{ height: `${(value ?? 0) * 100}%` }}
                />
              </span>
              <span className="weekday-chart__label">{uzWeekdaysShort[row.weekday - 1]}</span>
            </button>
          )
        })}
      </div>
      <p className="chart-detail chart-detail--below" aria-live="polite">
        {current
          ? current.total > 0
            ? t('stats.weekdayDetail', { day: name(current), done: current.done, total: current.total })
            : t('stats.weekdayNone', { day: name(current) })
          : best
            ? t('stats.weekdayBest', { day: name(best) })
            : t('stats.dailyHint')}
      </p>
    </div>
  )
}
